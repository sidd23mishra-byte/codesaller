import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

/* =======================
   Storage (Shared)
======================= */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve("public/temp"));
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_");

    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

/* =======================
   Image Filter
======================= */

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed"));
  }

  cb(null, true);
};

/* =======================
   ZIP Filter
======================= */

const zipFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype !== "application/zip" &&
    file.mimetype !== "application/x-zip-compressed"
  ) {
    return cb(new Error("Only ZIP files are allowed"));
  }

  cb(null, true);
};

/* =======================
   Upload Middlewares
======================= */

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});

export const zipUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: zipFileFilter,
});
