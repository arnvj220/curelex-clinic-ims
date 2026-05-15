const Counter  = require("../models/Counter");
const Product  = require("../models/Product");
const Customer = require("../models/Customer");
const Sale     = require("../models/Sale");
const { buildInvoiceNumber } = require("../utils/invoiceNumber");
const { calculateLine, calculateTotals } = require("../utils/gst");
const { changeStock } = require("./inventoryService");

const nextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const key  = `invoice:${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return buildInvoiceNumber(year, counter.seq);
};

const createSale = async ({ customerId, walkInName, items, discountAmount, paymentMethod, userId }) => {
  if (!items || !items.length) throw new Error("At least one sale item is required");

  const saleItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error("Product not found");

    const lineCalc = calculateLine({
      quantity:  item.quantity,
      unitPrice: product.price,
      gstRate:   product.gstRate
    });

    saleItems.push({
      product:   product._id,
      name:      product.name,
      sku:       product.sku,
      quantity:  Number(item.quantity),
      unitPrice: product.price,
      gstRate:   product.gstRate,
      ...lineCalc
    });
  }

  const totals = calculateTotals({ items: saleItems, discountAmount });

  let customer = null;
  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found");
  }

  if (paymentMethod === "Credit" && customer) {
    const projected = Number(customer.outstandingAmount || 0) + totals.finalAmount;
    if (projected > Number(customer.creditLimit || 0))
      throw new Error("Credit limit exceeded for customer");
  }

  const sale = await Sale.create({
    invoiceNo:      await nextInvoiceNumber(),
    customer:       customer ? customer._id : undefined,
    // Save free-text name only when no saved customer is selected
    walkInName:     (!customer && walkInName) ? walkInName.trim() : "",
    items:          saleItems,
    subtotal:       totals.subtotal,
    totalTax:       totals.totalTax,
    discountAmount: totals.totalDiscount,
    finalAmount:    totals.finalAmount,
    paymentMethod,
    status:         "draft",
    createdBy:      userId
  });

  return sale;
};

const finalizeSale = async ({ saleId, userId }) => {
  const sale = await Sale.findById(saleId).populate("customer");
  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "draft") throw new Error("Only draft sales can be finalized");

  for (const item of sale.items) {
    await changeStock({
      productId:      item.product,
      quantityChange: -Number(item.quantity),
      movementType:   "sale",
      reason:         `Sale ${sale.invoiceNo}`,
      referenceModel: "Sale",
      referenceId:    sale._id,
      userId
    });
  }

  if (sale.paymentMethod === "Credit" && sale.customer) {
    sale.customer.outstandingAmount =
      Number(sale.customer.outstandingAmount || 0) + Number(sale.finalAmount || 0);
    await sale.customer.save();
  }

  sale.status = "finalized";
  await sale.save();
  return sale;
};

module.exports = { createSale, finalizeSale };