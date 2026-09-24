const multer = require('multer');

// Store file in memory buffer for fast extraction and processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.json', '.csv'];
  const ext = (file.originalname || '').toLowerCase();

  const isAllowed = allowedExtensions.some((allowed) => ext.endsWith(allowed));

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type for "${file.originalname}". Allowed formats: PDF, Word (DOCX/DOC), Plain Text (.txt), Markdown (.md).`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
});

module.exports = upload;
