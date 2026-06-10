const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject name']
    },
    startTime: {
      type: String,
      required: [true, 'Please add start time (e.g. 09:00)']
    },
    endTime: {
      type: String,
      required: [true, 'Please add end time (e.g. 10:00)']
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Timetable', timetableSchema);
