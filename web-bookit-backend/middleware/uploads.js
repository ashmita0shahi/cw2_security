// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/uploads"); // Upload directory
//   },
//   filename: (req, file, cb) => {
//     let ext = path.extname(file.originalname);
//     cb(null, `IMG-${Date.now()}${ext}`); // Generate a unique filename
//   },
// });

// const imageFileFilter = (req, file, cb) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//     return cb(new Error("File format not supported."), false);
//   }
//   cb(null, true);
// };

// // Update to handle multiple files (change .single to .array)
// const upload = multer({ storage, fileFilter: imageFileFilter }).array("images", 5);

// const uploadsingle = multer({ storage }).single("image");

// module.exports = { upload, uploadsingle };


const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `IMG-${Date.now()}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedFileTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"]; // Include WEBP support
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedFileTypes.includes(ext)) {
    return cb(new Error("File format not supported. Allowed formats: jpg, jpeg, png, gif, webp"), false);
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter: imageFileFilter }).array("images", 5);
const uploadsingle = multer({ storage, fileFilter: imageFileFilter }).single("image");

module.exports = { upload, uploadsingle };
