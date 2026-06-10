const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  attachment: {
    type: String, // Base64 or local filepath
    default: ''
  },
  textSubmission: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    default: null
  },
  grade: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Submitted', 'Graded'],
    default: 'Submitted'
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an assignment title']
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    subjectId: {
      type: String, // String representation or could be ref
      required: true
    },
    deadline: {
      type: Date,
      required: true
    },
    attachment: {
      type: String, // Base64 or local file path
      default: ''
    },
    submissions: [submissionSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
