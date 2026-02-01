import { Request, Response } from "express";
import Payment from "../modals/payment.model";
import Order from "../modals/order.model";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { isFinalPaymentState, verifyRazorpaySignature} from "../utils/payment";
import razorpay from "../utils/razorpay";



export const createPayment = asyncHandler(async (req, res) => {
  const { orderId, gateway } = req.body;

  if (gateway !== "RAZORPAY") {
    throw new ApiError(400, "Only Razorpay supported");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus !== "PENDING") {
    throw new ApiError(400, "Order already processed");
  }

  let payment = await Payment.findOne({
    order: orderId,
    status: "CREATED",
  });

  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      user: (req as any).user._id,
      gateway,
      amount: order.price,
      currency: order.currency,
    });
  }

  // 🔥 CREATE RAZORPAY ORDER
  const razorpayOrder = await razorpay.orders.create({
    amount: order.price * 100, // paise
    currency: order.currency,
    receipt: `order_${order._id}`,
  });

  // 🔥 SAVE gatewayOrderId
  payment.gatewayOrderId = razorpayOrder.id;
  await payment.save();

  res.status(201).json(
    new ApiResponse(201, {
      paymentId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.price,
      currency: order.currency,
    })
  );
});



/* ==============================
   Webhook (Gateway → Backend)
   Rule: Payment first → Order
============================== */
export const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) return res.status(400).send("Missing signature");

  const isValid = verifyRazorpaySignature(
    req.body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  );

  if (!isValid) return res.status(401).send("Invalid signature");

  const payload = JSON.parse(req.body.toString());

  if (payload.event !== "payment.captured") {
    return res.status(200).send("Ignored");
  }

  const entity = payload.payload.payment.entity;

  const payment = await Payment.findOne({
    gatewayOrderId: entity.order_id,
  });

  if (!payment) return res.status(200).send("OK");

  if (entity.amount !== payment.amount * 100) {
    throw new ApiError(400, "Amount mismatch");
  }

  if (entity.currency !== payment.currency) {
    throw new ApiError(400, "Currency mismatch");
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: { $nin: ["SUCCESS", "FAILED", "REFUNDED", "CANCELLED"] },
    },
    {
      status: "SUCCESS",
      transactionId: entity.id,
      rawWebhookPayload: payload,
    },
    { new: true }
  );

  if (!updatedPayment) {
    return res.status(200).send("Already processed");
  }

  await Order.findByIdAndUpdate(updatedPayment.order, {
    paymentStatus: "SUCCESS",
    orderStatus: "COMPLETED",
  });

  res.status(200).send("OK");
});


/* ==============================
   User Payments
============================== */
export const getMyPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const payments = await Payment.find({
      user: (req as any).user._id,
    })
      .populate("order")
      .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, payments));
  }
);

/* ==============================
   Refund (Admin Only)
============================== */
export const refundPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new ApiError(404, "Payment not found");

    if (payment.status === "REFUNDED") {
      throw new ApiError(400, "Payment already refunded");
    }

    payment.status = "REFUNDED";
    payment.refundedAt = new Date();
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: "REFUNDED",
      orderStatus: "REFUNDED",
      refund: {
        isRefunded: true,
        refundedAt: new Date(),
      },
    });

    res.json(new ApiResponse(200, payment, "Payment refunded"));
  }
);


/* ==============================
   Verify Payment (Client → Backend)
============================== */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, gatewayOrderId, transactionId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (isFinalPaymentState(payment.status)) {
    throw new ApiError(400, "Payment already processed");
  }

  // ⚠️ Only if frontend proof is valid
  payment.gatewayOrderId = gatewayOrderId;
  payment.transactionId = transactionId;
  payment.status = "SUCCESS";
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, {
    payment: payment._id,
    paymentStatus: "SUCCESS",
    orderStatus: "COMPLETED",
  });

  res.json(new ApiResponse(200, payment, "Payment verified"));
});



/* ==============================
   Mark Payment Failed
============================== */
export const failPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ApiError(404, "Payment not found");

    if (isFinalPaymentState(payment.status)) {
      throw new ApiError(400, "Payment already finalized");
    }

    payment.status = "FAILED";
    payment.failureReason = reason;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: "FAILED",
      orderStatus: "CANCELLED",
    });

    res.json(new ApiResponse(200, payment, "Payment failed"));
  }
);


/* ==============================
   Cancel Payment
============================== */
export const cancelPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (isFinalPaymentState(payment.status)) {
    throw new ApiError(400, "Cannot cancel final payment");
  }

  payment.status = "CANCELLED";
  await payment.save();

  await Order.findByIdAndUpdate(payment.order, {
    paymentStatus: "FAILED",
    orderStatus: "CANCELLED",
  });

  res.json(new ApiResponse(200, payment, "Payment cancelled"));
});



/* ==============================
   Admin: Get All Payments
============================== */
export const getAllPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("order")
      .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, payments));
  }
);

