const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes("sheet") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel/CSV files allowed"));
    }
  }
});

module.exports = upload;
