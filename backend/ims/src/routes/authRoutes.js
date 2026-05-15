const express = require("express");
const { signup, login, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { authSignupValidator, authLoginValidator } = require("../middleware/validators");

const router = express.Router();

router.post("/signup", authSignupValidator, validateRequest, signup);
router.post("/login", authLoginValidator, validateRequest, login);
router.get("/me", protect, me);

module.exports = router;
