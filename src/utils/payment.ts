import crypto from "crypto";

/* ==============================
   Razorpay Webhook Verification
============================== */
export const verifyRazorpaySignature = (
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    // Prevent timingSafeEqual crash
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
};

/* ==============================
   Prevent Double Processing
============================== */
export const isFinalPaymentState = (status: string): boolean => {
  return ["SUCCESS", "FAILED", "REFUNDED", "CANCELLED"].includes(status);
};
