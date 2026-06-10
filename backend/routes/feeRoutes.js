const express = require('express');
const router = express.Router();
const {
  createFeeRecord,
  getFees,
  getFeeById,
  payFee,
  deleteFeeRecord
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin'), createFeeRecord)
  .get(protect, getFees);

router.route('/:id')
  .get(protect, getFeeById)
  .delete(protect, authorize('admin'), deleteFeeRecord);

router.put('/:id/pay', protect, authorize('admin'), payFee);

module.exports = router;
