import { Request, Response } from "express";
import Template from "../modals/template.model";
import Order from "../modals/order.model"; // Make sure you import Order
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import slugify from "slugify";

/* =======================
   Create Template
======================= */
export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { title, shortDescription, description, price, category, techStack, tags, isFree } = req.body;

  // ------------------- Validations -------------------
  if (!title || !shortDescription || !description || !category || !techStack) {
    throw new ApiError(400, "Required fields missing");
  }
  if (!req.files || !(req.files as { [key: string]: Express.Multer.File[] }).thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }

  // ------------------- Slug -------------------
  const slug = slugify(title, { lower: true, strict: true });
  const existing = await Template.findOne({ slug });
  if (existing) throw new ApiError(409, "Template with this title already exists");

  // ------------------- Upload Thumbnail -------------------
  const thumbnailFile = (req.files as any).thumbnail[0];
  const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.path);

  if (!thumbnailUpload?.secure_url) throw new ApiError(500, "Thumbnail upload failed");

  // ------------------- Upload Preview Images -------------------
  const previewImages: string[] = [];
  if ((req.files as any).previewImages) {
    for (const file of (req.files as any).previewImages) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.secure_url) previewImages.push(uploaded.secure_url);
    }
  }
  if (previewImages.length === 0) throw new ApiError(400, "At least one preview image is required");

  // ------------------- Create Template -------------------
  const template = await Template.create({
    title,
    slug,
    shortDescription,
    description,
    price: isFree ? 0 : price,
    isFree,
    category,
    techStack: Array.isArray(techStack) ? techStack : techStack.split(","),
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : [],
    thumbnail: thumbnailUpload.secure_url,
    previewImages,
    seller: userId,
    isPublished: false,
    isApproved: false,
  });

  return res.status(201).json(new ApiResponse(201, template, "Template created successfully"));
});


/* =======================
   Upload Template Source (ZIP)
======================= */
export const uploadTemplateSource = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { id } = req.params;

  if (!req.file?.path) throw new ApiError(400, "Source ZIP is required");

  const template = await Template.findById(id);
  if (!template) throw new ApiError(404, "Template not found");
  if (template.seller.toString() !== userId.toString()) throw new ApiError(403, "Not allowed");

  const uploaded = await uploadOnCloudinary(req.file.path, {
    resourceType: "raw",
    folder: "template-sources",
  });

  if (!uploaded?.secure_url) throw new ApiError(500, "Source upload failed");

  template.sourceCodeUrl = uploaded.secure_url;
  await template.save();

  res.status(200).json(new ApiResponse(200, template, "Source file uploaded successfully"));
});


/* =======================
   Download Template Source
======================= */
export const downloadTemplateSource = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { id } = req.params;

  const template = await Template.findById(id).select("+sourceCodeUrl");
  if (!template || !template.sourceCodeUrl) throw new ApiError(404, "Source file not available");

  // ------------------- Check Purchase -------------------
  const hasPurchased = await Order.findOne({
    user: userId,
    template: id,
    paymentStatus: "SUCCESS",
  });
  if (!hasPurchased) throw new ApiError(403, "You have not purchased this template");

  res.status(200).json(new ApiResponse(200, { downloadUrl: template.sourceCodeUrl }, "Download link generated"));
});
