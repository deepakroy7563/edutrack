const express = require('express');
const router = express.Router();
const {
  addMarks,
  getMarks,
  getMarksById,
  updateMarks,
  deleteMarks,
  getStudentReportCard
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'teacher'), addMarks)
  .get(protect, getMarks);

router.route('/:id')
  .get(protect, getMarksById)
  .put(protect, authorize('admin', 'teacher'), updateMarks)
  .delete(protect, authorize('admin', 'teacher'), deleteMarks);

router.get('/student/:studentId', protect, getStudentReportCard);

module.exports = router;
