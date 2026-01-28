const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ✅ Linux case-sensitive uyumlu middleware yolu
const { protect, adminOnly } = require("../middlewares/auth");
const { getMeSafe, updateUserName } = require("../controllers/userController");

/* ===============================
   ADMIN → Daire sahibi oluşturur
=============================== */
router.post("/create-user", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, apartmentNo } = req.body;

    if (!name || !email || !password || !apartmentNo) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Şifre en az 6 karakter olmalıdır" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Bu email zaten kayıtlı" });
    }

    const user = await User.create({
      name,
      email,
      password, // hash User model middleware’inde
      apartmentNo,
      role: "user",
      forcePasswordChange: true
    });

    res.status(201).json({
      success: true,
      message: "Daire sahibi oluşturuldu",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        apartmentNo: user.apartmentNo
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===============================
   ADMIN → Kullanıcının şifresini resetler
=============================== */
router.put("/reset-password/:id", protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Şifre en az 6 karakter olmalıdır" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashed, forcePasswordChange: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({ success: true, message: "Şifre resetlendi", userId: user._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===============================
   USER → Kendi şifresini değiştirir
=============================== */
router.put("/change-password", protect, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Şifre en az 6 karakter olmalıdır" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user.id, {
      password: hashed,
      forcePasswordChange: false
    });

    res.json({ success: true, message: "Şifre başarıyla güncellendi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===============================
   ADMIN → TÜM KULLANICILARI GETİR
=============================== */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Kullanıcılar alınamadı" });
  }
});

// ADMIN → KULLANICI SİL
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    res.json({ success: true, message: "Kullanıcı silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===============================
   USER → KENDİ BİLGİLERİ
=============================== */
router.get("/me", protect, getMeSafe);
router.put("/:id/update-name", protect, adminOnly, updateUserName);

module.exports = router;
