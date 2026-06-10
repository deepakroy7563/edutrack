import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  ClipboardCheck,
  Users,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';

const ParentAttendancePage = () => {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.profile?.children) {
      setChildrenList(user.profile.children);
      if (user.profile.children.length > 0) {
        setSelectedChildId(user.profile.children[0]._id);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAttendance(selectedChildId);
    } else {
      setAttendanceLogs([]);
    }
  }, [selectedChildId]);

  const fetchAttendance = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?studentId=${studentId}`);
      if (res.data.success) {
        setAttendanceLogs(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching child attendance logs:', err);
      setLoading(false);
    }
  };

  // Compute stats
  const total = attendanceLogs.length;
  const present = attendanceLogs.filter(l => l.status === 'Present').length;
  const late = attendanceLogs.filter(l => l.status === 'Late').length;
  const absent = attendanceLogs.filter(l => l.status === 'Absent').length;

  const rate = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-400" /> Children Attendance Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">Monitor daily school classroom check-ins and monthly verification reports.</p>
        </div>

        {/* Child Selector */}
        {childrenList.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full sm:w-48 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              {childrenList.map(c => (
                <option key={c._id} value={c._id}>Child: {c.user?.name || 'Student'}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : selectedChildId ? (
        <div className="space-y-6">
          {/* Stats Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                <h3 className="text-lg font-bold text-slate-100 mt-1">{rate}%</h3>
              </div>
              <div className="w-10 h-10 bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present Days</p>
                <h3 className="text-lg font-bold text-emerald-400 mt-1">{present} days</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Late Sessions</p>
                <h3 className="text-lg font-bold text-amber-400 mt-1">{late} days</h3>
              </div>
              <div className="w-10 h-10 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent Days</p>
                <h3 className="text-lg font-bold text-rose-400 mt-1">{absent} days</h3>
              </div>
              <div className="w-10 h-10 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Daily Logs Table */}
          {attendanceLogs.length > 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                      <th className="p-4">Date</th>
                      <th className="p-4">Attendance Status</th>
                      <th className="p-4">Verification Method</th>
                      <th className="p-4">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-880 text-slate-200">
                    {attendanceLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-900/20">
                        <td className="p-4 font-semibold text-slate-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" /> {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'Present'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : log.status === 'Late'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.faceVerified ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                              Automated Face Verify
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-500">
                              Manual Entry
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-450">{log.markedBy?.name || 'Staff'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              No attendance records entered for this child yet.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          No children accounts registered under this parent profile.
        </div>
      )}
    </div>
  );
};

export default ParentAttendancePage;
