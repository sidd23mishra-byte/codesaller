import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  isVerifiedUser,
  verifyEmailOTP,
} from "../controllers/user.controller";

import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";
import { imageUpload } from "../middlewares/multer.middleware";

const router = Router();

/* =======================
   Public Routes
======================= */

// Register user (profile image optional)
router.post(
  "/register",
  imageUpload.single("profileImage"),
  registerUser
);

// Login
router.post("/login", loginUser);

// Send email verification OTP
router.post("/verify-email/:userId", isVerifiedUser);

// Verify email OTP
router.post("/verify-email/:userId/otp", verifyEmailOTP);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);


/* =======================
   Protected Routes
======================= */

// Get current user
router.get(
  "/me",
  validateAuth,
  getCurrentUser
);

// Logout
router.post(
  "/logout",
  validateAuth,
  logoutUser
);

// Update profile (name + image)
router.put(
  "/profile",
  validateAuth,
  imageUpload.single("profileImage"),
  updateProfile
);

// Change password
router.put(
  "/change-password",
  validateAuth,
  changePassword
);

// Delete account
router.delete(
  "/delete-account",
  validateAuth,
  deleteAccount
);

export default router;
