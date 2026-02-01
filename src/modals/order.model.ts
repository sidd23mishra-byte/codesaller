import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId;

  templateSnapshot: {
    title: string;
    slug: string;
    version: string;
  };

  price: number;
  currency: string;

  platformFee: number;
  sellerEarning: number;

  licenseType: "personal" | "commercial";

  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  orderStatus: "CREATED" | "COMPLETED" | "CANCELLED" | "REFUNDED";

  paymentMethod?: string;
  transactionId?: string;

  payment?: mongoose.Types.ObjectId; // ✅ Link to Payment

  refund?: {
    isRefunded: boolean;
    refundedAt?: Date;
    refundTransactionId?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: Schema.Types.ObjectId, ref: "Template", required: true },

    templateSnapshot: {
      title: { type: String, required: true },
      slug: { type: String, required: true },
      version: { type: String, required: true },
    },

    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    platformFee: { type: Number, default: 0 },
    sellerEarning: { type: Number, default: 0 },

    licenseType: {
      type: String,
      enum: ["personal", "commercial"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ["CREATED", "COMPLETED", "CANCELLED", "REFUNDED"],
      default: "CREATED",
      index: true,
    },

    paymentMethod: String,
    transactionId: String,

    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment", // ✅ Link to Payment model
    },

    refund: {
      isRefunded: { type: Boolean, default: false },
      refundedAt: Date,
      refundTransactionId: String,
    },
  },
  { timestamps: true }
);

// 🔥 Index for faster queries on user + status
orderSchema.index({ user: 1, paymentStatus: 1, orderStatus: 1 });

export default mongoose.model<IOrder>("Order", orderSchema);
