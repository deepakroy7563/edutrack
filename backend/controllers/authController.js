const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const { saveBase64Image } = require('../utils/imageHelper');

// Helper function to sign JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'edutrack_secret_key_for_jwt_auth_12345', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user and create their respective profile
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
  const { name, email, password, role, profileImage, ...profileData } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      profileImage: saveBase64Image(profileImage) || ''
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }

    // Create corresponding profile depending on role
    if (role === 'student') {
      const { rollNumber, classId, dateOfBirth, gender, phone, address, parentEmail, faceDescriptor } = profileData;

      if (!rollNumber || !classId) {
        // Delete user if profile creation fails due to missing fields
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Roll number and class ID are required for students' });
      }

      // Find parent if parent email is provided
      let parentUser = null;
      if (parentEmail) {
        parentUser = await User.findOne({ email: parentEmail, role: 'parent' });
      }

      const student = await Student.create({
        user: user._id,
        rollNumber,
        classId,
        parent: parentUser ? parentUser._id : null,
        dateOfBirth,
        gender,
        phone,
        address,
        faceDescriptor: faceDescriptor || undefined
      });

      // If parent exists, link student to parent
      if (parentUser) {
        await Parent.findOneAndUpdate(
          { user: parentUser._id },
          { $addToSet: { children: student._id } }
        );
      }
    } else if (role === 'teacher') {
      const { employeeId, phone, designation, department, subjects } = profileData;

      if (!employeeId) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Employee ID is required for teachers' });
      }

      await Teacher.create({
        user: user._id,
        employeeId,
        phone,
        designation,
        department,
        subjects: subjects || []
      });
    } else if (role === 'parent') {
      const { phone, occupation, relationship, childRollNumbers } = profileData;

      const parent = await Parent.create({
        user: user._id,
        phone,
        occupation,
        relationship
      });

      // If child roll numbers are provided, link them
      if (childRollNumbers && Array.isArray(childRollNumbers) && childRollNumbers.length > 0) {
        const students = await Student.find({ rollNumber: { $in: childRollNumbers } });
        if (students.length > 0) {
          parent.children = students.map(s => s._id);
          await parent.save();

          // Also set the parent reference on the student models
          await Student.updateMany(
            { _id: { $in: parent.children } },
            { $set: { parent: user._id } }
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    // Cleanup created user in case of unhandled schema errors
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate value error: Roll number or Employee ID already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Fetch specific profile info based on role
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ user: user._id }).populate('classId');
      } else if (user.role === 'teacher') {
        profile = await Teacher.findOne({ user: user._id }).populate('assignedClasses');
      } else if (user.role === 'parent') {
        profile = await Parent.findOne({ user: user._id }).populate({
          path: 'children',
          populate: { path: 'user classId' }
        });
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          profile: profile
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user profile details
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ user: user._id }).populate('classId');
      } else if (user.role === 'teacher') {
        profile = await Teacher.findOne({ user: user._id }).populate('assignedClasses');
      } else if (user.role === 'parent') {
        profile = await Parent.findOne({ user: user._id }).populate({
          path: 'children',
          populate: { path: 'user classId' }
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          profile: profile
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.password) {
        user.password = req.body.password;
      }
      if (req.body.profileImage !== undefined) {
        user.profileImage = saveBase64Image(req.body.profileImage);
      }

      await user.save();

      // Update specific details based on role
      if (user.role === 'student') {
        const student = await Student.findOne({ user: user._id });
        if (student) {
          student.phone = req.body.phone || student.phone;
          student.address = req.body.address || student.address;
          if (req.body.faceDescriptor) {
            student.faceDescriptor = req.body.faceDescriptor;
            student.markModified('faceDescriptor');
          }
          await student.save();
        }
      } else if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (teacher) {
          teacher.phone = req.body.phone || teacher.phone;
          await teacher.save();
        }
      } else if (user.role === 'parent') {
        const parent = await Parent.findOne({ user: user._id });
        if (parent) {
          parent.phone = req.body.phone || parent.phone;
          parent.occupation = req.body.occupation || parent.occupation;
          await parent.save();
        }
      }

      // Fetch updated profile
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ user: user._id }).populate('classId');
      } else if (user.role === 'teacher') {
        profile = await Teacher.findOne({ user: user._id }).populate('assignedClasses');
      } else if (user.role === 'parent') {
        profile = await Parent.findOne({ user: user._id }).populate({
          path: 'children',
          populate: { path: 'user classId' }
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          profile: profile
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
