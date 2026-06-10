const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    examType: {
      type: String,
      required: [true, 'Please specify exam type (e.g. Midterm, Final, Monthly Test)']
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject']
    },
    marksObtained: {
      type: Number,
      required: [true, 'Please specify marks obtained'],
      min: 0
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please specify total marks'],
      default: 100
    },
    grade: {
      type: String
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Calculate grade before saving
marksSchema.pre('save', function (next) {
  const percentage = (this.marksObtained / this.totalMarks) * 100;
  if (percentage >= 90) this.grade = 'A+';
  else if (percentage >= 80) this.grade = 'A';
  else if (percentage >= 70) this.grade = 'B';
  else if (percentage >= 60) this.grade = 'C';
  else if (percentage >= 50) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
