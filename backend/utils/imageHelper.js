const fs = require('fs');
const path = require('path');

/**
 * Parses a base64 image data-URI, saves it to the static uploads folder,
 * and returns the relative path to be stored in the database.
 * @param {string} base64String - The base64 image data-URI (e.g. data:image/jpeg;base64,...)
 * @returns {string} The relative file path (e.g. /uploads/profile-xxx.jpg) or the original string if not base64
 */
const saveBase64Image = (base64String) => {
  if (!base64String || !base64String.startsWith('data:')) {
    return base64String; // Return as-is if it's already a URL/path or empty
  }

  try {
    const commaIndex = base64String.indexOf(',');
    if (commaIndex === -1) {
      return base64String;
    }

    const meta = base64String.substring(0, commaIndex);
    const base64Data = base64String.substring(commaIndex + 1);
    
    const mimeMatch = meta.match(/^data:([A-Za-z-+\/]+);base64$/);
    if (!mimeMatch) {
      return base64String;
    }

    const mimeType = mimeMatch[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Get file extension
    let extension = 'png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      extension = 'jpg';
    } else if (mimeType === 'image/gif') {
      extension = 'gif';
    }

    const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    return base64String;
  }
};

module.exports = { saveBase64Image };
