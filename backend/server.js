const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/models', express.static(path.join(__dirname, 'models')));

// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/marks', require('./routes/examRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/school', require('./routes/schoolRoutes'));

// Temporary seed route (can be deleted or secured after use)
app.get('/api/seed-database', async (req, res) => {
  try {
    const seedDatabase = require('./seeds/seed');
    await seedDatabase(false); // pass false so it doesn't call process.exit()
    res.json({ success: true, message: 'Database seeded successfully! You can now log in.' });
  } catch (err) {
    console.error('API Seeding Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('EduTrack School Management & Attendance System API is running...');
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
