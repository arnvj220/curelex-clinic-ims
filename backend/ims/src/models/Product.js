// const mongoose = require("mongoose");
// const env = require("../config/env");

// const productSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true, index: true },
//     category: { type: String, required: true, trim: true, index: true },
//     price: { type: Number, required: true, min: 0 },
//     costPrice: { type: Number, required: true, min: 0 },
//     sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
//     description: { type: String, default: "" },
//     image: { type: String, default: "" },
//     gstRate: { type: Number, default: env.defaultGstRate, min: 0, max: 100 },
//     lowStockThreshold: { type: Number, default: 5, min: 0 },
//     isActive: { type: Boolean, default: true }
//   },
//   { timestamps: true }
// );

// productSchema.index({ name: "text", sku: "text", category: "text" });

// module.exports = mongoose.model("Product", productSchema);


const mongoose = require("mongoose");
const env = require("../config/env");

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    price:    { type: Number, required: true, min: 0 },
    costPrice:{ type: Number, required: true, min: 0 },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    description: { type: String, default: "" },

    // FIXED: renamed from "image" to "imageUrl" to match productController
    imageUrl: { type: String, default: "" },

    gstRate:          { type: Number, default: env.defaultGstRate, min: 0, max: 100 },
    lowStockThreshold:{ type: Number, default: 5, min: 0 },
    isActive:         { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ name: "text", sku: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);