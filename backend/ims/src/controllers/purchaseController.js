// const Purchase = require("../models/Purchase");
// const Product = require("../models/Product");
// const asyncHandler = require("../utils/asyncHandler");
// const { changeStock } = require("../services/inventoryService");

// // GET /purchases
// const listPurchases = asyncHandler(async (req, res) => {
//   const purchases = await Purchase.find({})
//     .populate("supplier", "name phone")
//     .populate("items.product", "name sku")
//     .sort({ createdAt: -1 });
//   res.json({ data: purchases });
// });

// // POST /purchases
// const createPurchase = asyncHandler(async (req, res) => {
//   const { supplierId, items, notes } = req.body;

//   if (!items || !items.length) {
//     res.status(400);
//     throw new Error("At least one purchase item is required");
//   }

//   const normalizedItems = [];
//   let totalAmount = 0;

//   for (const item of items) {
//     const product = await Product.findById(item.productId);
//     if (!product) {
//       res.status(404);
//       throw new Error(`Product not found: ${item.productId}`);
//     }

//     const lineTotal = Number(item.quantity) * Number(item.unitCost);
//     normalizedItems.push({
//       product: product._id,
//       quantity: Number(item.quantity),
//       unitCost: Number(item.unitCost),
//       lineTotal
//     });

//     totalAmount += lineTotal;
//   }

//   const purchase = await Purchase.create({
//     supplier: supplierId,
//     items: normalizedItems,
//     totalAmount,
//     notes: notes || "",
//     status: "received", // FIX: track purchase status
//     createdBy: req.user._id
//   });

//   // Update stock for each item
//   for (const item of normalizedItems) {
//     await changeStock({
//       productId: item.product,
//       quantityChange: Number(item.quantity),
//       movementType: "purchase",
//       reason: "Purchase received",
//       referenceModel: "Purchase",
//       referenceId: purchase._id,
//       userId: req.user._id
//     });
//   }

//   res.status(201).json(purchase);
// });

// // PUT /purchases/:id/status
// const updatePurchaseStatus = asyncHandler(async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ["pending", "received", "cancelled"];

//   if (!validStatuses.includes(status)) {
//     res.status(400);
//     throw new Error("Invalid status");
//   }

//   const purchase = await Purchase.findByIdAndUpdate(
//     req.params.id,
//     { status },
//     { new: true }
//   ).populate("supplier", "name phone");

//   if (!purchase) {
//     res.status(404);
//     throw new Error("Purchase not found");
//   }

//   res.json(purchase);
// });

// module.exports = { listPurchases, createPurchase, updatePurchaseStatus };

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { changeStock } = require("../services/inventoryService");

// GET /purchases
const listPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({})
    .populate("supplier", "name phone")
    .populate("items.product", "name sku category")
    .sort({ createdAt: -1 });
  res.json({ data: purchases });
});

// POST /purchases
const createPurchase = asyncHandler(async (req, res) => {
  const { supplierId, items, notes, billType, gstNumber } = req.body;

  if (!items || !items.length) {
    res.status(400);
    throw new Error("At least one purchase item is required");
  }

  // Validate GST number if billType is gst
  if (billType === "gst" && !gstNumber) {
    res.status(400);
    throw new Error("GST number is required for GST bills");
  }

  const normalizedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    }

    const lineTotal = Number(item.quantity) * Number(item.unitCost);
    normalizedItems.push({
      product: product._id,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      lineTotal
    });

    totalAmount += lineTotal;
  }

  const purchase = await Purchase.create({
    supplier: supplierId,
    items: normalizedItems,
    totalAmount,
    notes: notes || "",
    status: "received",
    // NEW: save billType and gstNumber
    billType: billType || "non-gst",
    gstNumber: billType === "gst" ? (gstNumber || "").toUpperCase().trim() : "",
    createdBy: req.user._id
  });

  // Update stock for each item
  for (const item of normalizedItems) {
    await changeStock({
      productId: item.product,
      quantityChange: Number(item.quantity),
      movementType: "purchase",
      reason: "Purchase received",
      referenceModel: "Purchase",
      referenceId: purchase._id,
      userId: req.user._id
    });
  }

  res.status(201).json(purchase);
});

// PUT /purchases/:id/status
const updatePurchaseStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "received", "cancelled"];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const purchase = await Purchase.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("supplier", "name phone");

  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }

  res.json(purchase);
});

module.exports = { listPurchases, createPurchase, updatePurchaseStatus };