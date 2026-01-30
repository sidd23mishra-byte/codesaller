import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

/* =======================
   Interface
======================= */

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  role: "USER" | "SELLER" | "ADMIN";
  isVerified: boolean;

  refreshToken?: string;

  purchaseHistory: {
    templateId: mongoose.Types.ObjectId;
    purchasedAt: Date;
    price: number;
  }[];

  cart: {
    templateId: mongoose.Types.ObjectId;
    addedAt: Date;
  }[];

  wishlist: {
    templateId: mongoose.Types.ObjectId;
    addedAt: Date;
  }[];

  emailOTP?: string;
  emailOTPExpires?: Date;

  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;

  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

/* =======================
   Schema
======================= */

const userSchema = new Schema<IUser>(
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
      trim: true,
      index: true, // ⚡ faster lookups
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // 🔐 never return password
    },

    role: {
      type: String,
      enum: ["USER", "SELLER", "ADMIN"],
      default: "USER",
      index: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    purchaseHistory: [
      {
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Template",
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
        price: Number,
      },
    ],

    cart: [
      {
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Template",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    wishlist: [
      {
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Template",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ---------- Email Verification ---------- */
    emailOTP: {
      type: String,
      select: false,
    },

    emailOTPExpires: {
      type: Date,
    },

    /* ---------- Reset Password ---------- */
    resetPasswordOTP: {
      type: String,
      select: false,
    },

    resetPasswordOTPExpires: {
      type: Date,
    },

    /* ---------- Auth ---------- */
    refreshToken: {
      type: String,
      select: false, // 🔐 important security fix
    },
  },
  {
    timestamps: true,
  }
);

/* =======================
   Hooks
======================= */

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return ;

  this.password = await bcrypt.hash(this.password, 10);
});

/* =======================
   Methods
======================= */

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
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
      _id: this._id.toString(),
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
