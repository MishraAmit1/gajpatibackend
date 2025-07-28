import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    console.error("No file path provided");
    return null;
  }
  try {
    await fs.access(localFilePath);
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    await fs.unlink(localFilePath);
    return uploadResult;
  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }
    console.error("Upload error:", error);
    throw new Error("Failed to upload to Cloudinary", { cause: error });
  }
};
