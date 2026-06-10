const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: [true, 'Please add a section name']
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Section', sectionSchema);
