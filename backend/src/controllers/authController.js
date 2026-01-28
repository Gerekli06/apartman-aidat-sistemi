const User = require("../models/User");
const jwt = require("jsonwebtoken");

/*
  REGISTER (opsiyonel – admin dışında genelde kapalı olur)
*/
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, apartmentNo } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Bu email zaten kayıtlı" });
    }

    const user = await User.create({
      name,
      email,
      password, // 🔐 hash modelde
      role,
      apartmentNo
    });

    res.status(201).json({
      message: "Kullanıcı oluşturuldu",
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  LOGIN
*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Hatalı giriş" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Hatalı giriş" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        role: user.role, // 🔴 BU ŞART
        forcePasswordChange: user.forcePasswordChange
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

