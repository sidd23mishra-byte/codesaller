import mongoose, { Schema, Document, Model } from "mongoose";

/* ----------------------------------
   Template Interface
-----------------------------------*/
export interface ITemplate extends Document {
  /* Basic Info */
  title: string;
  slug: string;
  shortDescription: string;
  description: string;

  /* Pricing */
  price: number;
  discountPrice?: number;
  isFree: boolean;

  /* Classification */
  category: string;           // Fullstack, Backend, Frontend, Mobile
  subCategory?: string;       // Admin Panel, SaaS, E-commerce
  tags: string[];
  techStack: string[];        // Next.js, Node, MongoDB, TS

  /* Media & Preview */
  thumbnail: string;
  previewImages: string[];
  demoUrl?: string;
  videoPreviewUrl?: string;

  /* Files & Delivery */
  sourceCodeUrl?: string;     // hidden (after purchase)
  documentationUrl?: string;
  version: string;
  fileSize?: number;          // in MB
  license: "MIT" | "GPL" | "Commercial";

  /* Seller */
  seller: mongoose.Types.ObjectId;

  /* Status & Visibility */
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;

  /* Stats */
  totalSales: number;
  totalDownloads: number;
  rating: number;
  totalReviews: number;

  /* SEO */
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  /* Support */
  supportDuration?: string;   // 3 months, 6 months
  refundAvailable: boolean;

  /* System */
  createdAt: Date;
  updatedAt: Date;
}

/* ----------------------------------
   Template Schema
-----------------------------------*/
const templateSchema = new Schema<ITemplate>(
  {
    /* Basic Info */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    shortDescription: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
    },

    /* Pricing */
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    /* Classification */
    category: {
      type: String,
      required: true,
      index: true,
    },

    subCategory: String,

    tags: {
      type: [String],
      index: true,
    },

    techStack: {
      type: [String],
      required: true,
    },

    /* Media & Preview */
    thumbnail: {
      type: String,
      required: true,
    },

    previewImages: {
      type: [String],
      required: true,
    },

    demoUrl: String,
    videoPreviewUrl: String,

    /* Files & Delivery */
    sourceCodeUrl: {
      type: String,
      select: false, // hidden by default
    },

    documentationUrl: String,

    version: {
      type: String,
      default: "1.0.0",
    },

    fileSize: Number,

    license: {
      type: String,
      enum: ["MIT", "GPL", "Commercial"],
      default: "Commercial",
    },

    /* Seller */
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* Status & Visibility */
    isPublished: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    /* Stats */
    totalSales: {
      type: Number,
      default: 0,
    },

    totalDownloads: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    /* SEO */
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],

    /* Support */
    supportDuration: String,

    refundAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ----------------------------------
   Indexes (Search & Performance)
-----------------------------------*/
templateSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  techStack: "text",
});

/* ----------------------------------
   Model Export
-----------------------------------*/
const Template: Model<ITemplate> =
  mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", templateSchema);

export default Template;
