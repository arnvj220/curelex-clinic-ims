const express = require("express");
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  customerHistory
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", listCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.get("/:id/history", customerHistory);

module.exports = router;
