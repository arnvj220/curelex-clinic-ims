const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const asyncHandler = require("../utils/asyncHandler");

// GET /customers
const listCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter)
  ]);

  res.json({ data: customers, meta: { page: Number(page), limit: Number(limit), total } });
});

// POST /customers
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

// PUT /customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json(customer);
});

// DELETE /customers/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json({ message: "Customer deleted" });
});

// GET /customers/:id/history
const customerHistory = asyncHandler(async (req, res) => {
  const sales = await Sale.find({ customer: req.params.id })
    .sort({ createdAt: -1 })
    .populate("customer", "name phone");
  res.json({ data: sales });
});

// POST /customers/:id/clear-dues
const clearDues = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  customer.outstandingAmount = 0;
  await customer.save();
  res.json({ message: "Dues cleared", customer });
});

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  customerHistory,
  clearDues
};