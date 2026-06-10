const Fee = require('../models/Fee');
const Student = require('../models/Student');

// @desc    Create a new fee invoice for a student
// @route   POST /api/fees
// @access  Private (Admin)
const createFeeRecord = async (req, res) => {
  const { student, amount, feeType, dueDate } = req.body;

  if (!student || !amount || !dueDate) {
    return res.status(400).json({ success: false, message: 'Student ID, amount, and due date are required' });
  }

  try {
    const fee = await Fee.create({
      student,
      amount,
      feeType: feeType || 'Tuition Fee',
      dueDate,
      status: 'Pending'
    });

    const populatedFee = await Fee.findById(fee._id)
      .populate({
        path: 'student',
        populate: { path: 'user classId', select: 'name className section' }
      });

    res.status(201).json({ success: true, message: 'Fee record created successfully', data: populatedFee });
  } catch (error) {
    console.error('Create Fee Record Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get fee records (with filters)
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res) => {
  const { studentId, status } = req.query;
  const filter = {};

  try {
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;

    const fees = await Fee.find(filter)
      .populate({
        path: 'student',
        populate: {
          path: 'user classId',
          select: 'name rollNumber className section'
        }
      })
      .sort({ dueDate: -1 });

    res.json({ success: true, count: fees.length, data: fees });
  } catch (error) {
    console.error('Get Fees Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single fee record details
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        populate: {
          path: 'user classId',
          select: 'name rollNumber className section'
        }
      });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('Get Fee By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Process/mark a fee as Paid
// @route   PUT /api/fees/:id/pay
// @access  Private (Admin)
const payFee = async (req, res) => {
  try {
    let fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    if (fee.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Fee has already been paid' });
    }

    // Generate a unique receipt number
    const uniqueReceiptNo = 'REC-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

    fee.status = 'Paid';
    fee.paymentDate = new Date();
    fee.receiptNo = uniqueReceiptNo;

    await fee.save();

    const updatedFee = await Fee.findById(fee._id)
      .populate({
        path: 'student',
        populate: {
          path: 'user classId',
          select: 'name rollNumber className section'
        }
      });

    res.json({ success: true, message: 'Payment recorded successfully', data: updatedFee });
  } catch (error) {
    console.error('Pay Fee Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private (Admin)
const deleteFeeRecord = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    await Fee.findByIdAndDelete(fee._id);

    res.json({ success: true, message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Delete Fee Record Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createFeeRecord,
  getFees,
  getFeeById,
  payFee,
  deleteFeeRecord
};
