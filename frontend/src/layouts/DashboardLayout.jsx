import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LayoutDashboard,
  Users,
  School,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  CalendarDays,
  DollarSign,
  LogOut,
  Menu,
  X,
  UserCheck,
  BookOpen,
  Monitor
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [school, setSchool] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await api.get('/school');
        if (res.data.success) {
          setSchool(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching school details in sidebar:', err);
      }
    };
    fetchSchool();
  }, []);

  const renderSchoolBrand = (sizeClass = "w-8 h-8") => {
    if (school && school.logo) {
      const logoUrl = school.logo.startsWith('data:') || school.logo.startsWith('http')
        ? school.logo
        : `http://localhost:5000${school.logo}`;
      return (
        <img
          src={logoUrl}
          alt="Logo"
          className={`${sizeClass} rounded-lg object-contain bg-slate-950 p-0.5 border border-slate-800`}
        />
      );
    }
    return <School className={`${sizeClass} text-indigo-400`} />;
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">Redirecting...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation lists based on user role
  const getNavLinks = () => {
    const role = user.role;
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'School Profile', path: '/admin/school', icon: School },
          { name: 'Manage Users', path: '/admin/users', icon: Users },
          { name: 'Manage Classes', path: '/admin/classes', icon: BookOpen },
          { name: 'Face Registration', path: '/admin/face-registration', icon: UserCheck },
          { name: 'Live Gate Monitor', path: '/admin/live-monitor', icon: Monitor },
          { name: 'Attendance Reports', path: '/admin/reports', icon: ClipboardCheck },
          { name: 'School Notices', path: '/admin/notices', icon: Megaphone },
          { name: 'Tuition Fees', path: '/admin/fees', icon: DollarSign },
          { name: 'Timetable grid', path: '/admin/timetable', icon: CalendarDays }
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Mark Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
          { name: 'My Check-In History', path: '/teacher/attendance-history', icon: CalendarDays },
          { name: 'Class Reports', path: '/teacher/class-report', icon: ClipboardCheck },
          { name: 'Student Marks', path: '/teacher/marks', icon: GraduationCap },
          { name: 'School Notices', path: '/teacher/notices', icon: Megaphone }
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Attendance', path: '/student/my-attendance', icon: ClipboardCheck },
          { name: 'Academic Results', path: '/student/marks', icon: GraduationCap },
          { name: 'My Timetable', path: '/student/timetable', icon: CalendarDays },
          { name: 'School Notices', path: '/student/notices', icon: Megaphone }
        ];
      case 'parent':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Child Academic Cards', path: '/parent/marks', icon: GraduationCap },
          { name: 'Attendance Sheets', path: '/parent/attendance', icon: ClipboardCheck },
          { name: 'School Notices', path: '/parent/notices', icon: Megaphone }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3 w-full">
            {renderSchoolBrand("w-8 h-8")}
            <span className="font-extrabold text-sm bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent truncate max-w-[150px]" title={school?.name || 'EduTrack'}>
              {school?.name || 'EduTrack'}
            </span>
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-rose-400" />
            Logout Account
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-900 border-r border-slate-800 h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <Link to="/dashboard" className="flex items-center gap-3">
                {renderSchoolBrand("w-8 h-8")}
                <span className="font-extrabold text-sm text-white truncate max-w-[130px]">
                  {school?.name || 'EduTrack'}
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-950/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Logout Account
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-sm font-bold text-slate-100 hidden sm:block truncate max-w-lg">
              {school?.name || 'EDUTRACK ACADEMY'} &mdash; <span className="text-indigo-400">{user.role.toUpperCase()} PORTAL</span>
            </h1>
          </div>

          {/* User Widget */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role}</div>
            </div>
            {/* Avatar */}
            {user.profileImage ? (
              <img
                src={`http://localhost:5000${user.profileImage}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-indigo-500/20 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-base shadow-inner">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
