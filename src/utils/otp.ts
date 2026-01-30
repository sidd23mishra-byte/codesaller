import crypto from "crypto";
import bcrypt from "bcryptjs";

/* ----------------------------------
   Generate OTP
-----------------------------------*/
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* ----------------------------------
   Hash OTP
-----------------------------------*/
export const hashOTP = async (otp: string): Promise<string> => {
  const salt: string = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/* ----------------------------------
   Verify OTP
-----------------------------------*/
export const verifyOTP = async (
  otp: string,
  hashedOTP: string
): Promise<boolean> => {
  return await bcrypt.compare(otp, hashedOTP);
};
