import mongoose, { Schema, Document, model } from "mongoose";

export type PaymentStatus =
  | "CREATED"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;

  gateway: "RAZORPAY" | "STRIPE" | "PAYPAL";
  gatewayOrderId?: string;
  transactionId?: string;

  amount: number;
  currency: string;

  status: PaymentStatus;

  orderSnapshot?: {
    templateTitle?: string;
    licenseType?: "personal" | "commercial";
  };

  failureReason?: string;
  refundedAt?: Date;

  rawWebhookPayload?: any;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gateway: {
      type: String,
      enum: ["RAZORPAY", "STRIPE", "PAYPAL"],
      required: true,
    },

    gatewayOrderId: {
      type: String,
      index: true,
      sparse: true,
    },

    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED", "REFUNDED", "CANCELLED"],
      default: "CREATED",
      index: true,
    },

    orderSnapshot: {
      templateTitle: String,
      licenseType: {
        type: String,
        enum: ["personal", "commercial"],
      },
    },

    failureReason: String,
    refundedAt: Date,

    rawWebhookPayload: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default model<IPayment>("Payment", paymentSchema);
