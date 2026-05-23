import Counter from "../models/Counter.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import { buildInvoiceNumber } from "../utils/invoiceNumber.js";
import { calculateLine, calculateTotals } from "../utils/gst.js";
import { changeStock } from "./inventoryService.js";

// ── FIXED: per-clinic invoice counter ────────────────────────────
const nextInvoiceNumber = async (clinicId) => {
  const year = new Date().getFullYear();
  const key  = `invoice:${year}:${clinicId}`; // ← unique per clinic per year
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return buildInvoiceNumber(year, counter.seq);
};

const createSale = async ({
  clinicId,       // ← ADDED
  customerId,
  walkInName,
  items,
  discountAmount,
  paymentMethod,
  userId,
}) => {
  if (!items || !items.length) throw new Error("At least one sale item is required");
  if (!clinicId) throw new Error("No clinic associated with this session");

  const saleItems = [];
  for (const item of items) {
    // ← ADDED clinicId filter so clinic A can't sell clinic B's products
    const product = await Product.findOne({ _id: item.productId, clinicId });
    if (!product) throw new Error("Product not found");

    const lineCalc = calculateLine({
      quantity:  item.quantity,
      unitPrice: product.price,
      gstRate:   product.gstRate,
    });

    saleItems.push({
      product:   product._id,
      name:      product.name,
      sku:       product.sku,
      quantity:  Number(item.quantity),
      unitPrice: product.price,
      gstRate:   product.gstRate,
      ...lineCalc,
    });
  }

  const totals = calculateTotals({ items: saleItems, discountAmount });

  let customer = null;
  if (customerId) {
    // ← ADDED clinicId filter so clinic A can't bill clinic B's customers
    customer = await Customer.findOne({ _id: customerId, clinicId });
    if (!customer) throw new Error("Customer not found");
  }

  if (paymentMethod === "Credit" && customer) {
    const projected = Number(customer.outstandingAmount || 0) + totals.finalAmount;
    if (projected > Number(customer.creditLimit || 0))
      throw new Error("Credit limit exceeded for customer");
  }

  const sale = await Sale.create({
    clinicId,                                             // ← ADDED
    invoiceNo:      await nextInvoiceNumber(clinicId),    // ← FIXED: per-clinic
    customer:       customer ? customer._id : undefined,
    walkInName:     (!customer && walkInName) ? walkInName.trim() : "",
    items:          saleItems,
    subtotal:       totals.subtotal,
    totalTax:       totals.totalTax,
    discountAmount: totals.totalDiscount,
    finalAmount:    totals.finalAmount,
    paymentMethod,
    status:         "draft",
    createdBy:      userId,
  });

  return sale;
};

const finalizeSale = async ({ saleId, userId }) => {
  const sale = await Sale.findById(saleId).populate("customer");
  if (!sale) throw new Error("Sale not found");
  if (sale.status !== "draft") throw new Error("Only draft sales can be finalized");

  for (const item of sale.items) {
    await changeStock({
      clinicId:       sale.clinicId,        // ← ADDED
      productId:      item.product,
      quantityChange: -Number(item.quantity),
      movementType:   "sale",
      reason:         `Sale ${sale.invoiceNo}`,
      referenceModel: "Sale",
      referenceId:    sale._id,
      userId,
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

export { createSale, finalizeSale };