const PDFDocument = require("pdfkit");
const path = require("path");

exports.generateAidatReport = (res, title, rows) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40
  });

  // ✅ TÜRKÇE FONT
  const fontPath = path.join(__dirname, "../fonts/DejaVuSans.ttf");
  doc.font(fontPath);

  doc.pipe(res);

  /* ========= BAŞLIK ========= */
  doc
    .fontSize(18)
    .text(title, { align: "center" });

  doc.moveDown(1.5);

  /* ========= TABLO BAŞLIKLARI ========= */
  doc.fontSize(11);

  const headerY = doc.y;

  doc.text("No", 40, headerY);
  doc.text("Daire", 70, headerY);
  doc.text("Ad Soyad", 120, headerY);
  doc.text("Açıklama", 260, headerY);
  doc.text("Tutar", 390, headerY);
  doc.text("Durum", 460, headerY);

  doc
    .moveTo(40, headerY + 15)
    .lineTo(550, headerY + 15)
    .stroke();

  doc.moveDown(0.8);

  /* ========= SATIRLAR ========= */
  doc.fontSize(10);

  rows.forEach((r, i) => {
    const y = doc.y;

    doc.fillColor("black");
    doc.text(i + 1, 40, y);
    doc.text(r.apartmentNo ?? "-", 70, y);
    doc.text(r.name ?? "-", 120, y, { width: 130 });
    doc.text(r.title ?? "-", 260, y, { width: 120 });
    doc.text(`${r.amount} ₺`, 390, y);

    doc
      .fillColor(r.paid ? "green" : "red")
      .text(r.paid ? "ÖDENDİ" : "ÖDENMEDİ", 460, y);

    doc.fillColor("black");
    doc.moveDown(0.8);

    if (doc.y > 750) doc.addPage();
  });

  /* ========= ÖZET ========= */
  doc.moveDown(2);
  doc.fontSize(11);

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const paidAmount = rows
    .filter(r => r.paid)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;

  // 🔴 SABİT KONTROLLÜ YAPİ
  const summaryX = 350;
  const summaryWidth = 200;
  const startY = doc.y;
  const lineHeight = 14; // 👈 boşluk buradan ayarlanır

  doc
    .fillColor("black")
    .text(`Toplam Borç: ${totalAmount} ₺`, summaryX, startY, {
      width: summaryWidth,
      align: "right"
    });

  doc
    .fillColor("green")
    .text(`Ödenen: ${paidAmount} ₺`, summaryX, startY + lineHeight, {
      width: summaryWidth,
      align: "right"
    });

  doc
    .fillColor("red")
    .text(`Kalan: ${unpaidAmount} ₺`, summaryX, startY + lineHeight * 2, {
      width: summaryWidth,
      align: "right"
    });

  doc.fillColor("black");

  doc.end();
};