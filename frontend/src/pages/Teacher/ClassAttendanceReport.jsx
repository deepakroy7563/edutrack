import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { downloadDetailedAttendanceReportPdf } from '../../utils/pdfGenerator';
import { downloadAttendanceExcel } from '../../utils/excelGenerator';
import { 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Search, 
  Loader2, 
  School, 
  Calendar,
  FileCheck
} from 'lucide-react';

const ClassAttendanceReport = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateRange, setDateRange] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassReports();
    }
  }, [selectedClassId, dateRange, startDate, status]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        // Filter classes: if teacher has profile.assignedClasses, only show those, else show all
        const assigned = user.profile?.assignedClasses || [];
        const classList = assigned.length > 0 ? assigned : res.data.data;
        
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err);
    }
  };

  const fetchClassReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'student',
        classId: selectedClassId,
        dateRange,
        startDate,
        endDate: startDate // For non-custom ranges, daily uses startDate
      });

      if (status) {
        params.append('status', status);
      }

      const res = await api.get(`/attendance/reports?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = () => {
    return records.filter(rec => {
      const q = searchQuery.toLowerCase();
      const name = rec.studentId?.user?.name || rec.name || '';
      const roll = rec.studentId?.rollNumber || '';
      return name.toLowerCase().includes(q) || roll.toLowerCase().includes(q);
    });
  };

  const getReportTitle = () => {
    const classObj = classes.find(c => c._id === selectedClassId);
    const classLabel = classObj ? `${classObj.className}-${classObj.section}` : 'Class';
    return `${dateRange.toUpperCase()} ATTENDANCE REPORT - ${classLabel}`;
  };

  const handleExportPDF = async () => {
    const data = getFilteredRecords();
    const headers = ['S.No', 'Student Name', 'Roll Number', 'Date', 'Check-In Time', 'Status', 'Biometric Score', 'Gate Location'];
    const rows = data.map((rec, index) => [
      index + 1,
      rec.studentId?.user?.name || rec.name,
      rec.studentId?.rollNumber || 'N/A',
      new Date(rec.date).toLocaleDateString(),
      rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A',
      rec.attendanceStatus,
      `${(rec.faceConfidence * 100).toFixed(0)}%`,
      rec.location
    ]);

    await downloadDetailedAttendanceReportPdf(getReportTitle(), headers, rows);
  };

  const handleExportExcel = () => {
    const data = getFilteredRecords();
    const headers = ['S.No', 'Student Name', 'Roll Number', 'Date', 'Check-In Time', 'Status', 'Biometric Score', 'Gate Location'];
    const rows = data.map((rec, index) => [
      index + 1,
      rec.studentId?.user?.name || rec.name,
      rec.studentId?.rollNumber || 'N/A',
      new Date(rec.date).toLocaleDateString(),
      rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A',
      rec.attendanceStatus,
      `${(rec.faceConfidence * 100).toFixed(0)}%`,
      rec.location
    ]);

    downloadAttendanceExcel(getReportTitle(), headers, rows);
  };

  const filtered = getFilteredRecords();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-400" /> Classroom Attendance Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">Review student attendance aggregates for your assigned classes and download sheets.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-350 border-b border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-indigo-400" /> Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Classroom</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
              ))}
              {classes.length === 0 && <option value="">No classrooms assigned</option>}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Time Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Filter</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              <option value="">All Logs</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search students by name or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-100 focus:outline-none"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4 w-10 text-center">S.No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4 text-center">Biometric Match</th>
                  <th className="p-4">Check-In Location</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filtered.map((rec, index) => {
                  const nameVal = rec.studentId?.user?.name || rec.name;
                  const rollVal = rec.studentId?.rollNumber || 'N/A';
                  const conf = rec.faceConfidence ? `${(rec.faceConfidence * 100).toFixed(0)}%` : 'N/A';

                  return (
                    <tr key={rec._id} className="hover:bg-slate-900/20">
                      <td className="p-4 text-center text-slate-500">{index + 1}</td>
                      <td className="p-4 font-bold text-slate-100">{nameVal}</td>
                      <td className="p-4 font-mono text-slate-300">{rollVal}</td>
                      <td className="p-4 text-slate-300">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-350 font-mono">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-4 text-center font-bold text-indigo-400 font-mono">{conf}</td>
                      <td className="p-4 text-slate-400">{rec.location || 'N/A'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          rec.attendanceStatus === 'Present' 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                            : rec.attendanceStatus === 'Late'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-450'
                        }`}>
                          {rec.attendanceStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          No classroom attendance logs found matching filters.
        </div>
      )}
    </div>
  );
};

export default ClassAttendanceReport;
