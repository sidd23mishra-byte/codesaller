import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import type { UploadApiResponse } from "cloudinary";

/* =======================
   Cloudinary Config
======================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

/* =======================
   Upload Helper
======================= */

type UploadType = "image" | "raw" | "auto";

interface UploadOptions {
  folder?: string;
  resourceType?: UploadType;
}

const uploadOnCloudinary = async (
  localFilePath?: string,
  options: UploadOptions = {}
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: options.resourceType || "auto",
      folder: options.folder,
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export { uploadOnCloudinary };
