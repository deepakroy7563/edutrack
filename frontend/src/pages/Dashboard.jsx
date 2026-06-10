import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Users,
  GraduationCap,
  School,
  ClipboardCheck,
  Megaphone,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  ArrowUpRight,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch notices
        const noticeRes = await api.get('/notices');
        if (noticeRes.data.success) {
          setNotices(noticeRes.data.data.slice(0, 3));
        }

        // Fetch school details
        const schoolRes = await api.get('/school');
        if (schoolRes.data.success) {
          setSchool(schoolRes.data.data);
        }

        // Fetch analytical statistics
        const statsRes = await api.get('/attendance/dashboard/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const renderSchoolHero = () => {
    if (!school) return null;

    const bannerUrl = school.banner
      ? (school.banner.startsWith('data:') || school.banner.startsWith('http') ? school.banner : `http://localhost:5000${school.banner}`)
      : '';
    const logoUrl = school.logo
      ? (school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`)
      : '';

    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative mb-6">
        {/* Banner image or fallback gradient */}
        <div className="h-44 md:h-52 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {bannerUrl ? (
            <img src={bannerUrl} alt="School Cover" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-950/20 to-slate-900 opacity-60"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        </div>

        {/* Info Overlay Panel */}
        <div className="p-6 md:p-8 relative -mt-16 md:-mt-20 flex flex-col md:flex-row items-center md:items-end gap-6 border-t border-slate-800/20 bg-slate-900/30 backdrop-blur-sm">
          {/* Logo container */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-900 border border-slate-800 p-1.5 shadow-xl shrink-0">
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <School className="w-10 h-10 md:w-14 md:h-14 text-indigo-400" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-2 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {school.name}
              </h2>
              {school.established && (
                <span className="inline-block px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest self-center">
                  Est. {school.established}
                </span>
              )}
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {school.description || 'Welcome to the digital administrative portal.'}
            </p>

            {/* Quick contacts grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[10px] text-slate-400 pt-2 font-medium">
              {school.principal && (
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Principal: <strong className="text-slate-200">{school.principal}</strong></span>
                </div>
              )}
              {school.address && (
                <div className="flex items-center gap-1.5 justify-center md:justify-start col-span-2 sm:col-span-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="truncate" title={school.address}>{school.address}</span>
                </div>
              )}
              {school.phone && (
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>{school.phone}</span>
                </div>
              )}
              {school.email && (
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>{school.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // RENDER: Admin Dashboard View
  const renderAdminDashboard = () => {
    const overallAttendance = stats?.stats?.attendanceRate !== undefined ? stats.stats.attendanceRate : '94.2';
    const totalStudents = stats?.stats?.totalStudents || 184;
    const totalTeachers = stats?.stats?.totalTeachers || 18;
    const presentToday = stats?.stats?.presentCount || 0;
    const absentToday = stats?.stats?.absentCount || 0;
    const lateToday = stats?.stats?.lateCount || 0;
    const teacherCheckins = stats?.stats?.teacherCheckins || 0;

    // Charts Configuration
    const dateLabels = stats?.dailyStats?.map(d => d.date) || [];
    
    const lineChartData = {
      labels: dateLabels,
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: stats?.dailyStats?.map(d => d.attendanceRate) || [],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(99, 102, 241)'
        }
      ]
    };

    const barChartData = {
      labels: dateLabels,
      datasets: [
        {
          label: 'Present',
          data: stats?.dailyStats?.map(d => d.present) || [],
          backgroundColor: 'rgba(16, 185, 129, 0.75)', // emerald
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        },
        {
          label: 'Late',
          data: stats?.dailyStats?.map(d => d.late) || [],
          backgroundColor: 'rgba(245, 158, 11, 0.75)', // amber
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1
        },
        {
          label: 'Absent',
          data: stats?.dailyStats?.map(d => d.absent) || [],
          backgroundColor: 'rgba(239, 68, 68, 0.75)', // rose
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: 'rgb(148, 163, 184)', // slate-400
            font: { size: 10, weight: 'bold' }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.2)' },
          ticks: { color: 'rgb(148, 163, 184)', font: { size: 9 } }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.2)' },
          ticks: { color: 'rgb(148, 163, 184)', font: { size: 9 } }
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Simple Welcome Greeting */}
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Welcome, {user.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">EduTrack Administrative Portal &bull; System console is fully synced</p>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
            Admin Console
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{totalStudents}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Enrolled students registry</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Teachers</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{totalTeachers}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Staffing level</p>
            </div>
            <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <School className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{overallAttendance}%</h3>
              <p className="text-[10px] text-indigo-400 mt-1">Biometric verification rate</p>
            </div>
            <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teacher Check-ins</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{teacherCheckins}</h3>
              <p className="text-[10px] text-emerald-450 mt-1">Logged gate scans today</p>
            </div>
            <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Student Live Attendance Breakdowns */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Today's Student Biometric Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Present (On-Time)</p>
                <h4 className="text-lg font-black text-emerald-400">{presentToday}</h4>
              </div>
            </div>
            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-450 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Late Arrivals</p>
                <h4 className="text-lg font-black text-amber-450">{lateToday}</h4>
              </div>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Absent Today</p>
                <h4 className="text-lg font-black text-rose-455">{absentToday}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analytics Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300">Biometric Attendance Rate Trend (Last 7 Days)</h4>
            <div className="h-56">
              {dateLabels.length > 0 ? (
                <Line data={lineChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">No historical data available</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300">Daily Attendance Counts Breakdown (Last 7 Days)</h4>
            <div className="h-56">
              {dateLabels.length > 0 ? (
                <Bar data={barChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, x: { stacked: true }, y: { stacked: true } } }} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">No historical data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Notices */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" /> School Bulletins
              </h3>
              <span className="text-xs text-slate-500">Latest Updates</span>
            </div>
            <div className="space-y-4">
              {notices.length > 0 ? (
                notices.map((n) => (
                  <div key={n._id} className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-700/80 transition-all duration-200">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-sm text-slate-200">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
                        {n.audience}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{n.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/30">
                      <span>By: {n.author?.name || 'Administrator'}</span>
                      <span>{new Date(n.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-slate-500">No notices posted.</div>
              )}
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Attendance System Actions</h3>
            <div className="space-y-2">
              <a href="/admin/face-registration" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-indigo-600/10 hover:border-indigo-500/20 text-slate-350 hover:text-white transition-all text-xs font-semibold group">
                Register Biometric Embeddings
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a href="/admin/live-monitor" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-indigo-600/10 hover:border-indigo-500/20 text-slate-355 hover:text-white transition-all text-xs font-semibold group">
                Open Live Gate Monitor
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a href="/admin/reports" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-indigo-600/10 hover:border-indigo-500/20 text-slate-360 hover:text-white transition-all text-xs font-semibold group">
                Query Attendance Ledger
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Teacher Dashboard View
  const renderTeacherDashboard = () => {
    const assigned = user.profile?.assignedClasses || [];
    return (
      <div className="space-y-6">
        {/* Simple Welcome Greeting */}
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Welcome back, {user.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Academic Faculty Portal &bull; Ready for classes</p>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
            Faculty Console
          </span>
        </div>

        {/* Assigned Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-400" /> Assigned Classes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assigned.length > 0 ? (
                assigned.map((cls) => (
                  <div key={cls._id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-200">{cls.className}</h4>
                      <p className="text-xs text-slate-500">Section: {cls.section}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href="/teacher/attendance"
                        className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                      >
                        Webcam Roll Call
                      </a>
                      <a
                        href="/teacher/marks"
                        className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                      >
                        Log Grades
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm sm:col-span-2">
                  No classes explicitly assigned. You can still manage all classes.
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Teacher Tools</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-slate-200">Face Recognition</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Automated attendance scanning</div>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                  ONLINE
                </span>
              </div>
              <a href="/teacher/notices" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-emerald-600/10 hover:border-emerald-500/20 text-slate-300 hover:text-white transition-all text-xs font-semibold group">
                Post Teacher Bulletin
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" /> Recent Bulletins
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notices.map(n => (
              <div key={n._id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{n.audience}</span>
                  <span className="text-[9px] text-slate-500">{new Date(n.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-200 mt-2">{n.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Student Dashboard View
  const renderStudentDashboard = () => {
    const student = user.profile || {};
    const className = student.classId ? `${student.classId.className}-${student.classId.section}` : 'Grade 10-A';
    return (
      <div className="space-y-6">
        {/* Simple Welcome Greeting */}
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Hi, {user.name}!</h3>
            <p className="text-xs text-slate-400 mt-0.5">Student Academic Dashboard &bull; Keep up the excellent work</p>
          </div>
          <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/30 rounded text-[9px] font-bold text-violet-400 uppercase tracking-widest">
            Student Console
          </span>
        </div>

        {/* Student Stats Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Class</p>
              <h3 className="text-xl font-bold text-slate-100 mt-2">{className}</h3>
            </div>
            <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roll Number</p>
              <h3 className="text-xl font-bold text-slate-100 mt-2">{student.rollNumber || 'ROLL-10A01'}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Status</p>
              <h3 className="text-xl font-bold text-slate-100 mt-2">95.0%</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-violet-400" /> Recent Announcements
            </h3>
            <div className="space-y-4">
              {notices.map(n => (
                <div key={n._id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{new Date(n.date).toLocaleDateString()}</span>
                    <span>By Administrator</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200 mt-2">{n.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Quick Actions</h3>
            <div className="space-y-2">
              <a href="/student/marks" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-violet-600/10 hover:border-violet-500/20 text-slate-300 hover:text-white transition-all text-xs font-semibold group">
                View Exam Report Cards
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a href="/student/timetable" className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800 rounded-xl hover:bg-violet-600/10 hover:border-violet-500/20 text-slate-300 hover:text-white transition-all text-xs font-semibold group">
                Check Class Schedule Grid
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Parent Dashboard View
  const renderParentDashboard = () => {
    const parentProfile = user.profile || {};
    const children = parentProfile.children || [];

    return (
      <div className="space-y-6">
        {/* Simple Welcome Greeting */}
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Welcome, Mr./Mrs. {user.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Parent Engagement Portal &bull; Real-time student academic logs</p>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[9px] font-bold text-blue-400 uppercase tracking-widest">
            Parent Console
          </span>
        </div>

        {/* Children summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Monitored Children
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.length > 0 ? (
                children.map(child => {
                  const cName = child.classId ? `${child.classId.className}-${child.classId.section}` : 'N/A';
                  return (
                    <div key={child._id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-200">{child.user?.name || 'N/A'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Roll No: {child.rollNumber}</p>
                        <p className="text-xs text-slate-500">Class Room: {cName}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href="/parent/marks"
                          className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                        >
                          View Grades
                        </a>
                        <a
                          href="/parent/attendance"
                          className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                        >
                          Attendance
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm sm:col-span-2">
                  No children accounts linked. Please contact the administrator.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-400" /> School Bulletins
            </h3>
            <div className="space-y-4">
              {notices.map(n => (
                <div key={n._id} className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <span className="text-[9px] text-slate-500">{new Date(n.date).toLocaleDateString()}</span>
                  <h4 className="font-semibold text-xs text-slate-200 mt-1">{n.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dispatch view based on role
  const dispatchDashboard = () => {
    switch (user.role) {
      case 'admin':
        return renderAdminDashboard();
      case 'teacher':
        return renderTeacherDashboard();
      case 'student':
        return renderStudentDashboard();
      case 'parent':
        return renderParentDashboard();
      default:
        return <div className="text-center py-10 text-slate-400">Invalid dashboard layout dispatch.</div>;
    }
  };

  return (
    <div className="p-1 space-y-6">
      {renderSchoolHero()}
      {dispatchDashboard()}
    </div>
  );
};

export default Dashboard;
