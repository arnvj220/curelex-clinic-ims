const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const asyncHandler = require("../utils/asyncHandler");

// GET /suppliers
const listSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
  res.json({ data: suppliers });
});

// POST /suppliers
const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
});

// PUT /suppliers/:id
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }
  res.json(supplier);
});

// DELETE /suppliers/:id
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }
  res.json({ message: "Supplier deleted" });
});

// GET /suppliers/:id/history
const supplierHistory = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ supplier: req.params.id })
    .populate("items.product", "name sku")
    .sort({ createdAt: -1 });
  res.json({ data: purchases });
});

// POST /suppliers/:id/record-payment
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  // Reduce outstanding balance
  supplier.outstandingAmount = Math.max(0, Number(supplier.outstandingAmount || 0) - Number(amount));
  if (!supplier.paymentHistory) supplier.paymentHistory = [];
  supplier.paymentHistory.push({
    amount: Number(amount),
    note: note || "",
    date: new Date()
  });
  await supplier.save();

  res.json({ message: "Payment recorded", supplier });
});

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  supplierHistory,
  recordPayment
};