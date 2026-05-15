// const mongoose = require("mongoose");

// const purchaseItemSchema = new mongoose.Schema(
//   {
//     product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//     quantity: { type: Number, required: true, min: 1 },
//     unitCost: { type: Number, required: true, min: 0 },
//     lineTotal: { type: Number, required: true, min: 0 }
//   },
//   { _id: false }
// );

// const purchaseSchema = new mongoose.Schema(
//   {
//     supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
//     items: { type: [purchaseItemSchema], default: [] },
//     totalAmount: { type: Number, required: true, min: 0 },
//     notes: { type: String, default: "" },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
//   },
//   { timestamps: true }
// );

// purchaseSchema.index({ createdAt: -1 });

// module.exports = mongoose.model("Purchase", purchaseSchema);

const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
  {
    product:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity:  { type: Number, required: true, min: 1 },
    unitCost:  { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true
    },
    items:       { type: [purchaseItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    notes:       { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "received"
    },

    // NEW: GST or Non-GST bill tracking
    billType: {
      type: String,
      enum: ["gst", "non-gst"],
      default: "non-gst"
    },
    // GST number — only filled when billType is "gst"
    gstNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Purchase", purchaseSchema);