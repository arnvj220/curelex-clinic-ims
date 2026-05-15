const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { changeStock } = require("../services/inventoryService");

// GET /inventory
const listInventory = asyncHandler(async (req, res) => {
  const docs = await Inventory.find({})
    .populate("product", "name sku category lowStockThreshold")
    .sort({ updatedAt: -1 });

  const data = docs.map((entry) => ({
    id: entry._id,
    product: entry.product,
    quantity: entry.quantity,
    lowStock: entry.product ? entry.quantity <= entry.product.lowStockThreshold : false,
    outOfStock: entry.quantity === 0,
    updatedAt: entry.updatedAt
  }));

  res.json({ data });
});

// POST /inventory/adjust
const adjustInventory = asyncHandler(async (req, res) => {
  const { productId, adjustment, reason } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updated = await changeStock({
    productId,
    quantityChange: Number(adjustment),
    movementType: "adjustment",
    reason: reason || "manual adjustment",
    referenceModel: "Inventory",
    referenceId: productId,
    userId: req.user._id
  });

  res.json({ message: "Stock adjusted", data: updated });
});

// GET /inventory/low-stock
const lowStock = asyncHandler(async (req, res) => {
  const docs = await Inventory.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $match: {
        $expr: { $lte: ["$quantity", "$product.lowStockThreshold"] }
      }
    }
  ]);

  res.json({ data: docs, count: docs.length });
});

module.exports = { listInventory, adjustInventory, lowStock };