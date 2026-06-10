const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Please add fee amount'],
      min: 0
    },
    feeType: {
      type: String,
      required: [true, 'Please specify fee type (e.g. Tuition Fee, Exam Fee, Sports Fee)'],
      default: 'Tuition Fee'
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Please add a due date']
    },
    paymentDate: {
      type: Date
    },
    receiptNo: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null/undefined values if pending
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Fee', feeSchema);
