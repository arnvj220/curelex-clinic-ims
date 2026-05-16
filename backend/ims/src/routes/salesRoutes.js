import express from 'express';
import {
  listSales,
  createSaleTransaction,
  finalizeSaleTransaction,
  cancelDraftSale,
  downloadInvoicePdf
} from "../controllers/salesController.js";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { saleValidator } from "../middleware/validators.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// FIX: invoice.pdf is declared BEFORE router.use(protect) so the protect
// middleware does NOT run for this route. Auth is handled inside the
// controller via the ?token= query param (JWT verified manually).
router.get("/:id/invoice.pdf", downloadInvoicePdf);

router.use(protect);
router.get("/",              authorizePermissions("sales.read"),   listSales);
router.post("/",             authorizePermissions("sales.create"), saleValidator, validateRequest, createSaleTransaction);
router.post("/:id/finalize", authorizePermissions("sales.create"), finalizeSaleTransaction);
router.post("/:id/cancel",   authorizePermissions("sales.create"), cancelDraftSale);

export default router;