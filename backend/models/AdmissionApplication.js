const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Please add student name'],
      trim: true
    },
    fatherName: {
      type: String,
      required: [true, 'Please add father name'],
      trim: true
    },
    motherName: {
      type: String,
      required: [true, 'Please add mother name'],
      trim: true
    },
    classApplied: {
      type: String,
      required: [true, 'Please add the target class'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please add contact phone number'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add contact email'],
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    address: {
      type: String,
      required: [true, 'Please add mailing address'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
