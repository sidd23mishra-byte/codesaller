import { Router } from "express";
import {
  createReview,
  getReviewsByTemplate,
  updateReview,
  deleteReview,
  getAllReviews,
  deleteReviewByAdmin,
} from "../controllers/review.controller";
import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

/* ==============================
   Public Routes
============================== */
// Get all reviews for a specific template
router.get("/template/:templateId", getReviewsByTemplate);

/* ==============================
   User Routes (Protected)
============================== */
router.use(validateAuth);

// Create a new review
router.post("/", createReview);

// Update my review
router.put("/:reviewId", updateReview);

// Delete my review
router.delete("/:reviewId", deleteReview);

/* ==============================
   Admin Routes (Protected + Admin)
============================== */
router.use(authorizeRoles("ADMIN"));

// Get all reviews
router.get("/", getAllReviews);

// Delete any review by admin
router.delete("/admin/:reviewId", deleteReviewByAdmin);

export default router;
