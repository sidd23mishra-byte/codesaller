import { Router } from "express";
import {
  createSellerProfile,
  getMySellerProfile,
  updateSellerProfile,
  getAllSellerProfiles,
  getSellerProfileById,
  deleteSellerProfile,
} from "../controllers/sellerProfilr.controller";
import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

/* ==============================
   User Routes
============================== */
// Create seller profile
router.post("/", validateAuth, createSellerProfile);

// Get my seller profile
router.get("/me", validateAuth, getMySellerProfile);

// Update my seller profile
router.put("/me", validateAuth, updateSellerProfile);

/* ==============================
   Admin Routes
============================== */
// Get all seller profiles
router.get("/", validateAuth, authorizeRoles("ADMIN"), getAllSellerProfiles);

// Get a single seller profile by ID
router.get("/:id", validateAuth, authorizeRoles("ADMIN"), getSellerProfileById);

// Delete a seller profile
router.delete("/:id", validateAuth, authorizeRoles("ADMIN"), deleteSellerProfile);

export default router;
