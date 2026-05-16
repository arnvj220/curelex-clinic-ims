import express from 'express';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  supplierHistory
} from "../controllers/supplierController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import { ROLES } from "../utils/permissions.js";

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));
router.get("/", listSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.get("/:id/history", supplierHistory);

export default router;
