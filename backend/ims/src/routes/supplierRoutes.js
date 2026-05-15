const express = require("express");
const {
  listSuppliers,
  createSupplier,
  updateSupplier,
  supplierHistory
} = require("../controllers/supplierController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorize");
const { ROLES } = require("../utils/permissions");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));
router.get("/", listSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.get("/:id/history", supplierHistory);

module.exports = router;
