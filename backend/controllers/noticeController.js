const Notice = require('../models/Notice');

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Admin/Teacher)
const createNotice = async (req, res) => {
  const { title, content, audience } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  try {
    const notice = await Notice.create({
      title,
      content,
      audience: audience || 'All',
      author: req.user._id
    });

    const populatedNotice = await Notice.findById(notice._id).populate('author', 'name role');

    res.status(201).json({ success: true, message: 'Notice created successfully', data: populatedNotice });
  } catch (error) {
    console.error('Create Notice Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get notices based on user role (targeted audience)
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res) => {
  try {
    const filter = {};

    // Standard users can only view notices directed at their role or "All"
    if (req.user && req.user.role !== 'admin') {
      const userRole = req.user.role;
      let audienceVal = 'All';

      if (userRole === 'teacher') audienceVal = 'Teachers';
      else if (userRole === 'student') audienceVal = 'Students';
      else if (userRole === 'parent') audienceVal = 'Parents';

      filter.audience = { $in: ['All', audienceVal] };
    }

    const notices = await Notice.find(filter)
      .populate('author', 'name role')
      .sort({ date: -1 }); // Newest first

    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    console.error('Get Notices Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Private
const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('author', 'name role');

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({ success: true, data: notice });
  } catch (error) {
    console.error('Get Notice By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update notice details
// @route   PUT /api/notices/:id
// @access  Private (Admin/Teacher)
const updateNotice = async (req, res) => {
  const { title, content, audience } = req.body;

  try {
    let notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Check if user is author or admin
    if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this notice' });
    }

    notice.title = title || notice.title;
    notice.content = content || notice.content;
    notice.audience = audience || notice.audience;

    await notice.save();

    const updatedNotice = await Notice.findById(notice._id).populate('author', 'name role');

    res.json({ success: true, message: 'Notice updated successfully', data: updatedNotice });
  } catch (error) {
    console.error('Update Notice Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin/Teacher)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Check if user is author or admin
    if (notice.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notice' });
    }

    await Notice.findByIdAndDelete(notice._id);

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete Notice Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
};
