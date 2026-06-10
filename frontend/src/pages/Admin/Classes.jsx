import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  School,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  User,
  X,
  Loader2
} from 'lucide-react';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [subjects, setSubjects] = useState([]); // Array of { name, teacher }

  // Subject helper states
  const [subjectName, setSubjectName] = useState('');
  const [subjectTeacher, setSubjectTeacher] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      if (res.data.success) {
        setTeachers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setClassName('');
    setSection('');
    setClassTeacher('');
    setSubjects([]);
    setSubjectName('');
    setSubjectTeacher('');
    setShowModal(true);
  };

  const handleAddSubject = () => {
    if (!subjectName) return;
    setSubjects([...subjects, { name: subjectName, teacher: subjectTeacher || null }]);
    setSubjectName('');
    setSubjectTeacher('');
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, idx) => idx !== index));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class? All linked students will remain, but class identifiers will be cleared.')) return;
    try {
      const res = await api.delete(`/classes/${id}`);
      if (res.data.success) {
        fetchClasses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        className,
        section,
        classTeacher: classTeacher || null,
        subjects
      };

      if (editingId) {
        const res = await api.put(`/classes/${editingId}`, payload);
        if (res.data.success) {
          setShowModal(false);
          fetchClasses();
        }
      } else {
        const res = await api.post('/classes', payload);
        if (res.data.success) {
          setShowModal(false);
          fetchClasses();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Saving failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-400" /> Classrooms & Subjects
          </h2>
          <p className="text-xs text-slate-400 mt-1">Register new grade sections, assign class instructors, and link courses.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const teacherName = cls.classTeacher?.user?.name || 'Unassigned';
            return (
              <div key={cls._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all duration-200 shadow-xl">
                <div className="space-y-3">
                  {/* Class Title */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{cls.className}</h3>
                      <p className="text-xs text-slate-500">Section: {cls.section}</p>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingId(cls._id);
                          setClassName(cls.className);
                          setSection(cls.section);
                          setClassTeacher(cls.classTeacher?._id || '');
                          setSubjects(cls.subjects.map(s => ({ name: s.name, teacher: s.teacher?._id || null })));
                          setSubjectName('');
                          setSubjectTeacher('');
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id)}
                        className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Class Teacher */}
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Teacher</div>
                      <div className="text-xs text-slate-200 font-semibold">{teacherName}</div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Courses & Faculty ({cls.subjects.length})
                    </div>
                    {cls.subjects.length > 0 ? (
                      <div className="space-y-1.5">
                        {cls.subjects.map((sub, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-950/20 rounded-lg border border-slate-800/40">
                            <span className="font-semibold text-slate-300">{sub.name}</span>
                            <span className="text-[10px] text-slate-400">{sub.teacher?.user?.name || 'Staff'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-[10px] text-slate-600 italic">No subjects configured.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-6">
              {editingId ? 'Modify Classroom Settings' : 'Create Class Session'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Name</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. Grade 10"
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Section Code</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A or B"
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Teacher (Lead)</label>
                <select
                  value={classTeacher}
                  onChange={(e) => setClassTeacher(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">Select Class Teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.user?.name} ({t.department})</option>
                  ))}
                </select>
              </div>

              {/* Subject Adding Section */}
              <div className="space-y-3 border-t border-slate-800/60 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Configure Subjects & Faculty</span>
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-slate-500">Subject Name</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g. Biology"
                      className="w-full p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-slate-500">Subject Teacher</label>
                    <select
                      value={subjectTeacher}
                      onChange={(e) => setSubjectTeacher(e.target.value)}
                      className="w-full p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="">Select Subject Teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 height-fit"
                  >
                    Add
                  </button>
                </div>

                {/* Subject List inside Modal */}
                {subjects.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    {subjects.map((sub, idx) => {
                      const tName = teachers.find(t => t._id === sub.teacher)?.user?.name || 'Staff';
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-900 border border-slate-800/50 rounded-lg">
                          <span className="font-semibold text-slate-300">{sub.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400">{tName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(idx)}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all duration-200"
              >
                {editingId ? 'Save Class Alterations' : 'Deploy Classroom Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
