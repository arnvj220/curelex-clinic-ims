const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");
const QRCode = require("qrcode");
const bwipjs = require("bwip-js");
const multer = require("multer");
const { logAudit } = require("../services/auditService");

// Auto-create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "../../uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadProductImage = upload.single("image");

// ── Controllers ───────────────────────────────────────────────────────────────

const listProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "", category } = req.query;
  const filter = { isActive: true };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter)
  ]);

  // Attach inventory quantity to each product
  const productIds = products.map(p => p._id);
  const inventories = await Inventory.find({ product: { $in: productIds } });
  const inventoryMap = {};
  inventories.forEach(inv => {
    inventoryMap[inv.product.toString()] = inv.quantity;
  });

  const productsWithQty = products.map(p => ({
    ...p.toObject(),
    inventory: { quantity: inventoryMap[p._id.toString()] ?? 0 }
  }));

  res.json({ data: productsWithQty, meta: { page: Number(page), limit: Number(limit), total } });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, costPrice, sku, description, gstRate } = req.body;

  if (!name || !name.trim()) {
    res.status(400); throw new Error("Product name is required");
  }
  if (!category || !category.trim()) {
    res.status(400); throw new Error("Category is required");
  }
  if (!sku || !sku.trim()) {
    res.status(400); throw new Error("SKU is required");
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    res.status(400); throw new Error("Valid price is required");
  }
  if (!costPrice || isNaN(Number(costPrice)) || Number(costPrice) < 0) {
    res.status(400); throw new Error("Valid cost price is required");
  }

  const productData = {
    name: name.trim(),
    category: category.trim(),
    sku: sku.trim().toUpperCase(),
    price: Number(price),
    costPrice: Number(costPrice),
    description: description ? description.trim() : "",
    gstRate: gstRate ? Number(gstRate) : 18,
    imageUrl: req.file ? `/uploads/products/${req.file.filename}` : ""
  };

  const product = await Product.create(productData);

  await Inventory.create({ product: product._id, quantity: 0, updatedBy: req.user._id });

  await logAudit({
    action: "product.create",
    entityType: "Product",
    entityId: product._id,
    metadata: { sku: product.sku },
    actor: req.user._id
  });

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) {
    updateData.imageUrl = `/uploads/products/${req.file.filename}`;
  }
  if (updateData.price) updateData.price = Number(updateData.price);
  if (updateData.costPrice) updateData.costPrice = Number(updateData.costPrice);

  const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });
  if (!product) { res.status(404); throw new Error("Product not found"); }
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  product.isActive = false;
  await product.save();
  res.json({ message: "Product archived" });
});

const getProductQr = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  const payload = JSON.stringify({ id: product._id, sku: product.sku, name: product.name, price: product.price });
  const qrDataUrl = await QRCode.toDataURL(payload);
  res.json({ qrDataUrl });
});

const getProductBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  const png = await bwipjs.toBuffer({ bcid: "code128", text: product.sku, scale: 3, height: 10, includetext: true });
  res.set("Content-Type", "image/png");
  res.send(png);
});

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductQr,
  getProductBarcode,
  uploadProductImage
};