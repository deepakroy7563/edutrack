const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route
router.post('/login', loginUser);

// Protected routes (admin only can register new users)
router.post('/register', protect, authorize('admin'), registerUser);

// User profile routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
