import { Router } from "express";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  uploadTemplateSource,
  downloadTemplateSource,
  getPublishedTemplates,
  getTemplateBySlug,
  getMyTemplates,
  togglePublishTemplate,
  getPendingTemplates,
  approveTemplate,
  getSellerEarnings,
  incrementTemplateViews,
} from "../controllers/template.controller";

import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";
import { imageUpload, zipUpload } from "../middlewares/multer.middleware";

const router = Router();

/* =======================
   PUBLIC ROUTES
======================= */

// Marketplace listing
router.get("/", getPublishedTemplates);

// Template details
router.get("/:slug", getTemplateBySlug);

// Count views
router.patch("/:id/views", incrementTemplateViews);

/* =======================
   SELLER ROUTES
======================= */

// Create template
router.post(
  "/",
  validateAuth,
  authorizeRoles("SELLER"),
  imageUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "previewImages", maxCount: 5 },
  ]),
  createTemplate
);

// Update template
router.put(
  "/:id",
  validateAuth,
  authorizeRoles("SELLER"),
  imageUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "previewImages", maxCount: 5 },
  ]),
  updateTemplate
);

// Delete template
router.delete(
  "/:id",
  validateAuth,
  authorizeRoles("SELLER"),
  deleteTemplate
);

// Upload source ZIP
router.post(
  "/:id/source",
  validateAuth,
  authorizeRoles("SELLER"),
  zipUpload.single("source"),
  uploadTemplateSource
);

// Toggle publish
router.patch(
  "/:id/publish",
  validateAuth,
  authorizeRoles("SELLER"),
  togglePublishTemplate
);

// Seller dashboard
router.get(
  "/seller/me",
  validateAuth,
  authorizeRoles("SELLER"),
  getMyTemplates
);

// Seller earnings
router.get(
  "/seller/earnings",
  validateAuth,
  authorizeRoles("SELLER"),
  getSellerEarnings
);

/* =======================
   BUYER ROUTES
======================= */

// Download purchased source
router.get(
  "/:id/source",
  validateAuth,
  authorizeRoles("USER", "SELLER"),
  downloadTemplateSource
);

/* =======================
   ADMIN ROUTES
======================= */

// Pending approvals
router.get(
  "/admin/pending",
  validateAuth,
  authorizeRoles("ADMIN"),
  getPendingTemplates
);

// Approve / Reject
router.patch(
  "/admin/:id/approve",
  validateAuth,
  authorizeRoles("ADMIN"),
  approveTemplate
);

export default router;
