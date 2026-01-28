// 🔹 Admin-only middleware
const adminOnly = (req, res, next) => {
  // req.user yoksa (protect middleware çalışmamış) 401 dön
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Kullanıcı doğrulanmamış" });
  }

  // Rol admin değilse 403 dön
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin yetkisi gerekli" });
  }

  // Her şey tamam → next()
  next();
};

module.exports = adminOnly;
