import { Request, Response } from "express";
import Review from "../modals/review.model";
import Template from "../modals/template.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/* ==============================
   Create Review
============================== */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { templateId, rating, comment } = req.body;

  if (!templateId || !rating) {
    throw new ApiError(400, "Template ID and rating are required");
  }

  // Prevent duplicate review by same user
  const existing = await Review.findOne({ template: templateId, user: userId });
  if (existing) throw new ApiError(400, "You have already reviewed this template");

  const review = await Review.create({
    template: templateId,
    user: userId,
    rating,
    comment,
  });

  res.status(201).json(new ApiResponse(201, review, "Review created"));
});

/* ==============================
   Get All Reviews for a Template
============================== */
export const getReviewsByTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const reviews = await Review.find({ template: templateId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, reviews));
});

/* ==============================
   Update My Review
============================== */
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) throw new ApiError(404, "Review not found");

  if (rating) review.rating = rating;
  if (comment) review.comment = comment;

  await review.save();
  res.json(new ApiResponse(200, review, "Review updated"));
});

/* ==============================
   Delete My Review
============================== */
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { reviewId } = req.params;

  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
  if (!review) throw new ApiError(404, "Review not found");

  res.json(new ApiResponse(200, review, "Review deleted"));
});

/* ==============================
   Admin: Get All Reviews
============================== */
export const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await Review.find()
    .populate("user", "name email")
    .populate("template", "title slug")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, reviews));
});

/* ==============================
   Admin: Delete Any Review
============================== */
export const deleteReviewByAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  res.json(new ApiResponse(200, review, "Review deleted by admin"));
});
