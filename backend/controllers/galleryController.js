const Gallery = require('../models/Gallery');
const { saveBase64Image } = require('../utils/imageHelper');

// @desc    Get all gallery media
// @route   GET /api/gallery
// @access  Public
const getGalleryItems = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get Gallery Items Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new gallery media item
// @route   POST /api/gallery
// @access  Private (Admin only)
const createGalleryItem = async (req, res) => {
  const { title, description, mediaType, category, mediaUrl } = req.body;

  if (!title || !mediaUrl) {
    return res.status(400).json({ success: false, message: 'Title and media URL are required' });
  }

  try {
    let savedMediaUrl = mediaUrl;
    if (mediaUrl.startsWith('data:image')) {
      savedMediaUrl = saveBase64Image(mediaUrl);
    }

    const item = await Gallery.create({
      title,
      description: description || '',
      mediaType: mediaType || 'image',
      category: category || 'Events',
      mediaUrl: savedMediaUrl
    });

    res.status(201).json({ success: true, message: 'Gallery item uploaded successfully', data: item });
  } catch (error) {
    console.error('Create Gallery Item Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    await Gallery.findByIdAndDelete(item._id);
    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete Gallery Item Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getGalleryItems,
  createGalleryItem,
  deleteGalleryItem
};
