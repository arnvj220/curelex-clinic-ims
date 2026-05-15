// const mongoose = require("mongoose");

// const saleItemSchema = new mongoose.Schema(
//   {
//     product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//     name: { type: String, required: true },
//     sku: { type: String, required: true },
//     quantity: { type: Number, required: true, min: 1 },
//     unitPrice: { type: Number, required: true, min: 0 },
//     gstRate: { type: Number, required: true, min: 0 },
//     lineAmount: { type: Number, required: true, min: 0 },
//     lineTax: { type: Number, required: true, min: 0 },
//     lineTotal: { type: Number, required: true, min: 0 }
//   },
//   { _id: false }
// );

// const saleSchema = new mongoose.Schema(
//   {
//     invoiceNo: { type: String, required: true, unique: true, index: true },
//     customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
//     items: { type: [saleItemSchema], default: [] },
//     subtotal: { type: Number, required: true, min: 0 },
//     totalTax: { type: Number, required: true, min: 0 },
//     discountAmount: { type: Number, default: 0, min: 0 },
//     finalAmount: { type: Number, required: true, min: 0 },
//     paymentMethod: {
//       type: String,
//       enum: ["Cash", "UPI", "Card", "Credit"],
//       required: true
//     },
//     status: {
//       type: String,
//       enum: ["draft", "finalized", "cancelled"],
//       default: "draft"
//     },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
//   },
//   { timestamps: true }
// );

// saleSchema.index({ createdAt: -1 });

// module.exports = mongoose.model("Sale", saleSchema);


const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    product:    { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name:       { type: String, required: true },
    sku:        { type: String, required: true },
    quantity:   { type: Number, required: true, min: 1 },
    unitPrice:  { type: Number, required: true, min: 0 },
    gstRate:    { type: Number, required: true, min: 0 },
    lineAmount: { type: Number, required: true, min: 0 },
    lineTax:    { type: Number, required: true, min: 0 },
    lineTotal:  { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNo:      { type: String, required: true, unique: true, index: true },
    customer:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    // NEW: free-text name for walk-in customers who are NOT saved in the customers list
    walkInName:     { type: String, default: "" },
    items:          { type: [saleItemSchema], default: [] },
    subtotal:       { type: Number, required: true, min: 0 },
    totalTax:       { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount:    { type: Number, required: true, min: 0 },
    paymentMethod:  {
      type: String,
      enum: ["Cash", "UPI", "Card", "Credit"],
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "cancelled"],
      default: "draft"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Sale", saleSchema);