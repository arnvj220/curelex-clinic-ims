const express = require("express");
const {
  listSales,
  createSaleTransaction,
  finalizeSaleTransaction,
  cancelDraftSale,
  downloadInvoicePdf
} = require("../controllers/salesController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { saleValidator } = require("../middleware/validators");
const { authorizePermissions } = require("../middleware/authorize");

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

module.exports = router;