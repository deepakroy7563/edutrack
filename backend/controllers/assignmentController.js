const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const { saveBase64Image } = require('../utils/imageHelper'); // We can use image helper or custom file helper to save base64 files.

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher/Admin)
const createAssignment = async (req, res) => {
  const { title, description, classId, subjectId, deadline, attachment } = req.body;

  if (!title || !description || !classId || !subjectId || !deadline) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    let savedAttachment = '';
    if (attachment) {
      // In base64 format
      savedAttachment = saveBase64Image(attachment); // saves to uploads and returns filepath
    }

    const assignment = await Assignment.create({
      title,
      description,
      classId,
      subjectId,
      deadline: new Date(deadline),
      attachment: savedAttachment
    });

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get assignments with optional filtering by classId
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res) => {
  const { classId } = req.query;
  const filter = {};

  if (classId) filter.classId = classId;

  try {
    const assignments = await Assignment.find(filter)
      .populate('classId')
      .populate('submissions.studentId')
      .sort({ deadline: 1 });

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Submit student homework assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  const { attachment, textSubmission } = req.body;

  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if student already submitted
    const alreadySubmitted = assignment.submissions.find(
      (sub) => sub.studentId.toString() === student._id.toString()
    );

    let fileUrl = '';
    if (attachment) {
      fileUrl = saveBase64Image(attachment);
    }

    const newSubmission = {
      studentId: student._id,
      submittedAt: new Date(),
      attachment: fileUrl,
      textSubmission: textSubmission || '',
      status: 'Submitted'
    };

    if (alreadySubmitted) {
      // Update submission
      alreadySubmitted.submittedAt = new Date();
      if (fileUrl) alreadySubmitted.attachment = fileUrl;
      if (textSubmission !== undefined) alreadySubmitted.textSubmission = textSubmission;
      alreadySubmitted.status = 'Submitted';
    } else {
      // Add submission
      assignment.submissions.push(newSubmission);
    }

    await assignment.save();

    res.json({ success: true, message: 'Assignment submitted successfully', data: assignment });
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Grade student submission
// @route   PUT /api/assignments/:id/grade
// @access  Private (Teacher/Admin)
const gradeSubmission = async (req, res) => {
  const { studentId, marks, grade } = req.body;

  if (!studentId || marks === undefined || !grade) {
    return res.status(400).json({ success: false, message: 'Student ID, marks, and grade are required' });
  }

  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === studentId.toString()
    );

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found for this student' });
    }

    submission.marks = Number(marks);
    submission.grade = grade;
    submission.status = 'Graded';

    await assignment.save();

    res.json({ success: true, message: 'Submission graded successfully', data: assignment });
  } catch (error) {
    console.error('Grade Submission Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher/Admin)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(assignment._id);

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  submitAssignment,
  gradeSubmission,
  deleteAssignment
};
