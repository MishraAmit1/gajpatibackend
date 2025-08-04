import multer from "multer";
import path from "path";

const customFileFilter = (req, file, cb) => {
  if (!file?.originalname) {
    return cb(new Error("File name is missing"), false);
  }
  // images field: only allow images
  if (file.fieldname === "image" || file.fieldname === "images") {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(
      new Error(
        "Only image files (jpeg, jpg, png, gif, webp) are allowed for images"
      ),
      false
    );
  }
  // brochure or tds field: only allow PDF, DOC, DOCX
  if (file.fieldname === "brochure" || file.fieldname === "tds") {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Accept common mimetypes for PDF, DOC, DOCX
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(
      new Error("Only PDF, DOC, DOCX files are allowed for brochure and tds"),
      false
    );
  }
  // default: reject
  cb(new Error("Unexpected field"), false);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: customFileFilter,
});
