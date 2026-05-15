const express = require("express");
const { listInventory, adjustInventory, lowStock } = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorize");
const { ROLES } = require("../utils/permissions");
const validateRequest = require("../middleware/validateRequest");
const { inventoryAdjustValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.get("/", listInventory);
router.get("/low-stock", lowStock);
router.post("/adjust", authorizeRoles(ROLES.ADMIN), inventoryAdjustValidator, validateRequest, adjustInventory);

module.exports = router;
