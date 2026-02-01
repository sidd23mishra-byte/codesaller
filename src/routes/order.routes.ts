import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  canDownloadTemplate,
  refundOrder,
  paymentWebhook,
  cancelPendingOrder,
  getSellerEarnings,
} from "../controllers/order.controller";

import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

/* ======================
   USER ROUTES
====================== */

// Create order
router.post("/", validateAuth, createOrder);

// Verify payment (after gateway success)
router.post("/verify", validateAuth, verifyPayment);

// My orders
router.get("/my", validateAuth, getMyOrders);

// Cancel pending order
router.patch("/:id/cancel", validateAuth, cancelPendingOrder);

// Check download permission
router.get(
  "/can-download/:templateId",
  validateAuth,
  canDownloadTemplate
);

// Single order (user or seller)
router.get("/:id", validateAuth, getOrderById);


/* ======================
   SELLER ROUTES
====================== */

router.get(
  "/seller/orders",
  validateAuth,
  authorizeRoles("SELLER"),
  getSellerOrders
);

router.get(
  "/seller/earnings",
  validateAuth,
  authorizeRoles("SELLER"),
  getSellerEarnings
);


/* ======================
   ADMIN ROUTES
====================== */

router.post(
  "/refund/:id",
  validateAuth,
  authorizeRoles("ADMIN"),
  refundOrder
);


/* ======================
   PAYMENT WEBHOOK
====================== */

// No auth — verified by signature
router.post("/webhook/payment", paymentWebhook);

export default router;
