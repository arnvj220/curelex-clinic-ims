const { body } = require("express-validator");

const authSignupValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must have at least 6 characters")
];

const authLoginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];

const productValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  body("costPrice").isFloat({ min: 0 }).withMessage("Cost price must be non-negative"),
  body("sku").notEmpty().withMessage("SKU is required")
];

const saleValidator = [
  body("items").isArray({ min: 1 }).withMessage("Items are required"),
  body("paymentMethod")
    .isIn(["Cash", "UPI", "Card", "Credit"])
    .withMessage("Invalid payment method")
];

const purchaseValidator = [
  body("supplierId").notEmpty().withMessage("Supplier is required"),
  body("items").isArray({ min: 1 }).withMessage("Items are required")
];

const inventoryAdjustValidator = [
  body("productId").notEmpty().withMessage("Product is required"),
  body("adjustment").isNumeric().withMessage("Adjustment must be numeric")
];

module.exports = {
  authSignupValidator,
  authLoginValidator,
  productValidator,
  saleValidator,
  purchaseValidator,
  inventoryAdjustValidator
};
