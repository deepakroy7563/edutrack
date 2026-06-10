const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin)
const createClass = async (req, res) => {
  const { className, section, classTeacher, subjects } = req.body;

  try {
    // Check if class with same name and section exists
    const classExists = await Class.findOne({ className, section });
    if (classExists) {
      return res.status(400).json({ success: false, message: 'Class and section combination already exists' });
    }

    const newClass = await Class.create({
      className,
      section,
      classTeacher: classTeacher || null,
      subjects: subjects || []
    });

    // If classTeacher is assigned, add this class to teacher's assignedClasses
    if (classTeacher) {
      await Teacher.findByIdAndUpdate(classTeacher, {
        $addToSet: { assignedClasses: newClass._id }
      });
    }

    // For any subject teachers, add this class to their assignedClasses
    if (subjects && Array.isArray(subjects)) {
      for (const sub of subjects) {
        if (sub.teacher) {
          await Teacher.findByIdAndUpdate(sub.teacher, {
            $addToSet: { assignedClasses: newClass._id }
          });
        }
      }
    }

    const createdClass = await Class.findById(newClass._id)
      .populate({
        path: 'classTeacher',
        populate: { path: 'user', select: 'name' }
      })
      .populate({
        path: 'subjects.teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.status(201).json({ success: true, message: 'Class created successfully', data: createdClass });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin/Teacher/Student/Parent)
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate({
        path: 'classTeacher',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'subjects.teacher',
        populate: { path: 'user', select: 'name email' }
      });

    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    console.error('Get Classes Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single class details
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate({
        path: 'classTeacher',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'subjects.teacher',
        populate: { path: 'user', select: 'name email' }
      });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.json({ success: true, data: classItem });
  } catch (error) {
    console.error('Get Class By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update class details
// @route   PUT /api/classes/:id
// @access  Private (Admin)
const updateClass = async (req, res) => {
  const { className, section, classTeacher, subjects } = req.body;

  try {
    let classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const oldClassTeacher = classItem.classTeacher;

    // Update fields
    classItem.className = className || classItem.className;
    classItem.section = section || classItem.section;
    if (classTeacher !== undefined) classItem.classTeacher = classTeacher;
    if (subjects !== undefined) classItem.subjects = subjects;

    await classItem.save();

    // Adjust teacher's assignedClasses
    if (classTeacher !== undefined && oldClassTeacher && oldClassTeacher.toString() !== classTeacher) {
      // Remove class from old teacher
      await Teacher.findByIdAndUpdate(oldClassTeacher, {
        $pull: { assignedClasses: classItem._id }
      });
    }

    if (classTeacher) {
      // Add class to new teacher
      await Teacher.findByIdAndUpdate(classTeacher, {
        $addToSet: { assignedClasses: classItem._id }
      });
    }

    // Refresh teachers for new/updated subjects
    if (subjects && Array.isArray(subjects)) {
      for (const sub of subjects) {
        if (sub.teacher) {
          await Teacher.findByIdAndUpdate(sub.teacher, {
            $addToSet: { assignedClasses: classItem._id }
          });
        }
      }
    }

    const updatedClass = await Class.findById(classItem._id)
      .populate({
        path: 'classTeacher',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'subjects.teacher',
        populate: { path: 'user', select: 'name email' }
      });

    res.json({ success: true, message: 'Class updated successfully', data: updatedClass });
  } catch (error) {
    console.error('Update Class Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Remove references to this class from any teachers
    await Teacher.updateMany(
      { assignedClasses: classItem._id },
      { $pull: { assignedClasses: classItem._id } }
    );

    await Class.findByIdAndDelete(classItem._id);

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete Class Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass
};
