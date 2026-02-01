import { Request, Response } from "express";
import SellerProfile from "../modals/sellerProfile.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/* ==============================
   Create Seller Profile
============================== */
export const createSellerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const existing = await SellerProfile.findOne({ user: userId });
  if (existing) throw new ApiError(400, "Seller profile already exists");

  const profile = await SellerProfile.create({ user: userId, ...req.body });
  res.status(201).json(new ApiResponse(201, profile, "Seller profile created"));
});

/* ==============================
   Get My Seller Profile
============================== */
export const getMySellerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const profile = await SellerProfile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, "Seller profile not found");

  res.json(new ApiResponse(200, profile));
});

/* ==============================
   Update Seller Profile
============================== */
export const updateSellerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const profile = await SellerProfile.findOneAndUpdate({ user: userId }, req.body, { new: true });
  if (!profile) throw new ApiError(404, "Seller profile not found");

  res.json(new ApiResponse(200, profile, "Seller profile updated"));
});

/* ==============================
   Admin: Get All Seller Profiles
============================== */
export const getAllSellerProfiles = asyncHandler(async (_req: Request, res: Response) => {
  const profiles = await SellerProfile.find().populate("user", "name email");
  res.json(new ApiResponse(200, profiles));
});

/* ==============================
   Admin: Get Single Seller Profile
============================== */
export const getSellerProfileById = asyncHandler(async (req: Request, res: Response) => {
  const profile = await SellerProfile.findById(req.params.id).populate("user", "name email");
  if (!profile) throw new ApiError(404, "Seller profile not found");

  res.json(new ApiResponse(200, profile));
});

/* ==============================
   Admin: Delete Seller Profile
============================== */
export const deleteSellerProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await SellerProfile.findByIdAndDelete(req.params.id);
  if (!profile) throw new ApiError(404, "Seller profile not found");

  res.json(new ApiResponse(200, profile, "Seller profile deleted"));
});
