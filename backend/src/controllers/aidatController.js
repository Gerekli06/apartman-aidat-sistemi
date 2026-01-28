const Aidat = require("../models/Aidat");
const User = require("../models/User");
const { generateAidatReport } = require("../utils/pdfGenerator");

/* =========================
   ADMIN → TEK DAİRE AİDAT
========================= */
exports.createAidat = async (req, res) => {
  try {
    const { title, amount, apartmentNo, dueDate, month, year } = req.body;

   const user = await User.findOne({ apartmentNo });

if (!user) {
  return res.status(404).json({ message: "Bu daireye ait kullanıcı yok" });
}

const aidat = await Aidat.create({
  title,
  amount,
  apartmentNo,
  dueDate,
  month,
  year,
  user: user ? user._id : null, // ✅ KRİTİK
  createdBy: req.user._id
});


    res.status(201).json({ message: "Aidat oluşturuldu", aidat });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Bu ay için bu daireye aidat zaten var" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.createAidatBulk = async (req, res) => {
  const { title, amount, totalApartments, dueDate, month, year } = req.body;

  try {
    const aidatlar = [];

    for (let i = 1; i <= totalApartments; i++) {
      const user = await User.findOne({ apartmentNo: i });
      if (!user) continue;

      aidatlar.push({
        title,
        amount,
        apartmentNo: i,
        user: user._id,
        dueDate,
        month,
        year,
        createdBy: req.user._id
      });
    }

    await Aidat.insertMany(aidatlar);

    res.status(201).json({ message: "Toplu aidat oluşturuldu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* =========================
   ADMIN → TOPLU AİDAT
========================= */
exports.createBulkAidat = async (req, res) => {
  try {
    const { title, amount, dueDate, month, year } = req.body;

    // 🔴 1. TÜM USER'LARI ÇEK
    const users = await User.find({ role: "user" });

    if (users.length === 0) {
      return res.status(400).json({ message: "Kullanıcı yok" });
    }

    // 🔴 2. HER USER İÇİN AİDAT OLUŞTUR
   const aidatlar = users.map((u) => ({
  title,
  amount,
  apartmentNo: u.apartmentNo,
  user: u._id,              // 🔥 FIX
  dueDate,
  month,
  year,
  createdBy: req.user._id
}));


    // 🔴 3. TOPLU KAYIT
    await Aidat.insertMany(aidatlar);

    res.json({ message: "test" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   USER → KENDİ AİDATLARI
========================= */
exports.getAllAidatlar = async (req, res) => {
  try {
    const aidatlar = await Aidat.find()
      .populate("user", "name apartmentNo")
      .sort({ createdAt: -1 });

    res.json(aidatlar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyAidatlar = async (req, res) => {
  try {
    const aidatlar = await Aidat.find({
      apartmentNo: req.user.apartmentNo
    })
      .populate("user", "name apartmentNo")
      .sort({ createdAt: -1 });

    res.json(aidatlar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   USER → BORÇ ÖZETİ
========================= */
exports.getMyAidatSummary = async (req, res) => {
  const aidatlar = await Aidat.find({
    apartmentNo: req.user.apartmentNo
  });

  let total = 0;
  let paid = 0;
  let unpaid = 0;

  aidatlar.forEach(a => {
    total += a.amount;
    if (a.paid) paid += a.amount;
    else unpaid += a.amount;
  });

  res.json({
    total,
    paid,
    unpaid
  });
};

/* =========================
   ADMIN → AİDAT SİL
========================= */
exports.deleteAidat = async (req, res) => {
  const aidat = await Aidat.findByIdAndDelete(req.params.id);

  if (!aidat) {
    return res.status(404).json({ message: "Aidat bulunamadı" });
  }

  res.json({ message: "Aidat silindi" });
};

/* =========================
   ÖDEME İŞLEMLERİ
========================= */
exports.markAsPaid = async (req, res) => {
  await Aidat.findByIdAndUpdate(req.params.id, {
    paid: true,
    paidAt: new Date(),
    paymentRequested: false,
    paymentRequestedAt: null
  });

  res.json({ message: "Aidat ödendi" });
};

exports.markAsUnpaid = async (req, res) => {
  await Aidat.findByIdAndUpdate(req.params.id, {
    paid: false,
    paidAt: null,
    paymentRequested: false,
    paymentRequestedAt: null
  });

  res.json({ message: "Ödeme geri alındı" });
};

exports.requestPayment = async (req, res) => {
  const aidat = await Aidat.findById(req.params.id);

  if (!aidat) {
    return res.status(404).json({ message: "Aidat bulunamadı" });
  }

  if (aidat.paid) {
    return res.status(400).json({ message: "Aidat zaten ödenmiş" });
  }

  aidat.paymentRequested = true;
  aidat.paymentRequestedAt = new Date();
  await aidat.save();

  res.json({ message: "Ödeme isteği gönderildi" });
};

/* =========================
   ADMIN → RAPOR
========================= */
exports.getReport = async (req, res) => {
  const total = await Aidat.countDocuments();
  const paid = await Aidat.countDocuments({ paid: true });

  res.json({
    total,
    paid,
    unpaid: total - paid
  });
};
/* =========================
   ADMIN → TUTAR ÖZETİ
========================= */
exports.getAidatSummary = async (req, res) => {
  const aidatlar = await Aidat.find();

  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;

  aidatlar.forEach(a => {
    totalAmount += a.amount;
    if (a.paid) {
      paidAmount += a.amount;
    } else {
      unpaidAmount += a.amount;
    }
  });

  res.json({
    totalAmount,
    paidAmount,
    unpaidAmount
  });
};

/* =========================
   PDF → GENEL RAPOR
========================= */
exports.getAidatPdfReport = async (req, res) => {
  // ✅ CACHE FIX
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=aidat-raporu.pdf",
    "Cache-Control": "no-store"
  });

  const aidatlar = await Aidat.find()
    .populate("user", "name apartmentNo")
    .sort({ apartmentNo: 1 });

  const rows = aidatlar.map(a => ({
    apartmentNo: a.apartmentNo,
    name: a.user?.name || "Bilinmiyor",
    title: a.title,
    amount: a.amount,
    paid: a.paid
  }));

  generateAidatReport(res, "GENEL AİDAT RAPORU", rows);
};

/* =========================
   PDF → DAİRE BAZLI
========================= */
exports.getAidatPdfByApartment = async (req, res) => {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=daire-aidat.pdf",
    "Cache-Control": "no-store"
  });

  const { apartmentNo } = req.params;

  const aidatlar = await Aidat.find({ apartmentNo })
    .populate("user", "name apartmentNo")
    .sort({ month: 1 });

  if (aidatlar.length === 0) {
    return res.status(404).json({ message: "Aidat bulunamadı" });
  }

  const rows = aidatlar.map(a => ({
    apartmentNo: a.apartmentNo,
    name: a.user?.name || "Bilinmiyor",
    title: a.title,
    amount: a.amount,
    paid: a.paid
  }));

  generateAidatReport(
    res,
    `DAİRE ${apartmentNo} AİDAT RAPORU`,
    rows
  );
};

/* =========================
   PDF → AYLIK RAPOR
========================= */
exports.generateMonthPdf = async (req, res) => {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=aylik-aidat.pdf",
    "Cache-Control": "no-store"
  });

  const { year, month } = req.params;

  const aidatlar = await Aidat.find({
    year: Number(year),
    month: Number(month)
  }).lean();

  const users = await User.find().lean();

  const userMap = {};
  users.forEach(u => (userMap[u.apartmentNo] = u.name));

  const rows = aidatlar.map(a => ({
    apartmentNo: a.apartmentNo,
    name: userMap[a.apartmentNo] || "Bilinmiyor",
    title: a.title,
    amount: a.amount,
    paid: a.paid
  }));

  const monthNames = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  generateAidatReport(
    res,
    `${monthNames[month]} ${year} Aidat Raporu`,
    rows
  );
};

exports.getAllAidatlarWithUser = async (req, res) => {
  try {
    const aidatlar = await Aidat.find().populate("user", "name apartmentNo");
    res.json(aidatlar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAidatForAll = async (req, res) => {
  try {
    const { title, amount, dueDate, month, year } = req.body;

    const users = await require("../models/User").find({ role: "user" });

    if (!users.length) {
      return res.status(400).json({ message: "Kullanıcı yok" });
    }

    const Aidat = require("../models/Aidat");

    const aidatlar = users.map(u => ({
      title,
      amount,
      apartmentNo: u.apartmentNo,
      user: u._id,
      dueDate,
      month,
      year
    }));

    await Aidat.insertMany(aidatlar);

    res.status(201).json({ message: "Tüm dairelere aidat oluşturuldu" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAidatlarWithUser = async (req, res) => {
  try {
    const aidatlar = await Aidat.find()
      .populate("user", "name apartmentNo email")
      .sort({ createdAt: -1 });

    res.json(aidatlar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ADMIN → AİDAT ÖZET
========================= */
exports.getAidatSummary = async (req, res) => {
  try {
    const aidatlar = await Aidat.find();

    const totalAmount = aidatlar.reduce((sum, a) => sum + a.amount, 0);
    const paidAmount = aidatlar
      .filter(a => a.paid)
      .reduce((sum, a) => sum + a.amount, 0);

    const unpaidAmount = totalAmount - paidAmount;

    res.json({
      totalAmount,
      paidAmount,
      unpaidAmount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   USER → KENDİ AİDAT ÖZETİ
========================= */
exports.getMyAidatSummary = async (req, res) => {
  try {
    const aidatlar = await Aidat.find({
      apartmentNo: req.user.apartmentNo
    });

    const totalAmount = aidatlar.reduce((sum, a) => sum + a.amount, 0);
    const paidAmount = aidatlar
      .filter(a => a.paid)
      .reduce((sum, a) => sum + a.amount, 0);

    const unpaidAmount = totalAmount - paidAmount;

    res.json({
      totalAmount,
      paidAmount,
      unpaidAmount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
