import mongoose, { Schema, Document } from "mongoose";

export interface ISellerProfile extends Document {
  user: mongoose.Types.ObjectId;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  totalTemplates?: number;
  totalEarnings?: number;
  rating?: number;
  ratingCount?: number;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sellerProfileSchema = new Schema<ISellerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bio: String,
    avatar: String,
    socialLinks: {
      website: String,
      twitter: String,
      github: String,
      linkedin: String,
    },
    totalTemplates: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISellerProfile>("SellerProfile", sellerProfileSchema);
