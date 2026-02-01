import { Request, Response } from "express";
import Category from "../modals/category.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import slugify from "slugify";

/* ==============================
   Create Category
============================== */
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) throw new ApiError(400, "Category name is required");

  const slug = slugify(name, { lower: true, strict: true });

  const existing = await Category.findOne({ slug });
  if (existing) throw new ApiError(400, "Category already exists");

  const category = await Category.create({ name, slug, description });

  res.status(201).json(new ApiResponse(201, category, "Category created"));
});

/* ==============================
   Get All Categories
============================== */
export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(new ApiResponse(200, categories));
});

/* ==============================
   Get Single Category
============================== */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  res.json(new ApiResponse(200, category));
});

/* ==============================
   Update Category
============================== */
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const updateData: any = {};

  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true, strict: true });
  }
  if (description) updateData.description = description;

  const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!category) throw new ApiError(404, "Category not found");

  res.json(new ApiResponse(200, category, "Category updated"));
});

/* ==============================
   Delete Category
============================== */
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  res.json(new ApiResponse(200, category, "Category deleted"));
});
