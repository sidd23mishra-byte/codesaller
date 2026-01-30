import { Request, Response } from "express";
import User from "../modals/user.modal";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otp";
import { sendEmail } from "../utils/sendEmail";
/* =======================
   Register User
======================= */

export const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { name, email, password, role, } = req.body;

        if (!name || !email || !password) {
            throw new ApiError(400, "All fields are required");
        }


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(409, "User already exists");
        }

        let profileImage = "";

        if (req.file?.path) {
            const image = await uploadOnCloudinary(req.file.path);
            profileImage = image?.secure_url || "";
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            profileImage,
        });

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(201).json(
            new ApiResponse(201, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                },
                accessToken,
                refreshToken,
            }, "User registered successfully")
        );
    }
);

export const isVerifiedUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    /* -------------------------------
       Check User
    --------------------------------*/
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
      throw new ApiError(400, "User already verified");
    }

    /* -------------------------------
       Generate OTP
    --------------------------------*/
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    user.emailOTP = hashedOTP;
    user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    /* -------------------------------
       Send Email
    --------------------------------*/
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Your verification OTP is ${otp}. It will expire in 10 minutes.`,
    });

    return res.status(200).json(
      new ApiResponse(200, "OTP sent to email")
    );
  }
);

export const verifyEmailOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      throw new ApiError(400, "OTP is required");
    }

    const user = await User.findById(userId).select("+emailOTP");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.emailOTP || !user.emailOTPExpires) {
      throw new ApiError(400, "OTP not generated");
    }

    if (user.emailOTPExpires < new Date()) {
      throw new ApiError(400, "OTP expired");
    }

    const isValid = await verifyOTP(otp, user.emailOTP);

    if (!isValid) {
      throw new ApiError(400, "Invalid OTP");
    }

    /* -------------------------------
       Mark Verified
    --------------------------------*/
    user.isVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, "Email verified successfully")
    );
  }
);


/* =======================
   Login User
======================= */

export const loginUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError(400, "Email and password required");
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            throw new ApiError(401, "Invalid credentials");
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Invalid credentials");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(200).json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                accessToken,
                refreshToken,
            }, "Login successful")
        );
    }
);

/* =======================
   Logout User
======================= */

export const logoutUser = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;

        await User.findByIdAndUpdate(userId, {
            $unset: { refreshToken: 1 },
        });

        res.status(200).json(
            new ApiResponse(200, {}, "Logged out successfully")
        );
    }
);

/* =======================
   Get Current User
======================= */

export const getCurrentUser = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        res.status(200).json(
            new ApiResponse(200, user, "User fetched successfully")
        );
    }
);
