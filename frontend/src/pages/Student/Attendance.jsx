import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  TrendingUp, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

const StudentAttendancePage = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentAttendance();
  }, []);

  const fetchStudentAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Error fetching student logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build Calendar grid for current month
  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Map history to simple dates hash map: { 'YYYY-MM-DD': status }
    const historyMap = {};
    history.forEach(h => {
      const dateKey = new Date(h.date).toISOString().split('T')[0];
      historyMap[dateKey] = h.attendanceStatus;
    });

    const days = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square bg-slate-950/20 rounded-lg"></div>);
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = dateObj.toISOString().split('T')[0];
      const status = historyMap[dateKey];
      
      let bgClass = 'bg-slate-900 border border-slate-800 text-slate-500';
      if (status === 'Present') {
        bgClass = 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold';
      } else if (status === 'Late') {
        bgClass = 'bg-amber-600/20 border border-amber-500/40 text-amber-450 font-bold';
      } else if (status === 'Absent') {
        bgClass = 'bg-rose-600/20 border border-rose-500/40 text-rose-400 font-bold';
      } else if (dateObj < today) {
        // Unlogged past dates default to absent or unrecorded
        bgClass = 'bg-slate-950 border border-slate-900 text-slate-700';
      }

      days.push(
        <div 
          key={`day-${day}`} 
          className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative ${bgClass}`}
          title={status ? `Status: ${status}` : 'No Record'}
        >
          <span>{day}</span>
          {status && (
            <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
              status === 'Present' ? 'bg-emerald-400' : status === 'Late' ? 'bg-amber-450' : 'bg-rose-450'
            }`}></span>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> 
            {today.toLocaleString('default', { month: 'long', year: 'numeric' })} Attendance Calendar
          </h3>
          
          <div className="flex gap-3 text-[9px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Late</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" /> My Attendance Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">Track your school attendance metrics, check-in history, and calendar records.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats & Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Attendance Rate</p>
                <h3 className="text-xl font-bold text-slate-100 mt-2">{stats?.attendanceRate}%</h3>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-900">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats?.attendanceRate || 0}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Present Days</p>
                <h3 className="text-xl font-bold text-emerald-400 mt-2">{stats?.presentDays}</h3>
                <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ontime arrivals</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Late Days</p>
                <h3 className="text-xl font-bold text-amber-400 mt-2">{stats?.lateDays}</h3>
                <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Arrived after 08:30</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Absent Days</p>
                <h3 className="text-xl font-bold text-rose-400 mt-2">{stats?.absentDays || 0}</h3>
                <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Unexcused absences</p>
              </div>
            </div>

            {/* Calendar */}
            {renderCalendar()}
          </div>

          {/* Chronological logs */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[55vh]">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-800 shrink-0">
              <Clock className="w-4 h-4 text-indigo-400" /> Chronological Logs
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
              {history.map((h) => (
                <div key={h._id} className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">{new Date(h.date).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-550 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {h.location}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      h.attendanceStatus === 'Present' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                        : h.attendanceStatus === 'Late'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-450'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-455'
                    }`}>
                      {h.attendanceStatus}
                    </span>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString() : '--:--'}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-20 text-xs text-slate-500">No gate scanner check-ins logged.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;
