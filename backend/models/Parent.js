const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
    phone: {
      type: String
    },
    occupation: {
      type: String
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian'],
      default: 'Guardian'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Parent', parentSchema);
