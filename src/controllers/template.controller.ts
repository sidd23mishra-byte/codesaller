import { Request, Response } from "express";
import Template from "../modals/template.model";
import Order from "../modals/order.model"; // Make sure you import Order
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import slugify from "slugify";
import { isValidObjectId } from "mongoose";
import { deleteFromCloudinary } from "../utils/cloudinary";

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
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid template id");
  }

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
  const userId = (req as any).user?._id;
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid template id");
  }

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



export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { id } = req.params;

  const {
    title,
    shortDescription,
    description,
    price,
    category,
    techStack,
    tags,
    isFree
  } = req.body;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user");
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid template id");
  }

  const template = await Template.findById(id);

  if (!template) {
    throw new ApiError(404, "Template not found");
  }
  if (template?.isApproved) {
    throw new ApiError(403, "Approved templates cannot be modified");
  }

  if (template.seller.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this template");
  }

  /* ---------- Thumbnail Upload ---------- */
  let thumbnailUrl = template.thumbnail;
  const thumbnailFile = (req.files as any)?.thumbnail?.[0];

  if (thumbnailFile) {
    // 🔥 delete old thumbnail
    if (template.thumbnail) {
      await deleteFromCloudinary(template.thumbnail);
    }

    const uploaded = await uploadOnCloudinary(thumbnailFile.path);
    if (uploaded?.secure_url) {
      thumbnailUrl = uploaded.secure_url;
    }
  }

  /* ---------- Preview Images Upload ---------- */
  let previewImages = template.previewImages;

  if ((req.files as any)?.previewImages?.length) {
    // 🔥 delete old preview images
    for (const img of template.previewImages) {
      await deleteFromCloudinary(img);
    }

    previewImages = [];
    for (const file of (req.files as any).previewImages) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.secure_url) {
        previewImages.push(uploaded.secure_url);
      }
    }
  }


  const updatedTemplate = await Template.findByIdAndUpdate(
    id,
    {
      title,
      shortDescription,
      description,
      price: isFree ? 0 : price,
      isFree,
      category,
      techStack: Array.isArray(techStack)
        ? techStack
        : techStack?.split(","),
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",")
        : [],
      thumbnail: thumbnailUrl,
      previewImages,
    },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedTemplate, "Template updated successfully"));
});




export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { id } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user");
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid template id");
  }

  const template = await Template.findById(id);
  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  if (template.seller.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this template");
  }

  const deletedTemplate = await Template.findByIdAndDelete(id);
  if (!deletedTemplate) {
    throw new ApiError(500, "Something went wrong while deleting template");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedTemplate, "Template deleted successfully"));
});





export const getPublishedTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 12, category, search } = req.query;

  const query: any = {
    isPublished: true,
    isApproved: true,
  };

  if (category) query.category = category;
  if (search) query.title = { $regex: search, $options: "i" };

  const templates = await Template.find(query)
    .select("-sourceCodeUrl")
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, templates, "Templates fetched successfully")
  );
});


export const getTemplateBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const template = await Template.findOne({
    slug,
    isPublished: true,
    isApproved: true,
  }).select("-sourceCodeUrl");

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res.status(200).json(new ApiResponse(200, template));
});




export const getMyTemplates = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const templates = await Template.find({ seller: userId })
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, templates, "Your templates fetched")
  );
});


export const togglePublishTemplate = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { id } = req.params;

  const template = await Template.findOne({ _id: id, seller: userId });
  if (!template) throw new ApiError(404, "Template not found");

  if (!template.isApproved) {
    throw new ApiError(403, "Template not approved yet");
  }

  template.isPublished = !template.isPublished;
  await template.save();

  res.status(200).json(
    new ApiResponse(200, template, "Publish status updated")
  );
});


export const getPendingTemplates = asyncHandler(async (_req, res) => {
  const templates = await Template.find({ isApproved: false });

  res.status(200).json(
    new ApiResponse(200, templates, "Pending templates fetched")
  );
});



export const approveTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body; // true / false

  const template = await Template.findById(id);
  if (!template) throw new ApiError(404, "Template not found");

  template.isApproved = approve;
  template.isPublished = approve ? true : false;

  await template.save();

  res.status(200).json(
    new ApiResponse(200, template, approve ? "Approved" : "Rejected")
  );
});


export const getSellerEarnings = asyncHandler(async (req, res) => {
  const sellerId = (req as any).user._id;

  const orders = await Order.aggregate([
    { $match: { seller: sellerId, paymentStatus: "SUCCESS" } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$amount" },
        totalSales: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, orders[0] || { totalEarnings: 0, totalSales: 0 })
  );
});


export const incrementTemplateViews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Template.findByIdAndUpdate(id, { $inc: { views: 1 } });

  res.status(200).json(new ApiResponse(200, null, "View counted"));
});











