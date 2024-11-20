import multer from 'multer';

export const fileType = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  pdf: ['application/pdf'],
};

function fileUpload(customTypes = []) {
  const storage = multer.memoryStorage(); // Store files in memory for direct upload

  function fileFilter(req, file, cb) {
    if (customTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format"), false);
    }
  }

  const upload = multer({ storage, fileFilter });

  return upload;
}

export default fileUpload;
