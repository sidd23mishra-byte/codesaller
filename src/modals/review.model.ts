import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  template: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    template: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", reviewSchema);
