import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

/* =======================
   Storage Config
======================= */

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb
    ) => {
        cb(null, "./public/temp");
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb
    ) => {
        const ext = path.extname(file.originalname);
        const name = path
            .basename(file.originalname, ext)
            .replace(/\s+/g, "_");

        cb(null, `${name}${ext}`);
    },
});

/* =======================
   File Filter
======================= */

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only images are allowed"));
    }

    cb(null, true);
};

/* =======================
   Upload Middleware
======================= */

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter,
});
