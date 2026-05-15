const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const inventoryRoutes = require("./inventoryRoutes");
const salesRoutes = require("./salesRoutes");
const purchaseRoutes = require("./purchaseRoutes");
const customerRoutes = require("./customerRoutes");
const supplierRoutes = require("./supplierRoutes");
const reportRoutes = require("./reportRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/customers", customerRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
