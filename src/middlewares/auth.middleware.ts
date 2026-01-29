import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { env } from "../config/env";

/* =======================
   Extend Request Type
======================= */

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    _id: string;
    role: "USER" | "SELLER" | "ADMIN";
  };
}

/* =======================
   Validate Auth
======================= */

export const validateAuth = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken: JwtPayload;

    try {
      decodedToken = jwt.verify(
        token,
        env.ACCESS_TOKEN_SECRET
      ) as JwtPayload;
    } catch {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = decodedToken as AuthRequest["user"];
    next();
  }
);

/* =======================
   Admin Only
======================= */

export const AdminVerify = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== "ADMIN") {
      throw new ApiError(403, "Access denied, Admins only");
    }
    next();
  }
);

/* =======================
   Role-based Authorization
======================= */

export const authorizeRoles =
  (...roles: Array<"USER" | "SELLER" | "ADMIN">) =>
  asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Access denied");
    }
    next();
  });
