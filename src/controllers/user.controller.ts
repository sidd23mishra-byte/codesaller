import { Request, Response } from "express";
import User from "../modals/user.modal";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otp";
import { sendEmail } from "../utils/sendEmail";
import { deleteFromCloudinary } from "../utils/cloudinary";
/* =======================
   Register User
======================= */

export const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
        const { name, email, password } = req.body;

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
        if (!user.isVerified) {
            throw new ApiError(403, "Please verify your email first");
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

export const updateProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const { name } = req.body;

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        let profileImage = user.profileImage;

        if (req.file?.path) {
            if (user.profileImage) {
                await deleteFromCloudinary(user.profileImage);
            }

            const uploaded = await uploadOnCloudinary(req.file.path);
            profileImage = uploaded?.secure_url || profileImage;
        }

        user.name = name || user.name;
        user.profileImage = profileImage;
        await user.save();

        res.status(200).json(
            new ApiResponse(200, user, "Profile updated successfully")
        );
    }
);


export const changePassword = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "Old and new password required");
        }

        const user = await User.findById(userId).select("+password");
        if (!user) throw new ApiError(404, "User not found");

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) throw new ApiError(401, "Old password incorrect");

        user.password = newPassword;
        user.refreshToken = undefined; // logout all sessions
        await user.save();

        res.status(200).json(
            new ApiResponse(200, null, "Password changed successfully")
        );
    }
);



export const forgotPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email) {
            throw new ApiError(400, "Email is required");
        }

        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        const otp = generateOTP();
        const hashedOTP = await hashOTP(otp);

        user.resetPasswordOTP = hashedOTP;
        user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

        await user.save({ validateBeforeSave: false });

        await sendEmail({
            to: email,
            subject: "Reset Password",
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
        });

        res.status(200).json(
            new ApiResponse(200, "Password reset OTP sent")
        );
    }
);



export const resetPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            throw new ApiError(400, "All fields are required");
        }

        const user = await User.findOne({ email })
            .select("+resetPasswordOTP");

        if (!user) throw new ApiError(404, "User not found");

        if (
            !user.resetPasswordOTP ||
            !user.resetPasswordOTPExpires ||
            user.resetPasswordOTPExpires < new Date()
        ) {
            throw new ApiError(400, "OTP expired or not generated");
        }

        const isValid = await verifyOTP(otp, user.resetPasswordOTP);
        if (!isValid) throw new ApiError(400, "Invalid OTP");

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        user.refreshToken = undefined; // logout all sessions

        await user.save();

        res.status(200).json(
            new ApiResponse(200, "Password reset successful")
        );
    }
);



export const deleteAccount = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req as any).user._id;

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        if (user.profileImage) {
            await deleteFromCloudinary(user.profileImage);
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json(
            new ApiResponse(200, "Account deleted successfully")
        );
    }
);




