const express = require('express');
const router = express.Router();
const { getSchoolDetails, updateSchoolDetails } = require('../controllers/schoolController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSchoolDetails)
  .put(protect, authorize('admin'), updateSchoolDetails);

module.exports = router;
