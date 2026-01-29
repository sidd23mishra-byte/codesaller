import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/user.controller";

import { validateAuth, AdminVerify } from "../middlewares/auth.middleware";

const router = Router();

/* =======================
   Auth Routes
======================= */

// register
router.post("/register", registerUser);

// login
router.post("/login", loginUser);

// logout (protected)
router.post("/logout", validateAuth, logoutUser);

// get current logged-in user
router.get("/me", validateAuth, getCurrentUser);

/* =======================
   Admin Example Route
======================= */

// only admin can access
router.get("/admin", validateAuth, AdminVerify, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
});

export default router;
