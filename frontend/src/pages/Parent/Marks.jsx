import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { downloadStudentReportCard } from '../../utils/pdfGenerator';
import {
  GraduationCap,
  FileDown,
  Award,
  BookOpen,
  Loader2,
  TrendingUp,
  Users
} from 'lucide-react';

const ParentMarksPage = () => {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [reportCards, setReportCards] = useState([]);
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
      fetchReportCards(selectedChildId);
    } else {
      setReportCards([]);
    }
  }, [selectedChildId]);

  const fetchReportCards = async (childId) => {
    setLoading(true);
    try {
      const res = await api.get(`/marks/student/${childId}`);
      if (res.data.success) {
        setReportCards(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching child grades:', err);
      setLoading(false);
    }
  };

  const handleDownloadPDF = (exam) => {
    const child = childrenList.find(c => c._id === selectedChildId);
    if (!child) return;

    const childName = child.user?.name || 'Student';
    const rollNumber = child.rollNumber || 'N/A';
    const className = child.classId
      ? `${child.classId.className}-${child.classId.section}`
      : 'Grade 10-A';
    
    downloadStudentReportCard(childName, rollNumber, className, exam);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" /> Children Progress Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">Review academic report cards, grades transcripts, and download formal documents.</p>
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
        reportCards.length > 0 ? (
          <div className="space-y-6">
            {reportCards.map((exam) => (
              <div key={exam.examType} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                {/* Title Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{exam.examType} Results</h3>
                      <p className="text-xs text-slate-500">Academic Classroom: {exam.class}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 px-4 py-2 rounded-2xl">
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Avg Percentage</div>
                        <div className="text-sm font-extrabold text-slate-100 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-emerald-400" /> {exam.percentage}%
                        </div>
                      </div>
                      <span className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-black text-sm flex items-center justify-center shadow-inner">
                        {exam.overallGrade}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadPDF(exam)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                    >
                      <FileDown className="w-4 h-4" /> Export Report Card
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/85 bg-slate-950/20 text-slate-400 uppercase tracking-widest font-semibold">
                        <th className="p-3">Course Subject</th>
                        <th className="p-3 text-center">Marks Obtained</th>
                        <th className="p-3 text-center">Max Marks</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Letter Grade</th>
                        <th className="p-3">Assigned Faculty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-200">
                      {exam.subjects.map((sub, index) => {
                        const percentage = ((sub.marksObtained / sub.totalMarks) * 100).toFixed(0);
                        return (
                          <tr key={index} className="hover:bg-slate-900/10">
                            <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-slate-500" /> {sub.subject}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300">{sub.marksObtained}</td>
                            <td className="p-3 text-center font-mono text-slate-500">{sub.totalMarks}</td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-300">{percentage}%</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                sub.grade === 'A+' || sub.grade === 'A'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : sub.grade === 'B' || sub.grade === 'C'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                  : 'bg-slate-850 text-slate-500'
                              }`}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{sub.teacher}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            No grades logged for this child yet.
          </div>
        )
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          No children accounts registered under this parent profile.
        </div>
      )}
    </div>
  );
};

export default ParentMarksPage;
