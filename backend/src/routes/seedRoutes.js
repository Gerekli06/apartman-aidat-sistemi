const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.get("/create-admin", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "admin@mail.com" });
    if (exists) {
      return res.json({ message: "Admin zaten var" });
    }

    const hashed = await bcrypt.hash("123456", 10);

    const admin = new User({
      name: "Admin",
      email: "admin@mail.com",
      password: hashed,
      role: "admin",
      apartmentNo: 0   // ✅ ZORUNLU ALAN EKLENDİ
    });

    await admin.save();

    res.json({
      message: "Admin oluşturuldu",
      email: "admin@mail.com",
      password: "123456"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
