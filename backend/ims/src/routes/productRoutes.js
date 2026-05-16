import express from "express";

import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductQr,
  getProductBarcode,
  uploadProductImage
} from "../controllers/productController.js";

import { protect } from "../middleware/authMiddleware.js";

import { authorizeRoles } from "../middleware/authorize.js";

import { ROLES } from "../utils/permissions.js";

const router = express.Router();

router.use(protect);

router.get("/", listProducts);

router.get("/:id/qr", getProductQr);

router.get("/:id/barcode", getProductBarcode);

// Multer middleware before controller
router.post(
  "/",
  authorizeRoles(ROLES.ADMIN),
  uploadProductImage,
  createProduct
);

router.put(
  "/:id",
  authorizeRoles(ROLES.ADMIN),
  uploadProductImage,
  updateProduct
);

router.delete(
  "/:id",
  authorizeRoles(ROLES.ADMIN),
  deleteProduct
);

export default router;