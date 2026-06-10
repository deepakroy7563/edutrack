const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Timetable = require('../models/Timetable');
const Fee = require('../models/Fee');
const School = require('../models/School');

// Load environment variables
dotenv.config();

const seedDatabase = async (shouldExit = true) => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutrack');
    console.log('MongoDB Connected for Seeding...');

    // Clear all existing data
    console.log('Clearing database...');
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Parent.deleteMany();
    await Class.deleteMany();
    await Attendance.deleteMany();
    await Marks.deleteMany();
    await Notice.deleteMany();
    await Timetable.deleteMany();
    await Fee.deleteMany();
    await School.deleteMany();

    console.log('Database cleared! Populating data...');

    // 0. Create School Profile
    await School.create({
      name: 'EduTrack Academy',
      principal: 'Dr. Sharma',
      address: 'Main Campus Road',
      phone: '+919876543210',
      email: 'info@edutrack.com',
      description: 'A modern digital school management platform.',
      logo: '',
      banner: ''
    });
    console.log('- School profile created');

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Principal Sarah Jenkins',
      email: 'admin@edutrack.com',
      password: 'password123',
      role: 'admin',
      profileImage: ''
    });
    console.log('- Admin account created');

    // 2. Create Teachers
    const teacher1User = await User.create({
      name: 'John Miller',
      email: 'john.miller@edutrack.com',
      password: 'password123',
      role: 'teacher',
      profileImage: ''
    });
    const teacher1 = await Teacher.create({
      user: teacher1User._id,
      employeeId: 'EMP001',
      phone: '+1555019001',
      designation: 'Senior Faculty',
      department: 'Mathematics',
      subjects: ['Algebra', 'Calculus', 'Geometry']
    });

    const teacher2User = await User.create({
      name: 'Dr. Emily Watson',
      email: 'emily.watson@edutrack.com',
      password: 'password123',
      role: 'teacher',
      profileImage: ''
    });
    const teacher2 = await Teacher.create({
      user: teacher2User._id,
      employeeId: 'EMP002',
      phone: '+1555019002',
      designation: 'Department Head',
      department: 'Science',
      subjects: ['Physics', 'Chemistry', 'Biology']
    });

    const teacher3User = await User.create({
      name: 'Robert Vance',
      email: 'robert.vance@edutrack.com',
      password: 'password123',
      role: 'teacher',
      profileImage: ''
    });
    const teacher3 = await Teacher.create({
      user: teacher3User._id,
      employeeId: 'EMP003',
      phone: '+1555019003',
      designation: 'Assoc. Professor',
      department: 'English',
      subjects: ['English Literature', 'Creative Writing']
    });
    console.log(`- 3 Teacher accounts and profiles created`);

    // 3. Create Classes
    const classA = await Class.create({
      className: 'Grade 10',
      section: 'A',
      classTeacher: teacher1._id,
      subjects: [
        { name: 'Mathematics', teacher: teacher1._id },
        { name: 'Physics', teacher: teacher2._id },
        { name: 'English', teacher: teacher3._id }
      ]
    });

    const classB = await Class.create({
      className: 'Grade 11',
      section: 'B',
      classTeacher: teacher2._id,
      subjects: [
        { name: 'Calculus', teacher: teacher1._id },
        { name: 'Chemistry', teacher: teacher2._id },
        { name: 'English Literature', teacher: teacher3._id }
      ]
    });

    // Add classes to teachers assigned classes
    teacher1.assignedClasses.push(classA._id, classB._id);
    await teacher1.save();

    teacher2.assignedClasses.push(classA._id, classB._id);
    await teacher2.save();

    teacher3.assignedClasses.push(classA._id, classB._id);
    await teacher3.save();

    console.log('- 2 Classes successfully set up');

    // 4. Create Parents
    const parent1User = await User.create({
      name: 'Michael Davis',
      email: 'parent1@edutrack.com',
      password: 'password123',
      role: 'parent',
      profileImage: ''
    });
    const parent1 = await Parent.create({
      user: parent1User._id,
      phone: '+1555019101',
      occupation: 'Architect',
      relationship: 'Father'
    });

    const parent2User = await User.create({
      name: 'Susan Thompson',
      email: 'parent2@edutrack.com',
      password: 'password123',
      role: 'parent',
      profileImage: ''
    });
    const parent2 = await Parent.create({
      user: parent2User._id,
      phone: '+1555019102',
      occupation: 'Pediatrician',
      relationship: 'Mother'
    });
    console.log('- 2 Parent accounts created');

    // 5. Create Students
    // Student 1 (Parent 1)
    const student1User = await User.create({
      name: 'Alex Davis',
      email: 'student1@edutrack.com',
      password: 'password123',
      role: 'student',
      profileImage: ''
    });
    const student1 = await Student.create({
      user: student1User._id,
      rollNumber: 'ROLL-10A01',
      classId: classA._id,
      parent: parent1User._id,
      dateOfBirth: new Date('2011-04-12'),
      gender: 'Male',
      phone: '+1555019201',
      address: '742 Evergreen Terrace, Springfield'
    });

    // Student 2 (Parent 1)
    const student2User = await User.create({
      name: 'Chloe Davis',
      email: 'student2@edutrack.com',
      password: 'password123',
      role: 'student',
      profileImage: ''
    });
    const student2 = await Student.create({
      user: student2User._id,
      rollNumber: 'ROLL-10A02',
      classId: classA._id,
      parent: parent1User._id,
      dateOfBirth: new Date('2011-09-25'),
      gender: 'Female',
      phone: '+1555019202',
      address: '742 Evergreen Terrace, Springfield'
    });

    parent1.children.push(student1._id, student2._id);
    await parent1.save();

    // Student 3 (Parent 2)
    const student3User = await User.create({
      name: 'Leo Thompson',
      email: 'student3@edutrack.com',
      password: 'password123',
      role: 'student',
      profileImage: ''
    });
    const student3 = await Student.create({
      user: student3User._id,
      rollNumber: 'ROLL-11B01',
      classId: classB._id,
      parent: parent2User._id,
      dateOfBirth: new Date('2010-02-18'),
      gender: 'Male',
      phone: '+1555019203',
      address: '123 Fake Street, Shelbyville'
    });

    parent2.children.push(student3._id);
    await parent2.save();

    // Student 4 (No parent listed - testing edge case)
    const student4User = await User.create({
      name: 'Ryan Mercer',
      email: 'student4@edutrack.com',
      password: 'password123',
      role: 'student',
      profileImage: ''
    });
    const student4 = await Student.create({
      user: student4User._id,
      rollNumber: 'ROLL-11B02',
      classId: classB._id,
      dateOfBirth: new Date('2010-11-05'),
      gender: 'Male',
      phone: '+1555019204',
      address: '456 Elm Road, Shelbyville'
    });

    console.log('- 4 Student accounts and profiles created and linked to parents');

    // 6. Create Notices
    await Notice.create({
      title: 'Annual Sports Day Postponed',
      content: 'The Annual Sports Day scheduled for next Friday has been postponed to the following month due to forecasted heavy rainfall. Detailed event timings will be published shortly.',
      audience: 'All',
      author: adminUser._id
    });

    await Notice.create({
      title: 'Monthly Teachers Meeting',
      content: 'Reminder: The staff review meeting will be held this Thursday at 3:30 PM in the Conference Room. Please prepare your class performance files.',
      audience: 'Teachers',
      author: adminUser._id
    });

    await Notice.create({
      title: 'Parent-Teacher Conference (PTC) Bookings Open',
      content: 'PTC slots are now open for scheduling. Parents can reserve individual consultation times with subject teachers through their dashboards. Please book before Wednesday.',
      audience: 'Parents',
      author: adminUser._id
    });
    console.log('- 3 Notice Board posts set up');

    // 7. Create Timetables
    // Grade 10-A Timetable
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const d of days) {
      await Timetable.create({
        classId: classA._id,
        day: d,
        subject: 'Mathematics',
        startTime: '09:00',
        endTime: '10:00',
        teacher: teacher1._id
      });
      await Timetable.create({
        classId: classA._id,
        day: d,
        subject: 'Physics',
        startTime: '10:15',
        endTime: '11:15',
        teacher: teacher2._id
      });
      await Timetable.create({
        classId: classA._id,
        day: d,
        subject: 'English',
        startTime: '11:30',
        endTime: '12:30',
        teacher: teacher3._id
      });
    }

    // Grade 11-B Timetable
    for (const d of days) {
      await Timetable.create({
        classId: classB._id,
        day: d,
        subject: 'Calculus',
        startTime: '09:00',
        endTime: '10:00',
        teacher: teacher1._id
      });
      await Timetable.create({
        classId: classB._id,
        day: d,
        subject: 'Chemistry',
        startTime: '10:15',
        endTime: '11:15',
        teacher: teacher2._id
      });
      await Timetable.create({
        classId: classB._id,
        day: d,
        subject: 'English Literature',
        startTime: '11:30',
        endTime: '12:30',
        teacher: teacher3._id
      });
    }
    console.log('- Timetable grids generated for both Grade 10-A and 11-B');

    // 8. Create Invoiced Fees
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Paid fee for student 1
    await Fee.create({
      student: student1._id,
      amount: 1200,
      feeType: 'Tuition Fee',
      status: 'Paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
      paymentDate: new Date(now.getFullYear(), now.getMonth(), 3),
      receiptNo: 'REC-' + Date.now() + '-1'
    });

    // Pending fee for student 1
    await Fee.create({
      student: student1._id,
      amount: 1200,
      feeType: 'Tuition Fee',
      status: 'Pending',
      dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5)
    });

    // Paid fee for student 2
    await Fee.create({
      student: student2._id,
      amount: 1200,
      feeType: 'Tuition Fee',
      status: 'Paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
      paymentDate: new Date(now.getFullYear(), now.getMonth(), 4),
      receiptNo: 'REC-' + Date.now() + '-2'
    });

    // Pending fee for student 3
    await Fee.create({
      student: student3._id,
      amount: 1500,
      feeType: 'Tuition Fee',
      status: 'Pending',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 5)
    });

    // Pending exam fee for student 4
    await Fee.create({
      student: student4._id,
      amount: 150,
      feeType: 'Exam Fee',
      status: 'Pending',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15)
    });

    console.log('- Fee invoices generated');

    // 9. Create Marks / Exam Grades
    // Alex Davis (Grade 10-A) Midterm Grades
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'Mathematics',
      marksObtained: 85,
      totalMarks: 100,
      teacher: teacher1User._id
    });
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'Physics',
      marksObtained: 92,
      totalMarks: 100,
      teacher: teacher2User._id
    });
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'English',
      marksObtained: 78,
      totalMarks: 100,
      teacher: teacher3User._id
    });

    // Alex Davis (Grade 10-A) Final Grades (Alex improved!)
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Finals',
      subject: 'Mathematics',
      marksObtained: 94,
      totalMarks: 100,
      teacher: teacher1User._id
    });
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Finals',
      subject: 'Physics',
      marksObtained: 96,
      totalMarks: 100,
      teacher: teacher2User._id
    });
    await Marks.create({
      student: student1._id,
      classId: classA._id,
      examType: 'Finals',
      subject: 'English',
      marksObtained: 88,
      totalMarks: 100,
      teacher: teacher3User._id
    });

    // Chloe Davis (Grade 10-A) Midterm Grades
    await Marks.create({
      student: student2._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'Mathematics',
      marksObtained: 64,
      totalMarks: 100,
      teacher: teacher1User._id
    });
    await Marks.create({
      student: student2._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'Physics',
      marksObtained: 72,
      totalMarks: 100,
      teacher: teacher2User._id
    });
    await Marks.create({
      student: student2._id,
      classId: classA._id,
      examType: 'Midterm',
      subject: 'English',
      marksObtained: 95,
      totalMarks: 100,
      teacher: teacher3User._id
    });

    // Leo Thompson (Grade 11-B) Midterm Grades
    await Marks.create({
      student: student3._id,
      classId: classB._id,
      examType: 'Midterm',
      subject: 'Calculus',
      marksObtained: 89,
      totalMarks: 100,
      teacher: teacher1User._id
    });
    await Marks.create({
      student: student3._id,
      classId: classB._id,
      examType: 'Midterm',
      subject: 'Chemistry',
      marksObtained: 81,
      totalMarks: 100,
      teacher: teacher2User._id
    });

    console.log('- Exam marks and pre-save letter grades calculated');

    // 10. Daily Attendance Logs (Past 4 Days)
    const today = new Date();
    for (let i = 1; i <= 4; i++) {
      const logDate = new Date();
      logDate.setDate(today.getDate() - i);
      logDate.setUTCHours(0, 0, 0, 0);

      // Student 1 was Present, Student 2 Present/Late, Student 3 Late, Student 4 Absent
      await Attendance.create({
        student: student1._id,
        classId: classA._id,
        date: logDate,
        status: 'Present',
        markedBy: teacher1User._id
      });

      await Attendance.create({
        student: student2._id,
        classId: classA._id,
        date: logDate,
        status: i === 2 ? 'Late' : 'Present',
        markedBy: teacher1User._id
      });

      await Attendance.create({
        student: student3._id,
        classId: classB._id,
        date: logDate,
        status: i === 3 ? 'Late' : 'Present',
        markedBy: teacher2User._id
      });

      await Attendance.create({
        student: student4._id,
        classId: classB._id,
        date: logDate,
        status: 'Absent',
        markedBy: teacher2User._id
      });
    }
    console.log('- Sample daily attendance sheets created');

    console.log('\n=========================================');
    console.log('EDU TRACK DATABASE SEEDED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('Login credentials for testing dashboards:');
    console.log('1. Admin:    admin@edutrack.com           / password123');
    console.log('2. Teacher:  john.miller@edutrack.com      / password123 (Class Teacher Grade 10-A)');
    console.log('3. Student:  student1@edutrack.com         / password123 (Alex Davis, Grade 10-A)');
    console.log('4. Parent:   parent1@edutrack.com          / password123 (Michael Davis, Dad of Alex & Chloe)');
    console.log('=========================================\n');

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding Process Error:', error);
    if (shouldExit) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seedDatabase(true);
} else {
  module.exports = seedDatabase;
}
