const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent');
const { saveBase64Image } = require('../utils/imageHelper');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin/Teacher)
const getStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) {
      filter.classId = req.query.classId;
    }

    const students = await Student.find(filter)
      .populate('user', '-password')
      .populate('classId')
      .populate('parent', 'name email');

    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single student details
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', '-password')
      .populate('classId')
      .populate({
        path: 'parent',
        select: 'name email',
        populate: { path: 'user', select: 'name email' } // In case parent references user
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get Student By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin/Teacher)
const updateStudent = async (req, res) => {
  const { name, email, rollNumber, classId, dateOfBirth, gender, phone, address, faceDescriptor, profileImage } = req.body;

  try {
    let student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Update nested User info
    const user = await User.findById(student.user);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (profileImage !== undefined) {
        user.profileImage = saveBase64Image(profileImage);
      }
      await user.save();
    }

    // Update student info
    student.rollNumber = rollNumber || student.rollNumber;
    student.classId = classId || student.classId;
    student.dateOfBirth = dateOfBirth || student.dateOfBirth;
    student.gender = gender || student.gender;
    student.phone = phone || student.phone;
    student.address = address || student.address;
    if (faceDescriptor !== undefined) {
      student.faceDescriptor = faceDescriptor;
      student.markModified('faceDescriptor');
    }

    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate('user', '-password')
      .populate('classId');

    res.json({ success: true, message: 'Student updated successfully', data: updatedStudent });
  } catch (error) {
    console.error('Update Student Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Roll number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete student & user
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Remove Student reference in Parent children list
    if (student.parent) {
      await Parent.findOneAndUpdate(
        { user: student.parent },
        { $pull: { children: student._id } }
      );
    }

    // Delete associated User
    await User.findByIdAndDelete(student.user);

    // Delete Student
    await Student.findByIdAndDelete(student._id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
