const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { saveBase64Image } = require('./imageHelper');

// Configure Cloudinary only if credentials are provided
const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary storage engine configured successfully.');
} else {
  console.warn('Cloudinary environment variables missing. Falling back to local disk storage (/uploads/).');
}

/**
 * Uploads a base64 image string to Cloudinary or falls back to local storage.
 * @param {string} base64String - Data URI (e.g. data:image/png;base64,...)
 * @param {string} folderName - Cloudinary target folder (e.g. "edutrack/faces")
 * @returns {Promise<string>} Secure URL (Cloudinary) or relative path (local storage)
 */
const uploadFaceImage = async (base64String, folderName = 'edutrack/attendance') => {
  if (!base64String) return '';

  if (!isConfigured) {
    // Fallback to local storage helper
    return saveBase64Image(base64String);
  }

  try {
    // Cloudinary uploader supports base64 data URIs directly
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folderName,
      resource_type: 'image'
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fallback to local storage in case of API failure
    return saveBase64Image(base64String);
  }
};

module.exports = {
  uploadFaceImage,
  isCloudinaryConfigured: !!isConfigured
};
