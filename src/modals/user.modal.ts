import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

/* =======================
   Interfaces
======================= */

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "USER" | "SELLER" | "ADMIN";
    isVerified: boolean;
    refreshToken?: string;

    comparePassword(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

/* =======================
   Schema
======================= */

const userSchema: Schema<IUser> = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["USER", "SELLER", "ADMIN"],
            default: "USER",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

/* =======================
   Hooks
======================= */

userSchema.pre<IUser>("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

/* =======================
   Methods
======================= */

userSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role,
            email: this.email,
        },
        env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        {
            _id: this._id.toString()

        },
        env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

/* =======================
   Model
======================= */

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
