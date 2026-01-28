const User = require("../models/User");
const bcrypt = require("bcryptjs");

/*
  ===============================
  ADMIN → Kullanıcı oluştur
  ===============================
*/
exports.createUser = async (req, res) => {
  const { name, email, password, apartmentNo } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "Bu email zaten kayıtlı" });
  }

  const user = await User.create({
    name,
    email,
    password,
    apartmentNo,
    role: "user",
    forcePasswordChange: true
  });

  res.status(201).json({
    message: "Daire sahibi oluşturuldu",
    user: {
      id: user._id,
      name: user.name,
      apartmentNo: user.apartmentNo,
      role: user.role
    }
  });
};

/*
  ===============================
  ADMIN → Şifre reset
  ===============================
*/
exports.resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;

  const hashed = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(req.params.id, {
    password: hashed,
    forcePasswordChange: true
  });

  res.json({ message: "Şifre sıfırlandı" });
};

/*
  ===============================
  USER → Kendi bilgileri (TEK DOĞRU)
  ===============================
*/
exports.getMeSafe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId)
      .select("name apartmentNo role");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({
      id: user._id,
      name: user.name,
      apartmentNo: user.apartmentNo,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "İsim boş olamaz" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    ).select("name apartmentNo role");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({
      message: "İsim güncellendi",
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


