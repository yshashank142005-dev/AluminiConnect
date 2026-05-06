const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  MAX_CV_BYTES,
  ALLOWED_CV_EXTENSIONS,
  ALLOWED_CV_MIMES,
} = require('../utils/cvReviewSchema');

const tmpDir = path.join(__dirname, '../../uploads/tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
    return cb(new Error('Unsupported file extension. Allowed: PDF, DOCX, TXT'));
  }
  if (!ALLOWED_CV_MIMES.includes(mime)) {
    return cb(new Error('Unsupported file type. Allowed: PDF, DOCX, TXT'));
  }
  return cb(null, true);
};

const cvUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_CV_BYTES },
});

module.exports = { cvUpload, tmpDir };
