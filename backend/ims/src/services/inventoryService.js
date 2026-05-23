import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

const lowStockListeners = [];

const onLowStock = (callback) => {
  lowStockListeners.push(callback);
};

const ensureInventoryDoc = async (productId) => {
  let doc = await Inventory.findOne({ product: productId });
  if (!doc) {
    doc = await Inventory.create({ product: productId, quantity: 0 });
  }
  return doc;
};

const changeStock = async ({
  productId,
  clinicId,           // ← added
  quantityChange,
  movementType,
  reason,
  referenceModel,
  referenceId,
  userId
}) => {
  const product = await Product.findById(productId).orFail(() => new Error("Product not found"));

  const inventory = await ensureInventoryDoc(productId);
  const nextQty = Number(inventory.quantity) + Number(quantityChange);

  if (nextQty < 0) {
    throw new Error(`Insufficient stock for "${product.name}". Available: ${inventory.quantity}`);
  }

  inventory.quantity = nextQty;
  inventory.updatedBy = userId;
  await inventory.save();

  await StockMovement.create({
    product: productId,
    clinicId,           // ← added
    movementType,
    quantityChange,
    reason,
    referenceModel,
    referenceId,
    performedBy: userId
  });

  const threshold = Number(product.lowStockThreshold || 5);
  if (nextQty <= threshold) {
    const event = {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      quantity: nextQty,
      threshold,
      outOfStock: nextQty === 0
    };
    console.warn(
      `[LOW STOCK] ${product.name} (SKU: ${product.sku}) — qty: ${nextQty}${nextQty === 0 ? " OUT OF STOCK" : ""}`
    );
    lowStockListeners.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error("[LOW STOCK] Listener error:", e.message);
      }
    });
  }

  return inventory;
};

export { changeStock, onLowStock };