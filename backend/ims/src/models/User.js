const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES, STAFF_PERMISSIONS } = require("../utils/permissions");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STAFF
    },
    permissions: {
      type: [String],
      default: STAFF_PERMISSIONS.SALES_BILLING
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("IMSUser", userSchema);
