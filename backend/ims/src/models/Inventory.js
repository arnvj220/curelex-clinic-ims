import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    damagedOrLost: {
      type: Number,
      default: 0,
      min: 0
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Index
inventorySchema.index({ quantity: 1 });

// Model
const Inventory = mongoose.model(
  "Inventory",
  inventorySchema
);

export default Inventory;