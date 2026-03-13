const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const isExcel =
      file.mimetype.includes("sheet") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".csv");

    const isImage =
      file.mimetype.startsWith("image/") ||
      file.originalname.match(/\.(jpg|jpeg|png|webp)$/i);

    if (isExcel || isImage) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel/CSV files allowed"));
    }
  },
});

module.exports = upload;
