const PDFDocument = require("pdfkit");
const jwt         = require("jsonwebtoken");
const Sale        = require("../models/Sale");
const asyncHandler = require("../utils/asyncHandler");
const { createSale, finalizeSale } = require("../services/saleService");
const { logAudit } = require("../services/auditService");
const env = require("../config/env");

const listSales = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = status ? { status } : {};
  const skip   = (Number(page) - 1) * Number(limit);
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .populate("customer", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Sale.countDocuments(filter)
  ]);
  res.json({ data: sales, meta: { page: Number(page), limit: Number(limit), total } });
});

const createSaleTransaction = asyncHandler(async (req, res) => {
  const sale = await createSale({
    customerId:     req.body.customerId,
    walkInName:     req.body.walkInName || "",   // NEW
    items:          req.body.items,
    discountAmount: Number(req.body.discountAmount || 0),
    paymentMethod:  req.body.paymentMethod,
    userId:         req.user._id
  });
  await logAudit({
    action: "sale.create", entityType: "Sale", entityId: sale._id,
    metadata: { invoiceNo: sale.invoiceNo }, actor: req.user._id
  });
  res.status(201).json(sale);
});

const finalizeSaleTransaction = asyncHandler(async (req, res) => {
  const sale = await finalizeSale({ saleId: req.params.id, userId: req.user._id });
  await logAudit({
    action: "sale.finalize", entityType: "Sale", entityId: sale._id,
    metadata: { invoiceNo: sale.invoiceNo }, actor: req.user._id
  });
  res.json(sale);
});

const cancelDraftSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) { res.status(404); throw new Error("Sale not found"); }
  if (sale.status !== "draft") { res.status(400); throw new Error("Only draft sales can be cancelled"); }
  sale.status = "cancelled";
  await sale.save();
  await logAudit({
    action: "sale.cancel", entityType: "Sale", entityId: sale._id,
    metadata: { invoiceNo: sale.invoiceNo }, actor: req.user._id
  });
  res.json(sale);
});

// ── Number to words ───────────────────────────────────────────────────────────
function numberToWords(amount) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
    "Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function cvt(n) {
    let r = "";
    if (n >= 100) { r += ones[Math.floor(n/100)] + " Hundred "; n %= 100; }
    if (n >= 20)  { r += tens[Math.floor(n/10)]  + " "; n %= 10; }
    if (n > 0)    { r += ones[n] + " "; }
    return r;
  }
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words = "";
  if (rupees === 0) words = "Zero";
  else {
    if (rupees >= 10000000) words += cvt(Math.floor(rupees/10000000)) + "Crore ";
    if (rupees >= 100000)   words += cvt(Math.floor((rupees%10000000)/100000)) + "Lakh ";
    if (rupees >= 1000)     words += cvt(Math.floor((rupees%100000)/1000)) + "Thousand ";
    words += cvt(rupees % 1000);
  }
  let result = words.trim() + " Rupees";
  if (paise > 0) result += " and " + cvt(paise).trim() + " Paise";
  return result + " Only";
}

// ── Helper: resolve display name for a sale ───────────────────────────────────
// Priority: saved customer name → walkInName → "Walk-in Customer"
const resolveCustomerName = (sale) =>
  sale.customer?.name || sale.walkInName || "Walk-in Customer";

