import mongoose, { Schema, Document, model } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId;
  price: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  paymentMethod?: string;
  transactionId?: string;
  licenseType?: "personal" | "commercial";
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    price: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    paymentMethod: { type: String }, // e.g., "Stripe", "PayPal"
    transactionId: { type: String }, // e.g., from Stripe or PayPal
    licenseType: {
      type: String,
      enum: ["personal", "commercial"],
      default: "personal",
    },
  },
  { timestamps: true }
);

const Order = model<IOrder>("Order", orderSchema);
export default Order;
