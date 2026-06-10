const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    class: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    checkInTime: {
      type: Date,
      default: Date.now
    },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true
    },
    faceConfidence: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      default: 'Unknown'
    },
    deviceIp: {
      type: String,
      default: '127.0.0.1'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate student attendance records on the same day
studentAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
