import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  GraduationCap,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const MarksPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('Midterm');
  const [totalMarks, setTotalMarks] = useState(100);

  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({}); // { studentId: { marksObtained, totalMarks, id } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c._id === selectedClassId);
      if (cls && cls.subjects) {
        setSubjects(cls.subjects.map(s => s.name));
        if (cls.subjects.length > 0) {
          setSelectedSubject(cls.subjects[0].name);
        } else {
          setSelectedSubject('');
        }
      }
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (selectedClassId && selectedSubject && examType) {
      fetchGrades();
    } else {
      setStudents([]);
      setMarksData({});
    }
  }, [selectedClassId, selectedSubject, examType]);

  const fetchInitialData = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedClassId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching class/grading configs:', err);
    }
  };

  const fetchGrades = async () => {
    setLoading(true);
    try {
      // 1. Fetch class students
      const studentRes = await api.get(`/students?classId=${selectedClassId}`);
      let classStudents = [];
      if (studentRes.data.success) {
        classStudents = studentRes.data.data;
        setStudents(classStudents);
      }

      // 2. Fetch marks already entered
      const marksRes = await api.get(`/marks?classId=${selectedClassId}&subject=${selectedSubject}&examType=${examType}`);
      
      const data = {};
      classStudents.forEach(s => {
        data[s._id] = {
          marksObtained: '',
          totalMarks: 100,
          id: null // DB ID if already exists
        };
      });

      if (marksRes.data.success && marksRes.data.data.length > 0) {
        marksRes.data.data.forEach(m => {
          const sId = m.student?._id;
          if (sId && data[sId]) {
            data[sId] = {
              marksObtained: m.marksObtained,
              totalMarks: m.totalMarks,
              id: m._id
            };
          }
        });
      }

      setMarksData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, val) => {
    const score = val === '' ? '' : Math.max(0, parseFloat(val));
    setMarksData({
      ...marksData,
      [studentId]: {
        ...marksData[studentId],
        marksObtained: score
      }
    });
  };

  const calculateGrade = (obtained, total) => {
    if (obtained === '' || isNaN(obtained)) return '-';
    const pct = (obtained / total) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      let savedCount = 0;
      for (const studentId of Object.keys(marksData)) {
        const item = marksData[studentId];
        if (item.marksObtained === '') continue; // Skip unentered scores

        const payload = {
          student: studentId,
          classId: selectedClassId,
          examType,
          subject: selectedSubject,
          marksObtained: parseFloat(item.marksObtained),
          totalMarks: parseFloat(totalMarks)
        };

        if (item.id) {
          // Update
          await api.put(`/marks/${item.id}`, payload);
        } else {
          // Create
          await api.post('/marks', payload);
        }
        savedCount++;
      }

      alert(`Successfully saved grades for ${savedCount} students!`);
      fetchGrades();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" /> Academic Grading Register
          </h2>
          <p className="text-xs text-slate-400 mt-1">Select class sessions and log student course scores, letters, and percentages.</p>
        </div>

        <button
          onClick={handleSaveGrades}
          disabled={students.length === 0 || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Commit Grades Sheet
        </button>
      </div>

      {/* Select Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Classroom</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Course Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            {subjects.length > 0 ? (
              subjects.map(s => <option key={s}>{s}</option>)
            ) : (
              <option value="">No Courses Assigned</option>
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Exam Term</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            <option>Midterm</option>
            <option>Finals</option>
            <option>Monthly Test</option>
            <option>Quiz</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Max Course Marks</label>
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(Math.max(1, parseFloat(e.target.value)))}
            className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Spreadsheet List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : students.length > 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4">Student</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4 text-center">Marks Obtained</th>
                  <th className="p-4 text-center">Max Marks</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4 text-center">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {students.map((s) => {
                  const item = marksData[s._id] || { marksObtained: '', totalMarks: 100 };
                  const pct = item.marksObtained !== '' ? ((item.marksObtained / totalMarks) * 100).toFixed(1) + '%' : '-';
                  const grade = calculateGrade(item.marksObtained, totalMarks);
                  return (
                    <tr key={s._id} className="hover:bg-slate-900/20">
                      <td className="p-4 font-semibold text-slate-100">{s.user?.name}</td>
                      <td className="p-4 font-mono text-slate-400">{s.rollNumber}</td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          placeholder="e.g. 85"
                          min="0"
                          max={totalMarks}
                          value={item.marksObtained}
                          onChange={(e) => handleScoreChange(s._id, e.target.value)}
                          className="w-20 p-2 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-center text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-4 text-center text-slate-500 font-mono">{totalMarks}</td>
                      <td className="p-4 text-center text-slate-300 font-mono">{pct}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          grade === 'A+' || grade === 'A'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : grade === 'B' || grade === 'C'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                            : grade === 'D'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : grade === 'F'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {grade}
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
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          No students currently enrolled in the selected class section.
        </div>
      )}
    </div>
  );
};

export default MarksPage;
