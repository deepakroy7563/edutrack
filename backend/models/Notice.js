const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a notice title']
    },
    content: {
      type: String,
      required: [true, 'Please add notice content']
    },
    audience: {
      type: String,
      enum: ['All', 'Teachers', 'Students', 'Parents'],
      default: 'All',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notice', noticeSchema);
