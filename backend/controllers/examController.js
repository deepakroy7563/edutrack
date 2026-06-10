const Marks = require('../models/Marks');
const Student = require('../models/Student');

// @desc    Add marks for students
// @route   POST /api/marks
// @access  Private (Teacher/Admin)
const addMarks = async (req, res) => {
  const { student, classId, examType, subject, marksObtained, totalMarks } = req.body;

  if (!student || !classId || !examType || !subject || marksObtained === undefined) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if marks for this student, class, examType, and subject already exist
    const marksExists = await Marks.findOne({ student, classId, examType, subject });
    if (marksExists) {
      return res.status(400).json({ success: false, message: `Marks for ${subject} (${examType}) already added for this student` });
    }

    const marks = await Marks.create({
      student,
      classId,
      examType,
      subject,
      marksObtained,
      totalMarks: totalMarks || 100,
      teacher: req.user._id
    });

    const populatedMarks = await Marks.findById(marks._id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' }
      })
      .populate('classId');

    res.status(201).json({ success: true, message: 'Marks added successfully', data: populatedMarks });
  } catch (error) {
    console.error('Add Marks Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get marks with filters
// @route   GET /api/marks
// @access  Private
const getMarks = async (req, res) => {
  const { studentId, classId, examType, subject } = req.query;
  const filter = {};

  try {
    if (studentId) filter.student = studentId;
    if (classId) filter.classId = classId;
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;

    const marksRecords = await Marks.find(filter)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name rollNumber' }
      })
      .populate('classId')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: marksRecords.length, data: marksRecords });
  } catch (error) {
    console.error('Get Marks Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single marks record
// @route   GET /api/marks/:id
// @access  Private
const getMarksById = async (req, res) => {
  try {
    const marks = await Marks.findById(req.params.id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' }
      })
      .populate('classId');

    if (!marks) {
      return res.status(404).json({ success: false, message: 'Marks record not found' });
    }

    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Get Marks By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update student marks
// @route   PUT /api/marks/:id
// @access  Private (Teacher/Admin)
const updateMarks = async (req, res) => {
  const { marksObtained, totalMarks, examType, subject } = req.body;

  try {
    let marks = await Marks.findById(req.params.id);
    if (!marks) {
      return res.status(404).json({ success: false, message: 'Marks record not found' });
    }

    if (marksObtained !== undefined) marks.marksObtained = marksObtained;
    if (totalMarks !== undefined) marks.totalMarks = totalMarks;
    if (examType) marks.examType = examType;
    if (subject) marks.subject = subject;

    // Save triggers the pre('save') hook to re-calculate grades
    await marks.save();

    const updatedMarks = await Marks.findById(marks._id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' }
      })
      .populate('classId');

    res.json({ success: true, message: 'Marks updated successfully', data: updatedMarks });
  } catch (error) {
    console.error('Update Marks Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Delete student marks
// @route   DELETE /api/marks/:id
// @access  Private (Teacher/Admin)
const deleteMarks = async (req, res) => {
  try {
    const marks = await Marks.findById(req.params.id);
    if (!marks) {
      return res.status(404).json({ success: false, message: 'Marks record not found' });
    }

    await Marks.findByIdAndDelete(marks._id);

    res.json({ success: true, message: 'Marks record deleted successfully' });
  } catch (error) {
    console.error('Delete Marks Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get report card for a single student (aggregated by examType)
// @route   GET /api/marks/student/:studentId
// @access  Private
const getStudentReportCard = async (req, res) => {
  const { studentId } = req.params;

  try {
    const records = await Marks.find({ student: studentId })
      .populate('classId')
      .populate('teacher', 'name');

    // Group by examType
    const reportCard = {};
    records.forEach(rec => {
      if (!reportCard[rec.examType]) {
        reportCard[rec.examType] = {
          examType: rec.examType,
          class: rec.classId ? `${rec.classId.className}-${rec.classId.section}` : 'N/A',
          subjects: [],
          gpaTotal: 0,
          marksObtainedTotal: 0,
          totalMarksSum: 0
        };
      }

      reportCard[rec.examType].subjects.push({
        subject: rec.subject,
        marksObtained: rec.marksObtained,
        totalMarks: rec.totalMarks,
        grade: rec.grade,
        teacher: rec.teacher ? rec.teacher.name : 'Unknown'
      });

      reportCard[rec.examType].marksObtainedTotal += rec.marksObtained;
      reportCard[rec.examType].totalMarksSum += rec.totalMarks;
    });

    // Compute average percentage and class level overall grade
    Object.keys(reportCard).forEach(exam => {
      const examData = reportCard[exam];
      if (examData.totalMarksSum > 0) {
        const percentage = (examData.marksObtainedTotal / examData.totalMarksSum) * 100;
        examData.percentage = percentage.toFixed(1);
        if (percentage >= 90) examData.overallGrade = 'A+';
        else if (percentage >= 80) examData.overallGrade = 'A';
        else if (percentage >= 70) examData.overallGrade = 'B';
        else if (percentage >= 60) examData.overallGrade = 'C';
        else if (percentage >= 50) examData.overallGrade = 'D';
        else examData.overallGrade = 'F';
      }
    });

    res.json({ success: true, data: Object.values(reportCard) });
  } catch (error) {
    console.error('Get Student Report Card Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addMarks,
  getMarks,
  getMarksById,
  updateMarks,
  deleteMarks,
  getStudentReportCard
};
