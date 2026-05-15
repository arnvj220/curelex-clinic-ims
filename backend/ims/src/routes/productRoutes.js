// const express = require("express");
// const {
//   listProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   getProductQr,
//   getProductBarcode
// } = require("../controllers/productController");
// const { protect } = require("../middleware/authMiddleware");
// const { authorizeRoles } = require("../middleware/authorize");
// const validateRequest = require("../middleware/validateRequest");
// const { productValidator } = require("../middleware/validators");
// const { ROLES } = require("../utils/permissions");

// const router = express.Router();

// router.use(protect);
// router.get("/", listProducts);
// router.get("/:id/qr", getProductQr);
// router.get("/:id/barcode", getProductBarcode);
// router.post("/", authorizeRoles(ROLES.ADMIN), productValidator, validateRequest, createProduct);
// router.put("/:id", authorizeRoles(ROLES.ADMIN), productValidator, validateRequest, updateProduct);
// router.delete("/:id", authorizeRoles(ROLES.ADMIN), deleteProduct);

// module.exports = router;
// const express = require("express");
// const {
//   listProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   getProductQr,
//   getProductBarcode,
//   uploadProductImage          // ← import multer middleware
// } = require("../controllers/productController");
// const { protect } = require("../middleware/authMiddleware");
// const { authorizeRoles } = require("../middleware/authorize");
// const validateRequest = require("../middleware/validateRequest");
// const { productValidator } = require("../middleware/validators");
// const { ROLES } = require("../utils/permissions");

// const router = express.Router();

// router.use(protect);

// router.get("/", listProducts);
// router.get("/:id/qr", getProductQr);
// router.get("/:id/barcode", getProductBarcode);

// // FIXED: uploadProductImage must come BEFORE productValidator
// // because multer parses the multipart body first, then validators can read req.body
// router.post(
//   "/",
//   authorizeRoles(ROLES.ADMIN),
//   uploadProductImage,          // ← step 1: parse multipart form + file
//   productValidator,            // ← step 2: now req.body is populated
//   validateRequest,
//   createProduct
// );

// router.put(
//   "/:id",
//   authorizeRoles(ROLES.ADMIN),
//   uploadProductImage,          // ← same fix for update
//   validateRequest,
//   updateProduct
// );

// router.delete("/:id", authorizeRoles(ROLES.ADMIN), deleteProduct);

// module.exports = router;



const express = require("express");
const {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductQr,
  getProductBarcode,
  uploadProductImage
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorize");
const { ROLES } = require("../utils/permissions");

const router = express.Router();

router.use(protect);

router.get("/", listProducts);
router.get("/:id/qr", getProductQr);
router.get("/:id/barcode", getProductBarcode);

// uploadProductImage (multer) MUST be before createProduct
// Validation is done inside the controller directly — no separate validator
router.post("/", authorizeRoles(ROLES.ADMIN), uploadProductImage, createProduct);
router.put("/:id", authorizeRoles(ROLES.ADMIN), uploadProductImage, updateProduct);
router.delete("/:id", authorizeRoles(ROLES.ADMIN), deleteProduct);

module.exports = router;