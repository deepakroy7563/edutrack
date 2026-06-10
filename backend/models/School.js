const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a school name'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Please add a school address']
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    principal: {
      type: String,
      trim: true
    },
    established: {
      type: String,
      trim: true
    },
    description: {
      type: String
    },
    logo: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('School', schoolSchema);
