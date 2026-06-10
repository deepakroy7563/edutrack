const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const { saveBase64Image } = require('../utils/imageHelper');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', '-password')
      .populate('assignedClasses');

    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single teacher details
// @route   GET /api/teachers/:id
// @access  Private
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', '-password')
      .populate('assignedClasses');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error('Get Teacher By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update teacher details
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
const updateTeacher = async (req, res) => {
  const { name, email, employeeId, phone, designation, department, subjects, assignedClasses, profileImage, faceDescriptor } = req.body;

  try {
    let teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Update nested User info
    const user = await User.findById(teacher.user);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (profileImage !== undefined) {
        user.profileImage = saveBase64Image(profileImage);
      }
      await user.save();
    }

    // Update teacher info
    teacher.employeeId = employeeId || teacher.employeeId;
    teacher.phone = phone || teacher.phone;
    teacher.designation = designation || teacher.designation;
    teacher.department = department || teacher.department;
    if (subjects) teacher.subjects = subjects;
    if (assignedClasses) teacher.assignedClasses = assignedClasses;
    if (faceDescriptor !== undefined) {
      teacher.faceDescriptor = faceDescriptor;
      teacher.markModified('faceDescriptor');
    }

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', '-password')
      .populate('assignedClasses');

    res.json({ success: true, message: 'Teacher updated successfully', data: updatedTeacher });
  } catch (error) {
    console.error('Update Teacher Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete teacher & user
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Remove Teacher references in Classes
    await Class.updateMany(
      { classTeacher: teacher._id },
      { $set: { classTeacher: null } }
    );
    await Class.updateMany(
      { 'subjects.teacher': teacher._id },
      { $set: { 'subjects.$.teacher': null } }
    );

    // Delete associated User
    await User.findByIdAndDelete(teacher.user);

    // Delete Teacher
    await Teacher.findByIdAndDelete(teacher._id);

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete Teacher Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher
};
