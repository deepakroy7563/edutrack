const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeId: {
      type: String,
      required: [true, 'Please add an employee ID'],
      unique: true
    },
    phone: {
      type: String
    },
    designation: {
      type: String
    },
    department: {
      type: String
    },
    subjects: {
      type: [String],
      default: []
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      }
    ],
    faceDescriptor: {
      type: [Number],
      default: undefined
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
