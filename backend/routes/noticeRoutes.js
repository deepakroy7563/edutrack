const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'teacher'), createNotice)
  .get(protect, getNotices);

router.route('/:id')
  .get(protect, getNoticeById)
  .put(protect, authorize('admin', 'teacher'), updateNotice)
  .delete(protect, authorize('admin', 'teacher'), deleteNotice);

module.exports = router;
