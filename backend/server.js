require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server çalışıyor. Port: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server başlatılamadı:", error.message);
    process.exit(1);
  }
})();