const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    checkInTime: {
      type: Date,
      required: true
    },
    checkOutTime: {
      type: Date
    },
    totalHours: {
      type: Number,
      default: 0
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

// Prevent duplicate teacher attendance records on the same day
teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
