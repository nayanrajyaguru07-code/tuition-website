// src/utils/uploadImage.js
import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (imagePath) => {
  try {
    if (!imagePath) return null;

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "uploads", // optional
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // Example URL: https://res.cloudinary.com/.../upload/v12345/uploads/abc.jpg
  // We need: "uploads/abc"

  const parts = url.split("/");
  const lastPart = parts.pop(); // "abc.jpg"
  const publicId = lastPart.split(".")[0]; // "abc"
  const folder = "uploads"; // Matches the folder name you used in upload

  return `${folder}/${publicId}`;
};

export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    // We don't throw error here to prevent blocking the DB delete
  }
};
