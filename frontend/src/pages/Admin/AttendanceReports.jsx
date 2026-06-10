import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { downloadDetailedAttendanceReportPdf } from '../../utils/pdfGenerator';
import { downloadAttendanceExcel } from '../../utils/excelGenerator';
import { 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Search, 
  Loader2, 
  Calendar, 
  BookOpen, 
  Users, 
  CalendarDays,
  FileCheck2
} from 'lucide-react';

const AttendanceReports = () => {
  const [type, setType] = useState('student'); // student | teacher
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateRange, setDateRange] = useState('daily'); // daily | weekly | monthly | yearly | custom
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState(''); // Present | Absent | Late | ''
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [type, selectedClassId, dateRange, startDate, endDate, status]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedClassId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        dateRange,
        startDate,
        endDate
      });

      if (type === 'student' && selectedClassId) {
        params.append('classId', selectedClassId);
      }
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

  // Search filter
  const filteredRecords = records.filter(rec => {
    const q = searchQuery.toLowerCase();
    if (type === 'student') {
      const studentName = rec.studentId?.user?.name || rec.name || '';
      const rollNumber = rec.studentId?.rollNumber || '';
      return studentName.toLowerCase().includes(q) || rollNumber.toLowerCase().includes(q);
    } else {
      const teacherName = rec.teacherId?.user?.name || rec.name || '';
      const employeeId = rec.teacherId?.employeeId || '';
      const dept = rec.department || '';
      return teacherName.toLowerCase().includes(q) || employeeId.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    }
  });

  const getReportTitle = () => {
    const rangeLabel = dateRange.toUpperCase();
    const roleLabel = type === 'student' ? 'STUDENT' : 'TEACHER';
    return `${rangeLabel} ATTENDANCE REPORT (${roleLabel})`;
  };

  const getExportData = () => {
    if (type === 'student') {
      const headers = ['S.No', 'Name', 'Roll Number', 'Class/Section', 'Date', 'Check-In Time', 'Status', 'Confidence', 'Location'];
      const rows = filteredRecords.map((rec, index) => [
        index + 1,
        rec.studentId?.user?.name || rec.name,
        rec.studentId?.rollNumber || 'N/A',
        rec.class ? `${rec.class}-${rec.section}` : 'N/A',
        new Date(rec.date).toLocaleDateString(),
        rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A',
        rec.attendanceStatus,
        `${(rec.faceConfidence * 100).toFixed(0)}%`,
        rec.location
      ]);
      return { headers, rows };
    } else {
      const headers = ['S.No', 'Name', 'Employee ID', 'Department', 'Date', 'Check-In', 'Check-Out', 'Hrs Worked', 'Status', 'Confidence', 'Location'];
      const rows = filteredRecords.map((rec, index) => [
        index + 1,
        rec.teacherId?.user?.name || rec.name,
        rec.teacherId?.employeeId || 'N/A',
        rec.department,
        new Date(rec.date).toLocaleDateString(),
        rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A',
        rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : 'N/A',
        rec.totalHours ? `${rec.totalHours} hrs` : 'N/A',
        rec.attendanceStatus,
        `${(rec.faceConfidence * 100).toFixed(0)}%`,
        rec.location
      ]);
      return { headers, rows };
    }
  };

  const handleExportPDF = async () => {
    const { headers, rows } = getExportData();
    await downloadDetailedAttendanceReportPdf(getReportTitle(), headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    downloadAttendanceExcel(getReportTitle(), headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-400" /> Attendance Ledger & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">Generate dynamic student/teacher rosters and download spreadsheet or PDF files.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={filteredRecords.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filteredRecords.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-350 border-b border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-indigo-400" /> Filter Configuration
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>

          {type === 'student' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Classroom</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
                ))}
              </select>
            </div>
          )}

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
              <option value="yearly">Yearly Report</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            />
          </div>

          {dateRange === 'custom' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
              />
            </div>
          )}

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

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by name, roll number, employee ID or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4 w-10 text-center">S.No</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">{type === 'student' ? 'Roll Number' : 'ID / Department'}</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Check-In</th>
                  {type === 'teacher' && <th className="p-4">Check-Out</th>}
                  {type === 'teacher' && <th className="p-4 text-center">Total Hrs</th>}
                  <th className="p-4 text-center">Biometric Confidence</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredRecords.map((rec, index) => {
                  const nameVal = type === 'student' 
                    ? (rec.studentId?.user?.name || rec.name) 
                    : (rec.teacherId?.user?.name || rec.name);
                  const subVal = type === 'student' 
                    ? (rec.studentId?.rollNumber || 'N/A') 
                    : `${rec.teacherId?.employeeId || 'N/A'} [${rec.department || 'N/A'}]`;
                  const conf = rec.faceConfidence ? `${(rec.faceConfidence * 100).toFixed(0)}%` : 'N/A';

                  return (
                    <tr key={rec._id} className="hover:bg-slate-900/20">
                      <td className="p-4 text-center text-slate-500">{index + 1}</td>
                      <td className="p-4 font-bold text-slate-100">{nameVal}</td>
                      <td className="p-4 font-mono text-slate-350">{subVal}</td>
                      <td className="p-4 text-slate-300">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-300 font-mono">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A'}
                      </td>
                      {type === 'teacher' && (
                        <td className="p-4 text-slate-300 font-mono">
                          {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : 'N/A'}
                        </td>
                      )}
                      {type === 'teacher' && (
                        <td className="p-4 text-center text-slate-300 font-mono">
                          {rec.totalHours ? `${rec.totalHours} hrs` : '--'}
                        </td>
                      )}
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
        <div className="text-center py-20 text-sm text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
          No attendance logs matched your filter constraints.
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;