// ── PDF Invoice ───────────────────────────────────────────────────────────────
const downloadInvoicePdf = asyncHandler(async (req, res) => {
  let userId = req.user?._id;
  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, env.jwtSecret);
      userId = decoded.id;
    } catch {
      res.status(401); throw new Error("Invalid token");
    }
  }

  const sale = await Sale.findById(req.params.id)
    .populate("customer", "name phone email address");
  if (!sale) { res.status(404); throw new Error("Sale not found"); }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${sale.invoiceNo}.pdf`);

  const PW = 419.53;
  const PH = 595.28;
  const doc = new PDFDocument({ size: "A5", margin: 0 });
  doc.pipe(res);

  const L   = 20;
  const R   = PW - 20;
  const CW  = R - L;

  const SNO_W  = 20;
  const QTY_W  = 28;
  const RATE_W = 48;
  const AMT_W  = 50;
  const snoX   = L;
  const itemX  = L + SNO_W;
  const qtyX   = R - RATE_W - AMT_W - QTY_W;
  const rateX  = R - RATE_W - AMT_W;
  const amtX   = R - AMT_W;
  const itemW  = qtyX - itemX - 2;

  const cText = (text, x, w, y) =>
    doc.text(String(text), x, y, { width: w, align: "center", lineBreak: false });

  let y = 10;

  doc.moveTo(L, y).lineTo(R, y).lineWidth(1.5).strokeColor("#000").stroke();
  y += 5;

  doc.fontSize(13).font("Helvetica-Bold").fillColor("#000")
     .text("SHRIYANSH DIGITAL POINT", L, y, { align: "center", width: CW, lineBreak: false });
  y += 16;

  doc.fontSize(7).font("Helvetica").fillColor("#444")
     .text("Ph: 9956692347 / 9616524058", L, y, { align: "center", width: CW, lineBreak: false });
  y += 10;

  doc.fontSize(6.5).fillColor("#666")
     .text("Kailhat Bazar, Near Indian Bank, Chunar, Mirzapur", L, y, { align: "center", width: CW, lineBreak: false });
  y += 10;

  doc.fontSize(9).font("Helvetica-Bold").fillColor("#000")
     .text("INVOICE BILL", L, y, { align: "center", width: CW, lineBreak: false });
  y += 12;

  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.7).strokeColor("#000").stroke();
  y += 5;

  // ── META — uses resolveCustomerName ──────────────────────
  const customerDisplayName = resolveCustomerName(sale);
  const mY = y;
  doc.fontSize(7.5).font("Helvetica").fillColor("#000");
  doc.text(`Bill No : ${sale.invoiceNo}`,           L, mY,      { lineBreak: false });
  doc.text(`To      : ${customerDisplayName}`,      L, mY + 10, { lineBreak: false });
  if (sale.customer?.phone)
    doc.text(`Phone   : ${sale.customer.phone}`,    L, mY + 20, { lineBreak: false });

  doc.text(`Date    : ${new Date(sale.createdAt).toLocaleDateString("en-IN")}`,
    L, mY, { align: "right", width: CW, lineBreak: false });
  doc.text(`Payment : ${sale.paymentMethod}`,
    L, mY + 10, { align: "right", width: CW, lineBreak: false });

  y = mY + (sale.customer?.phone ? 32 : 22);

  // Table header
  const TH_H = 15;
  doc.rect(L, y, CW, TH_H).fill("#222");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(7);
  cText("S.No",   snoX,  SNO_W,  y + 4);
  cText("ITEMS",  itemX, itemW,  y + 4);
  cText("Qty",    qtyX,  QTY_W,  y + 4);
  cText("Rate",   rateX, RATE_W, y + 4);
  cText("Amount", amtX,  AMT_W,  y + 4);
  y += TH_H;

  const ROW_H    = 14;
  const MIN_ROWS = 6;
  const dataRows = Math.max(sale.items.length, MIN_ROWS);

  for (let i = 0; i < dataRows; i++) {
    if (i % 2 === 0)
      doc.rect(L, y + i * ROW_H, CW, ROW_H).fill("#f7f7f7");
  }

  const discount     = parseFloat(Number(sale.discountAmount || 0).toFixed(2));
  const SUMMARY_ROWS = discount > 0 ? 3 : 2;
  const totalH       = TH_H + dataRows * ROW_H + SUMMARY_ROWS * ROW_H + 4;

  [snoX + SNO_W, qtyX - 1, rateX - 1, amtX - 1].forEach((x) => {
    doc.moveTo(x, y - TH_H).lineTo(x, y - TH_H + totalH)
       .lineWidth(0.3).strokeColor("#bbb").stroke();
  });
  doc.rect(L, y - TH_H, CW, totalH).lineWidth(0.6).strokeColor("#000").stroke();

  let subtotalAmt = 0;
  doc.font("Helvetica").fontSize(7.5).fillColor("#000");

  sale.items.forEach((item, i) => {
    const lineAmt = parseFloat((Number(item.unitPrice) * Number(item.quantity)).toFixed(2));
    subtotalAmt  += lineAmt;
    const ry      = y + i * ROW_H + 3;
    cText(String(i + 1),                             snoX,  SNO_W,  ry);
    doc.text(item.name, itemX + 2, ry, { width: itemW - 4, lineBreak: false });
    cText(String(item.quantity),                     qtyX,  QTY_W,  ry);
    cText(`Rs.${Number(item.unitPrice).toFixed(2)}`, rateX, RATE_W, ry);
    cText(`Rs.${lineAmt.toFixed(2)}`,                amtX,  AMT_W,  ry);
  });

  y += dataRows * ROW_H;

  const grandTotal = parseFloat((subtotalAmt - discount).toFixed(2));

  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.4).strokeColor("#999").stroke();

  const sumRow = (label, value, sy) => {
    doc.font("Helvetica").fontSize(7).fillColor("#000");
    doc.text(label, rateX, sy, { width: RATE_W, align: "right", lineBreak: false });
    cText(`Rs.${value.toFixed(2)}`, amtX, AMT_W, sy);
  };

  let sy = y + 3;
  sumRow("Subtotal :", subtotalAmt, sy); sy += ROW_H;
  if (discount > 0) { sumRow("Discount :", discount, sy); sy += ROW_H; }

  const GT_Y = sy + 1;
  const GT_H = 17;
  doc.rect(L, GT_Y, CW, GT_H).fill("#222");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(8.5);
  doc.text("TOTAL AMOUNT :", L + 5, GT_Y + 4, { lineBreak: false });
  doc.text(`Rs.${grandTotal.toFixed(2)}`, L, GT_Y + 4,
    { align: "right", width: CW - 5, lineBreak: false });

  const WY = GT_Y + GT_H + 3;
  const WH = 15;
  doc.rect(L, WY, CW, WH).fillAndStroke("#f0f0f0", "#aaa");
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(6.5)
     .text(`Rupees : ${numberToWords(grandTotal)}`, L + 4, WY + 4,
       { width: CW - 8, lineBreak: false });

  const FY = WY + WH + 8;
  doc.fontSize(6.5).font("Helvetica").fillColor("#555")
     .text("T&C : Once items sold cannot be exchanged or refunded.",
       L, FY, { width: CW * 0.58, lineBreak: false });
  doc.fontSize(7).fillColor("#000")
     .text("Signature : _______________", R - 115, FY + 5, { lineBreak: false });

  doc.moveTo(L, PH - 8).lineTo(R, PH - 8).lineWidth(1.5).strokeColor("#000").stroke();

  doc.end();
});

module.exports = {
  listSales,
  createSaleTransaction,
  finalizeSaleTransaction,
  cancelDraftSale,
  downloadInvoicePdf
};