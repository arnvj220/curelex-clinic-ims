import express from 'express';
import { listPurchases, createPurchase, updatePurchaseStatus } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { purchaseValidator } from "../middleware/validators.js";
import { authorizeRoles } from "../middleware/authorize.js";
import { ROLES } from "../utils/permissions.js";

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));
router.get("/", listPurchases);
router.post("/", purchaseValidator, validateRequest, createPurchase);

export default router;
