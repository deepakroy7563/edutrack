import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Cpu, 
  Loader2, 
  TrendingUp, 
  Hourglass,
  CheckCircle2
} from 'lucide-react';

const TeacherAttendanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendanceRate: 100,
    totalHours: 0,
    averageCheckIn: 'N/A'
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/teacher/history');
      if (res.data.success) {
        const data = res.data.data;
        setHistory(data);

        // Compute local stats
        if (data.length > 0) {
          const totalDays = data.length;
          const presentDays = data.filter(h => h.attendanceStatus !== 'Absent').length;
          const rate = (presentDays / totalDays) * 100;
          
          let totalHrs = 0;
          let checkinSums = 0;
          let checkinCounts = 0;

          data.forEach(h => {
            if (h.totalHours) totalHrs += h.totalHours;
            if (h.checkInTime) {
              const dt = new Date(h.checkInTime);
              checkinSums += dt.getHours() * 60 + dt.getMinutes();
              checkinCounts++;
            }
          });

          let avgTimeStr = 'N/A';
          if (checkinCounts > 0) {
            const avgMins = Math.round(checkinSums / checkinCounts);
            const hh = Math.floor(avgMins / 60);
            const mm = avgMins % 60;
            const ampm = hh >= 12 ? 'PM' : 'AM';
            const displayH = hh % 12 || 12;
            avgTimeStr = `${displayH}:${mm < 10 ? '0' + mm : mm} ${ampm}`;
          }

          setStats({
            attendanceRate: parseFloat(rate.toFixed(1)),
            totalHours: parseFloat(totalHrs.toFixed(1)),
            averageCheckIn: avgTimeStr
          });
        }
      }
    } catch (err) {
      console.error('Error fetching teacher history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" /> Biometric Check-In History
        </h2>
        <p className="text-xs text-slate-400 mt-1">Review your check-in and check-out biometric signatures, total working hours, and device IPs.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">{stats.attendanceRate}%</h3>
                <p className="text-[10px] text-emerald-450 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High liveness match rate
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accumulated Hours</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">{stats.totalHours} hrs</h3>
                <p className="text-[10px] text-slate-500 mt-1">Total time logged at gate</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <Hourglass className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Check-In</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">{stats.averageCheckIn}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Expected arrival time 8:30 AM</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table */}
          {history.length > 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                      <th className="p-4">Date</th>
                      <th className="p-4">Check-In Time</th>
                      <th className="p-4">Check-Out Time</th>
                      <th className="p-4 text-center">Hours Worked</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Device IP</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {history.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-900/20">
                        <td className="p-4 font-semibold text-slate-100">{new Date(h.date).toLocaleDateString()}</td>
                        <td className="p-4 font-mono text-slate-300">
                          {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="p-4 text-center font-mono font-semibold text-indigo-400">
                          {h.totalHours ? `${h.totalHours} hrs` : '--'}
                        </td>
                        <td className="p-4 text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {h.location}
                        </td>
                        <td className="p-4 font-mono text-slate-500 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-slate-705" /> {h.deviceIp}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            h.attendanceStatus === 'Present' 
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                              : h.attendanceStatus === 'Late'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                          }`}>
                            {h.attendanceStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
              No personal attendance logs found. Use the gate scanner to record check-in.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherAttendanceHistory;
