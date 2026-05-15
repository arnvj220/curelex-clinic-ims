const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

// In-memory low-stock event listeners (can be extended to email/SMS later)
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
    movementType,
    quantityChange,
    reason,
    referenceModel,
    referenceId,
    performedBy: userId
  });

  // FIXED: fire low-stock notifications after every stock change
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
    // Console warning (always)
    console.warn(
      `[LOW STOCK] ${product.name} (SKU: ${product.sku}) — qty: ${nextQty}${nextQty === 0 ? " OUT OF STOCK" : ""}`
    );
    // Fire any registered listeners
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

module.exports = { changeStock, onLowStock };