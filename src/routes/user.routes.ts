import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isVerifiedUser,
  verifyEmailOTP
} from "../controllers/user.controller";

import { imageUpload } from "../middlewares/multer.middleware";
import { validateAuth, AdminVerify } from "../middlewares/auth.middleware";

const router = Router();

/* =======================
   Auth Routes
======================= */

router.post(
  "/register",
  imageUpload.fields([{ name: "profileImage", maxCount: 1 }]),
  registerUser
);

router.post("/login", loginUser);
router.post("/logout", validateAuth, logoutUser);
router.get("/me", validateAuth, getCurrentUser);

// Email verification
router.post("/verify-email/:userId", isVerifiedUser); // send OTP
router.post("/verify-email-otp/:userId", verifyEmailOTP); // verify OTP

/* =======================
   Admin Route Example
======================= */
router.get("/admin", validateAuth, AdminVerify, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
});

export default router;
