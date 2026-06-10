const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a media title'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    category: {
      type: String,
      default: 'Events', // e.g., 'Campus', 'Sports', 'Science Fest'
      trim: true
    },
    mediaUrl: {
      type: String, // Base64 content or static/external URL
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Gallery', gallerySchema);
