import { Router } from "express";
import {
  createTemplate,
  uploadTemplateSource,
  downloadTemplateSource
} from "../controllers/template.controller";

import { imageUpload, zipUpload } from "../middlewares/multer.middleware";
import { validateAuth } from "../middlewares/auth.middleware";

const router = Router();

/* =======================
   Template Routes
======================= */

// 1️⃣ Create Template (images only, thumbnail + preview)
router.post(
  "/",
  validateAuth,
  imageUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "previewImages", maxCount: 10 }, // allow multiple preview images
  ]),
  createTemplate
);

// 2️⃣ Upload Template Source (ZIP)
router.post(
  "/:id/source",
  validateAuth,
  zipUpload.single("source"), // ZIP file
  uploadTemplateSource
);

// 3️⃣ Download Template Source (only purchased)
router.get(
  "/:id/source",
  validateAuth,
  downloadTemplateSource
);

export default router;
