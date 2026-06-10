const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const User = require('../models/User');
const StudentAttendance = require('../models/StudentAttendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const { sendAttendanceConfirmation, sendParentAbsenceAlert, sendLateArrivalAlert } = require('../utils/emailService');

// Configurable school start time (default: 08:30 AM)
const SCHOOL_START_HOUR = 8;
const SCHOOL_START_MINUTE = 30;

/**
 * Helper: check if a time is after school start time (08:30 AM)
 * @param {Date} dateObj
 * @returns {boolean} True if late
 */
const checkIfLate = (dateObj) => {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  if (hours > SCHOOL_START_HOUR) return true;
  if (hours === SCHOOL_START_HOUR && minutes > SCHOOL_START_MINUTE) return true;
  return false;
};

// @desc    Mark bulk attendance (Manual attendance sheet)
// @route   POST /api/attendance/bulk
// @access  Private (Teacher/Admin)
const markBulkAttendance = async (req, res) => {
  const { classId, date, records } = req.body; // records is an array of { studentId, status }

  if (!classId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Class ID, date, and records array are required' });
  }

  try {
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(0, 0, 0, 0); // Normalize date to midnight UTC

    const savedRecords = [];

    for (const record of records) {
      const { studentId, status } = record;

      // 1. Update legacy Attendance model (for backward compatibility)
      await Attendance.findOneAndUpdate(
        { student: studentId, date: formattedDate },
        {
          student: studentId,
          classId: classId,
          date: formattedDate,
          status: status || 'Present',
          markedBy: req.user._id,
          faceVerified: false
        },
        { new: true, upsert: true }
      );

      // 2. Fetch student details for StudentAttendance model
      const student = await Student.findById(studentId).populate('user');
      const classObj = await Class.findById(classId);
      if (student && classObj) {
        const checkInTime = new Date();
        const stdAtt = await StudentAttendance.findOneAndUpdate(
          { studentId, date: formattedDate },
          {
            studentId,
            name: student.user.name,
            class: classObj.className,
            section: classObj.section,
            date: formattedDate,
            checkInTime: status === 'Absent' ? null : checkInTime,
            attendanceStatus: status || 'Present',
            faceConfidence: 1.0, // Manual overrides have full confidence
            location: 'Classroom (Manual)',
            deviceIp: req.ip || '127.0.0.1'
          },
          { new: true, upsert: true }
        );
        savedRecords.push(stdAtt);

        // Send parent notification if student is marked Absent
        if (status === 'Absent' && student.parent) {
          const parentUser = await User.findById(student.parent);
          if (parentUser && parentUser.email) {
            await sendParentAbsenceAlert(parentUser.email, parentUser.name, student.user.name, formattedDate);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: savedRecords
    });
  } catch (error) {
    console.error('Mark Bulk Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Mark attendance for a single student via face recognition
// @route   POST /api/attendance/student/face
// @access  Private (Teacher/Admin/Student)
const markStudentFaceAttendance = async (req, res) => {
  const { studentId, classId, faceConfidence, location } = req.body;
  const deviceIp = req.ip || '127.0.0.1';

  if (!studentId || !classId) {
    return res.status(400).json({ success: false, message: 'Student ID and Class ID are required' });
  }

  try {
    const today = new Date();
    const formattedDate = new Date();
    formattedDate.setUTCHours(0, 0, 0, 0); // Midnight UTC for unique indexing

    // Confirm student exists
    const student = await Student.findById(studentId).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    // Check for duplicate attendance today
    const existingAttendance = await StudentAttendance.findOne({ studentId, date: formattedDate });
    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance has already been logged for this student today.', 
        data: existingAttendance 
      });
    }

    // Calculate Status based on time
    const isLate = checkIfLate(today);
    const status = isLate ? 'Late' : 'Present';

    // Create student attendance record
    const stdAtt = await StudentAttendance.create({
      studentId,
      name: student.user.name,
      class: classObj.className,
      section: classObj.section,
      date: formattedDate,
      checkInTime: today,
      attendanceStatus: status,
      faceConfidence: faceConfidence || 0.9,
      location: location || 'Webcam Scanner',
      deviceIp
    });

    // Mirror to legacy Attendance model for backwards-compatibility
    await Attendance.create({
      student: studentId,
      classId: classId,
      date: formattedDate,
      status: status,
      markedBy: req.user?._id || student.user._id,
      faceVerified: true
    });

    // Send notifications asynchronously
    if (student.user.email) {
      await sendAttendanceConfirmation(student.user.email, student.user.name, today, status);
    }
    if (isLate && student.user.email) {
      await sendLateArrivalAlert(student.user.email, student.user.name, today);
    }

    res.status(201).json({
      success: true,
      message: `${student.user.name} checked in successfully (${status}) via Face Verification.`,
      data: stdAtt
    });
  } catch (error) {
    console.error('Mark Student Face Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Mark Check-In / Check-Out for Teachers via Face Recognition
// @route   POST /api/attendance/teacher/face
// @access  Private (Admin/Teacher)
const markTeacherFaceAttendance = async (req, res) => {
  const { teacherId, faceConfidence, location } = req.body;
  const deviceIp = req.ip || '127.0.0.1';

  if (!teacherId) {
    return res.status(400).json({ success: false, message: 'Teacher ID is required' });
  }

  try {
    const today = new Date();
    const formattedDate = new Date();
    formattedDate.setUTCHours(0, 0, 0, 0); // Midnight UTC

    const teacher = await Teacher.findById(teacherId).populate('user');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Find attendance record for today
    let teacherAtt = await TeacherAttendance.findOne({ teacherId, date: formattedDate });

    if (!teacherAtt) {
      // 1. Process Check-In
      const isLate = checkIfLate(today);
      const status = isLate ? 'Late' : 'Present';

      teacherAtt = await TeacherAttendance.create({
        teacherId,
        name: teacher.user.name,
        department: teacher.department || 'Faculty',
        date: formattedDate,
        checkInTime: today,
        attendanceStatus: status,
        faceConfidence: faceConfidence || 0.9,
        location: location || 'Staff Main Gate',
        deviceIp
      });

      // Notify teacher
      if (teacher.user.email) {
        await sendAttendanceConfirmation(teacher.user.email, teacher.user.name, today, status);
      }

      return res.status(201).json({
        success: true,
        type: 'check-in',
        message: `Welcome, ${teacher.user.name}. Check-In marked at ${today.toLocaleTimeString()}.`,
        data: teacherAtt
      });
    } else {
      // 2. Process Check-Out
      if (teacherAtt.checkOutTime) {
        return res.status(400).json({
          success: false,
          message: 'Check-Out already registered for today.',
          data: teacherAtt
        });
      }

      teacherAtt.checkOutTime = today;
      // Calculate total working hours
      const diffMs = today - teacherAtt.checkInTime;
      const hours = diffMs / (1000 * 60 * 60);
      teacherAtt.totalHours = parseFloat(hours.toFixed(2));
      await teacherAtt.save();

      // Send email alert for checkout
      if (teacher.user.email) {
        await sendAttendanceConfirmation(teacher.user.email, teacher.user.name, today, `Checked Out (Hrs: ${teacherAtt.totalHours})`);
      }

      return res.status(200).json({
        success: true,
        type: 'check-out',
        message: `Goodbye, ${teacher.user.name}. Check-Out marked at ${today.toLocaleTimeString()}. Total working hours: ${teacherAtt.totalHours} hrs.`,
        data: teacherAtt
      });
    }
  } catch (error) {
    console.error('Mark Teacher Face Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get attendance records with filter parameters (Legacy fallback support)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  const { classId, studentId, startDate, endDate, date } = req.query;
  const filter = {};

  try {
    if (classId) {
      filter.classId = classId;
    }
    if (studentId) {
      filter.student = studentId;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setUTCHours(0, 0, 0, 0);
      filter.date = targetDate;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name rollNumber profileImage' }
      })
      .populate('classId')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get detailed attendance reports (Daily, Weekly, Monthly, Yearly)
// @route   GET /api/attendance/reports
// @access  Private (Admin/Teacher)
const getAttendanceReports = async (req, res) => {
  const { type, classId, dateRange, startDate, endDate, status } = req.query;
  // type: student | teacher
  // dateRange: daily | weekly | monthly | yearly | custom

  const queryFilter = {};

  try {
    let start = new Date();
    let end = new Date();

    if (dateRange === 'daily') {
      const target = startDate ? new Date(startDate) : new Date();
      target.setUTCHours(0, 0, 0, 0);
      start = target;
      end = new Date(target);
      end.setUTCHours(23, 59, 59, 999);
    } else if (dateRange === 'weekly') {
      const target = startDate ? new Date(startDate) : new Date();
      // Calculate 7 days back
      start = new Date(target);
      start.setDate(start.getDate() - 7);
      start.setUTCHours(0, 0, 0, 0);
      end = new Date(target);
      end.setUTCHours(23, 59, 59, 999);
    } else if (dateRange === 'monthly') {
      const target = startDate ? new Date(startDate) : new Date();
      start = new Date(target.getFullYear(), target.getMonth(), 1);
      end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'yearly') {
      const target = startDate ? new Date(startDate) : new Date();
      start = new Date(target.getFullYear(), 0, 1);
      end = new Date(target.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (startDate || endDate) {
      if (startDate) {
        start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
      } else {
        start.setDate(start.getDate() - 30);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
      }
    }

    queryFilter.date = { $gte: start, $lte: end };

    if (status) {
      queryFilter.attendanceStatus = status;
    }

    let records = [];

    if (type === 'teacher') {
      records = await TeacherAttendance.find(queryFilter)
        .populate({
          path: 'teacherId',
          populate: { path: 'user', select: 'name email profileImage' }
        })
        .sort({ date: -1 });
    } else {
      // Students
      if (classId) {
        const classObj = await Class.findById(classId);
        if (classObj) {
          queryFilter.class = classObj.className;
          queryFilter.section = classObj.section;
        }
      }

      records = await StudentAttendance.find(queryFilter)
        .populate({
          path: 'studentId',
          populate: { path: 'user', select: 'name email profileImage' }
        })
        .sort({ date: -1 });
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Get Attendance Reports Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get dashboard statistics for Admin, Teacher, and Student
// @route   GET /api/attendance/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  const role = req.user.role;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  try {
    if (role === 'admin' || role === 'teacher') {
      // 1. Admin / Teacher Metrics
      const totalStudents = await Student.countDocuments();
      const totalTeachers = await Teacher.countDocuments();

      // Today student attendance aggregates
      const presentCount = await StudentAttendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        attendanceStatus: 'Present'
      });
      const lateCount = await StudentAttendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        attendanceStatus: 'Late'
      });
      const markedCount = await StudentAttendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd }
      });

      // Anyone without a check-in record is absent
      const absentCount = totalStudents - markedCount > 0 ? totalStudents - markedCount : 0;

      // Teacher checkins today
      const teacherCheckins = await TeacherAttendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd }
      });

      // Attendance percentage today
      const totalRecords = markedCount + absentCount;
      const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

      // Aggregates for the last 7 days (charts)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setUTCHours(0, 0, 0, 0);

      const studentStats = await StudentAttendance.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            present: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "Present"] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "Late"] }, 1, 0] } },
            totalMarked: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const dailyStats = studentStats.map(stat => {
        const absent = totalStudents - stat.totalMarked > 0 ? totalStudents - stat.totalMarked : 0;
        const rate = (stat.present + stat.late) / (stat.totalMarked + absent) * 100;
        return {
          date: stat._id,
          present: stat.present,
          late: stat.late,
          absent,
          attendanceRate: parseFloat(rate.toFixed(1))
        };
      });

      return res.json({
        success: true,
        stats: {
          totalStudents,
          totalTeachers,
          presentCount,
          absentCount,
          lateCount,
          teacherCheckins,
          attendanceRate: parseFloat(attendanceRate.toFixed(1))
        },
        dailyStats
      });
    } else if (role === 'student') {
      // 2. Student Dashboard Stats
      const student = await Student.findOne({ user: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const history = await StudentAttendance.find({ studentId: student._id }).sort({ date: -1 });

      const total = history.length;
      const present = history.filter(h => h.attendanceStatus === 'Present').length;
      const late = history.filter(h => h.attendanceStatus === 'Late').length;
      const rate = total > 0 ? ((present + late) / total) * 100 : 100;

      return res.json({
        success: true,
        stats: {
          attendanceRate: parseFloat(rate.toFixed(1)),
          totalDays: total,
          presentDays: present,
          lateDays: late,
          absentDays: total - (present + late)
        },
        history
      });
    } else {
      return res.status(400).json({ success: false, message: 'Dashboard stats not available for this role' });
    }
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get personal attendance history for logged-in Teacher
// @route   GET /api/attendance/teacher/history
// @access  Private (Teacher)
const getTeacherHistory = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const history = await TeacherAttendance.find({ teacherId: teacher._id }).sort({ date: -1 });
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get Teacher History Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get personal attendance history for logged-in Student
// @route   GET /api/attendance/student/history
// @access  Private (Student)
const getStudentHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const history = await StudentAttendance.find({ studentId: student._id }).sort({ date: -1 });
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get Student History Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get attendance stats (Legacy compatibility fallback)
// @route   GET /api/attendance/stats
// @access  Private
const getAttendanceStats = async (req, res) => {
  try {
    const totalRecords = await StudentAttendance.countDocuments();
    const presentCount = await StudentAttendance.countDocuments({ attendanceStatus: 'Present' });
    const absentCount = await StudentAttendance.countDocuments({ attendanceStatus: 'Absent' });
    const lateCount = await StudentAttendance.countDocuments({ attendanceStatus: 'Late' });

    const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const dailyStats = await StudentAttendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "Present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "Absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "Late"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: attendanceRate.toFixed(1)
      },
      dailyStats
    });
  } catch (error) {
    console.error('Legacy Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark face attendance (Legacy compatible endpoint)
// @route   POST /api/attendance/face
// @access  Private
const markFaceAttendance = async (req, res) => {
  // Direct wrapper routing to student face attendance
  return markStudentFaceAttendance(req, res);
};

module.exports = {
  markBulkAttendance,
  markStudentFaceAttendance,
  markTeacherFaceAttendance,
  getAttendance,
  getAttendanceReports,
  getDashboardStats,
  getTeacherHistory,
  getStudentHistory,
  getAttendanceStats,
  markFaceAttendance // legacy
};
