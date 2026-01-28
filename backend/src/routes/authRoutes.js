const express = require("express");
const router = express.Router();

// Controller
const { register, login } = require("../controllers/authController");

// ⚠️ Middleware yolu Linux uyumlu (middlewares / çoğul)
const { protect, adminOnly } = require("../middlewares/auth");

/* =========================
   KULLANICI OLUŞTURMA
========================= */
// SADECE ADMIN → register
router.post("/register", protect, adminOnly, register);

/* =========================
   LOGIN
========================= */
// HERKES erişebilir
router.post("/login", login);

module.exports = router;

