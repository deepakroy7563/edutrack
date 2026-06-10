import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Loader2,
  Clock,
  BookOpen,
  User
} from 'lucide-react';

const TimetablePage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [day, setDay] = useState('Monday');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [teacher, setTeacher] = useState('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable(selectedClassId);
    } else {
      setTimetableSlots([]);
    }
  }, [selectedClassId]);

  const fetchInitialData = async () => {
    try {
      const classRes = await api.get('/classes');
      if (classRes.data.success) {
        setClasses(classRes.data.data);
        if (classRes.data.data.length > 0) {
          setSelectedClassId(classRes.data.data[0]._id); // Default to first class
        }
      }

      const teacherRes = await api.get('/teachers');
      if (teacherRes.data.success) {
        setTeachers(teacherRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching initial scheduling data:', err);
    }
  };

  const fetchTimetable = async (classId) => {
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classId=${classId}`);
      if (res.data.success) {
        setTimetableSlots(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (!selectedClassId) {
      alert('Please select a class first');
      return;
    }
    setDay('Monday');
    setSubject('');
    setStartTime('');
    setEndTime('');
    setTeacher('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      const res = await api.delete(`/timetable/${id}`);
      if (res.data.success) {
        fetchTimetable(selectedClassId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        classId: selectedClassId,
        day,
        subject,
        startTime,
        endTime,
        teacher
      };

      const res = await api.post('/timetable', payload);
      if (res.data.success) {
        setShowModal(false);
        fetchTimetable(selectedClassId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add timetable slot');
    }
  };

  // Group slots by Day
  const getSlotsByDay = (targetDay) => {
    return timetableSlots
      .filter(s => s.day === targetDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" /> Timetable Schedules
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure weekly course timelines and teacher room schedules.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full sm:w-48 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            <option value="">Select Classroom</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>
      </div>

      {/* Timetable Weekly Grid View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : selectedClassId ? (
        <div className="space-y-4">
          {weekDays.map((targetDay) => {
            const daySlots = getSlotsByDay(targetDay);
            return (
              <div key={targetDay} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-slate-800 transition-all shadow-xl">
                {/* Day Marker */}
                <div className="w-full md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 pb-2 md:pb-0 md:pr-4">
                  <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">{targetDay}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{daySlots.length} sessions</span>
                </div>

                {/* Slots List */}
                <div className="flex-1 flex flex-wrap gap-3">
                  {daySlots.length > 0 ? (
                    daySlots.map((slot) => (
                      <div key={slot._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 group min-w-[200px] hover:border-slate-700 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> {slot.subject}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> {slot.startTime} - {slot.endTime}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <User className="w-3.5 h-3.5" /> {slot.teacher?.user?.name || 'Staff'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 italic py-2">No class sessions scheduled for this day.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          Please select a classroom above to display the weekly schedule.
        </div>
      )}

      {/* CRUD Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-6">Create Timetable Slot</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  {weekDays.map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Algebra / Physics"
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Time</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 09:00"
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">End Time</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 10:00"
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subject Instructor</label>
                <select
                  required
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">Choose Instructor</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.user?.name} ({t.department})</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all duration-200"
              >
                Schedule Class Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
