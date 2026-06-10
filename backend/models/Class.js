const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, 'Please add a class name']
    },
    section: {
      type: String,
      required: [true, 'Please add a section']
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null
    },
    subjects: [
      {
        name: { type: String, required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of class name and section combination
classSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
