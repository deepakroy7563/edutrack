const express = require('express');
const router = express.Router();
const {
  markBulkAttendance,
  markStudentFaceAttendance,
  markTeacherFaceAttendance,
  getAttendance,
  getAttendanceReports,
  getDashboardStats,
  getTeacherHistory,
  getStudentHistory,
  getAttendanceStats,
  markFaceAttendance // legacy
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all attendance (filtered)
router.route('/')
  .get(protect, getAttendance);

// Dashboard stats endpoint
router.get('/dashboard/stats', protect, getDashboardStats);

// Report printing endpoint
router.get('/reports', protect, authorize('admin', 'teacher'), getAttendanceReports);

// Individual logs
router.get('/teacher/history', protect, authorize('teacher', 'admin'), getTeacherHistory);
router.get('/student/history', protect, authorize('student'), getStudentHistory);

// Mark bulk attendance sheet
router.post('/bulk', protect, authorize('admin', 'teacher'), markBulkAttendance);

// Student/Teacher face attendance mark
router.post('/student/face', protect, markStudentFaceAttendance);
router.post('/teacher/face', protect, markTeacherFaceAttendance);

// Legacy compat mappings
router.get('/stats', protect, authorize('admin', 'teacher'), getAttendanceStats);
router.post('/face', protect, authorize('admin', 'teacher'), markFaceAttendance);

module.exports = router;
