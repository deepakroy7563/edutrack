const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add email'],
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please add contact phone number'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Please add standard message details'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Unread', 'Replied'],
      default: 'Unread'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
