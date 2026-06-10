const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Please add a roll number'],
      unique: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the Parent user
      default: null
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    phone: {
      type: String
    },
    address: {
      type: String
    },
    faceDescriptor: {
      type: [Number], // Storing the 128 floats vector from face-api.js
      default: undefined // Ensure it is undefined when not registered rather than empty array
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
