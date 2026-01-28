const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔹 Kullanıcıyı doğrulayan middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token yok veya hatalı" });
    }

    const token = authHeader.split(" ")[1];

    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Token geçersiz" });
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT hatası:", err.message);
    return res.status(401).json({ success: false, message: "Geçersiz token" });
  }
};

// 🔹 Admin-only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin yetkisi gerekli" });
  }
  next();
};

module.exports = { protect, adminOnly };
