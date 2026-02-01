import { Request, Response } from "express";
import Template from "../modals/template.model";
import Order from "../modals/order.model"; // Make sure you import Order
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { isValidObjectId } from "mongoose";




export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { templateId, licenseType } = req.body;
    const userId = (req as any).user._id;

    if (!isValidObjectId(templateId)) {
        throw new ApiError(400, "Invalid template ID");
    }

    if (!["personal", "commercial"].includes(licenseType)) {
        throw new ApiError(400, "Invalid license type");
    }

    const template = await Template.findById(templateId);
    if (!template) {
        throw new ApiError(404, "Template not found");
    }

    const existingOrder = await Order.findOne({
        user: userId,
        template: template._id,
        paymentStatus: "SUCCESS",
    });

    if (existingOrder) {
        throw new ApiError(400, "Template already purchased");
    }

    const price =
        licenseType === "commercial"
            ? template.price.commercial
            : template.price.personal;

    const platformFee = Math.round(price * 0.2);
    const sellerEarning = price - platformFee;

    const order = await Order.create({
        user: userId,
        seller: template.seller,
        template: template._id,
        templateSnapshot: {
            title: template.title,
            slug: template.slug,
            version: template.version,
        },
        price,
        currency: "INR",
        platformFee,
        sellerEarning,
        licenseType,
    });

    res.status(201).json(new ApiResponse(201, order, "Order created"));
});



export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, transactionId, paymentMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    if (order.paymentStatus === "SUCCESS") {
        throw new ApiError(400, "Payment already verified");
    }

    if (order.user.toString() !== (req as any).user._id.toString()) {
        throw new ApiError(403, "Not authorized to verify this order");
    }


    order.paymentStatus = "SUCCESS";
    order.orderStatus = "COMPLETED";
    order.transactionId = transactionId;
    order.paymentMethod = paymentMethod;
    await order.save();

    res.json(new ApiResponse(200, order, "Payment verified"));
});


export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({ user: (req as any).user._id })
        .populate("template", "title slug")
        .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, orders));
});


export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find({
        seller: (req as any).user._id,
        paymentStatus: "SUCCESS",
    })
        .populate("user", "name email")
        .populate("template", "title")
        .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, orders));
});


export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id)
        .populate("user", "name email")
        .populate("template", "title slug");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const userId = (req as any).user._id.toString();
    if (
        order.user.toString() !== userId &&
        order.seller.toString() !== userId
    ) {
        throw new ApiError(403, "Access denied");
    }

    res.json(new ApiResponse(200, order));
});


export const canDownloadTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { templateId } = req.params;

    const order = await Order.findOne({
        user: (req as any).user._id,
        template: templateId,
        paymentStatus: "SUCCESS",
        orderStatus: "COMPLETED",

    });

    if (!order) {
        throw new ApiError(403, "Purchase required");
    }

    res.json(new ApiResponse(200, { canDownload: true }));
});


export const refundOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    order.paymentStatus = "FAILED";
    order.orderStatus = "REFUNDED";
    order.refund = {
        isRefunded: true,
        refundedAt: new Date(),
        refundTransactionId: "refund_" + Date.now(),
    };

    await order.save();

    res.json(new ApiResponse(200, order, "Order refunded"));
});


export const paymentWebhook = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    // 🔒 verify signature here (gateway specific)
    const orderId = payload.order_id;
    const transactionId = payload.transaction_id;
    const status = payload.status;

    const order = await Order.findById(orderId);
    if (!order) return res.sendStatus(200);

    if (status === "SUCCESS" && order.paymentStatus !== "SUCCESS") {
        order.paymentStatus = "SUCCESS";
        order.orderStatus = "COMPLETED";
        order.transactionId = transactionId;
        await order.save();
    }

    res.sendStatus(200);
});

export const cancelPendingOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: (req as any).user._id,
        paymentStatus: "PENDING",
    });

    if (!order) {
        throw new ApiError(404, "Pending order not found");
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    res.json(new ApiResponse(200, order, "Order cancelled"));
});


export const getSellerEarnings = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = (req as any).user._id;

    const result = await Order.aggregate([
        { $match: { seller: sellerId, paymentStatus: "SUCCESS" } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$price" },
                totalEarnings: { $sum: "$sellerEarning" },
                totalOrders: { $sum: 1 },
            },
        },
    ]);

    res.json(new ApiResponse(200, result[0] || {
        totalSales: 0,
        totalEarnings: 0,
        totalOrders: 0,
    }));
});
