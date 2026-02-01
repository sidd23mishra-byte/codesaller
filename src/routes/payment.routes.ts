import { Router } from "express";
import {
  createPayment,
  paymentWebhook,
  getMyPayments,
  refundPayment,
  verifyPayment,
  failPayment,
  cancelPayment,
  getAllPayments,
} from "../controllers/payment.controller";
import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

/* ==============================
   USER ROUTES
============================== */

// Create a payment for an order
router.post("/create", validateAuth, createPayment);

// Verify payment (frontend → backend)
router.post("/verify", validateAuth, verifyPayment);

// Get logged-in user's payments
router.get("/me", validateAuth, getMyPayments);

// Fail a payment manually (user/admin)
router.post("/fail", validateAuth, failPayment);

// Cancel a payment
router.post("/cancel/:id", validateAuth, cancelPayment);

/* ==============================
   ADMIN ROUTES
============================== */

// Refund a payment
router.post("/refund/:id", validateAuth, authorizeRoles("ADMIN"), refundPayment);

// Get all payments (admin)
router.get("/", validateAuth, authorizeRoles("ADMIN"), getAllPayments);

/* ==============================
   WEBHOOK (Public)
============================== */

// Razorpay webhook (no auth, uses signature)
router.post("/webhook", paymentWebhook);

export default router;
