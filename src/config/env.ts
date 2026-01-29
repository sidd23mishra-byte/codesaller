import { SignOptions } from "jsonwebtoken";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  ACCESS_TOKEN_SECRET: getEnv("ACCESS_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],

  REFRESH_TOKEN_SECRET: getEnv("REFRESH_TOKEN_SECRET"),
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
};
