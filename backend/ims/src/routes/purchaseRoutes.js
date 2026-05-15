const express = require("express");
const { listPurchases, createPurchase } = require("../controllers/purchaseController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { purchaseValidator } = require("../middleware/validators");
const { authorizeRoles } = require("../middleware/authorize");
const { ROLES } = require("../utils/permissions");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));
router.get("/", listPurchases);
router.post("/", purchaseValidator, validateRequest, createPurchase);

module.exports = router;
