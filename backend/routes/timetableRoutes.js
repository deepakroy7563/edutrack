const express = require('express');
const router = express.Router();
const {
  addTimetableSlot,
  getTimetable,
  updateTimetableSlot,
  deleteTimetableSlot
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin'), addTimetableSlot)
  .get(protect, getTimetable);

router.route('/:id')
  .put(protect, authorize('admin'), updateTimetableSlot)
  .delete(protect, authorize('admin'), deleteTimetableSlot);

module.exports = router;
