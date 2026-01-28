const express = require("express");
const router = express.Router();

const {
  createAidat,
  getMyAidatlar,
  markAsPaid,
  markAsUnpaid,
  getAllAidatlar,
  createAidatForAll,
  createAidatBulk,
  getAidatPdfReport,
  getAidatPdfByApartment,
  generateMonthPdf,
  getAidatSummary,
  getMyAidatSummary,
  deleteAidat, // ✅ controller’a taşındı
} = require("../controllers/aidatController");

// ⚠️ DİKKAT: middlewares (çoğul)
const { protect, adminOnly } = require("../middlewares/auth");

/* =========================
   AİDAT LİSTELERİ
========================= */

// ADMIN → tüm aidatlar
router.get("/", protect, adminOnly, getAllAidatlar);

// USER → kendi aidatları
router.get("/me", protect, getMyAidatlar);

// ADMIN → aidatlar + kullanıcı (frontend uyumu için)
router.get("/with-users", protect, adminOnly, getAllAidatlar);

/* =========================
   AİDAT OLUŞTURMA
========================= */

// ADMIN → tek daire
router.post("/", protect, adminOnly, createAidat);

// ADMIN → tüm daireler
router.post("/all", protect, adminOnly, createAidatForAll);

// ADMIN → bulk (1..N daire)
router.post("/bulk", protect, adminOnly, createAidatBulk);

/* =========================
   ÖDEME İŞLEMLERİ
========================= */

router.put("/:id/paid", protect, adminOnly, markAsPaid);
router.put("/:id/unpaid", protect, adminOnly, markAsUnpaid);

/* =========================
   AİDAT SİL
========================= */

// ADMIN → aidat sil
router.delete("/:id", protect, adminOnly, deleteAidat);

/* =========================
   PDF RAPORLAR
========================= */

// ADMIN → genel pdf
router.get("/pdf/general", protect, adminOnly, getAidatPdfReport);

// ADMIN → daire bazlı pdf
router.get(
  "/pdf/apartment/:apartmentNo",
  protect,
  adminOnly,
  getAidatPdfByApartment
);

// ADMIN → ay/yıl bazlı pdf
router.get(
  "/pdf/month/:year/:month",
  protect,
  adminOnly,
  generateMonthPdf
);

/* =========================
   ÖZETLER
========================= */

// ADMIN → genel özet
router.get("/summary", protect, adminOnly, getAidatSummary);

// USER → kendi özet
router.get("/my-summary", protect, getMyAidatSummary);

module.exports = router;
