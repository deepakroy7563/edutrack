import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & pages
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Admin Pages
import UsersPage from './pages/Admin/Users';
import ClassesPage from './pages/Admin/Classes';
import NoticesPage from './pages/Admin/Notices';
import FeesPage from './pages/Admin/Fees';
import TimetablePage from './pages/Admin/Timetable';
import SchoolInfoPage from './pages/Admin/SchoolInfo';
import FaceRegistration from './pages/Admin/FaceRegistration';
import LiveAttendanceMonitor from './pages/Admin/LiveAttendanceMonitor';
import AttendanceReports from './pages/Admin/AttendanceReports';

// Teacher Pages
import AttendancePage from './pages/Teacher/Attendance';
import MarksPage from './pages/Teacher/Marks';
import TeacherNotices from './pages/Teacher/Notices';
import TeacherAttendanceHistory from './pages/Teacher/AttendanceHistory';
import ClassAttendanceReport from './pages/Teacher/ClassAttendanceReport';

// Student Pages
import StudentMarksPage from './pages/Student/Marks';
import StudentTimetablePage from './pages/Student/Timetable';
import StudentNoticesPage from './pages/Student/Notices';
import StudentAttendancePage from './pages/Student/Attendance';

// Parent Pages
import ParentMarksPage from './pages/Parent/Marks';
import ParentAttendancePage from './pages/Parent/Attendance';
import ParentNotices from './pages/Parent/Notices';

// Authentication Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route wrapper that handles both Layout wrapping and Guarding
const LayoutRoute = ({ children, allowedRoles }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Core Protected Dashboard Dispatcher */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Specific Routes */}
          <Route
            path="/admin/users"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <UsersPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <ClassesPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <NoticesPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <FeesPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <TimetablePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/school"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <SchoolInfoPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/face-registration"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <FaceRegistration />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/live-monitor"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <LiveAttendanceMonitor />
              </LayoutRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <LayoutRoute allowedRoles={['admin']}>
                <AttendanceReports />
              </LayoutRoute>
            }
          />

          {/* Teacher Specific Routes */}
          <Route
            path="/teacher/attendance"
            element={
              <LayoutRoute allowedRoles={['teacher', 'admin']}>
                <AttendancePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/teacher/attendance-history"
            element={
              <LayoutRoute allowedRoles={['teacher', 'admin']}>
                <TeacherAttendanceHistory />
              </LayoutRoute>
            }
          />
          <Route
            path="/teacher/class-report"
            element={
              <LayoutRoute allowedRoles={['teacher', 'admin']}>
                <ClassAttendanceReport />
              </LayoutRoute>
            }
          />
          <Route
            path="/teacher/marks"
            element={
              <LayoutRoute allowedRoles={['teacher', 'admin']}>
                <MarksPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/teacher/notices"
            element={
              <LayoutRoute allowedRoles={['teacher', 'admin']}>
                <TeacherNotices />
              </LayoutRoute>
            }
          />

          {/* Student Specific Routes */}
          <Route
            path="/student/my-attendance"
            element={
              <LayoutRoute allowedRoles={['student']}>
                <StudentAttendancePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/student/marks"
            element={
              <LayoutRoute allowedRoles={['student']}>
                <StudentMarksPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <LayoutRoute allowedRoles={['student']}>
                <StudentTimetablePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/student/notices"
            element={
              <LayoutRoute allowedRoles={['student']}>
                <StudentNoticesPage />
              </LayoutRoute>
            }
          />

          {/* Parent Specific Routes */}
          <Route
            path="/parent/marks"
            element={
              <LayoutRoute allowedRoles={['parent']}>
                <ParentMarksPage />
              </LayoutRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <LayoutRoute allowedRoles={['parent']}>
                <ParentAttendancePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/parent/notices"
            element={
              <LayoutRoute allowedRoles={['parent']}>
                <ParentNotices />
              </LayoutRoute>
            }
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
