import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { validateAuth, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

/* ==============================
   Public Routes
============================== */
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

/* ==============================
   Admin Routes
============================== */
router.post("/", validateAuth, authorizeRoles("ADMIN"), createCategory);
router.put("/:id", validateAuth, authorizeRoles("ADMIN"), updateCategory);
router.delete("/:id", validateAuth, authorizeRoles("ADMIN"), deleteCategory);

export default router;
