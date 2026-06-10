import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  CalendarDays,
  Clock,
  BookOpen,
  User,
  Loader2
} from 'lucide-react';

const StudentTimetablePage = () => {
  const { user } = useAuth();
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTimetable();
  }, [user]);

  const fetchTimetable = async () => {
    if (!user || !user.profile?.classId?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classId=${user.profile.classId._id}`);
      if (res.data.success) {
        setTimetableSlots(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student timetable:', err);
      setLoading(false);
    }
  };

  const getSlotsByDay = (targetDay) => {
    return timetableSlots
      .filter(s => s.day === targetDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const className = user?.profile?.classId
    ? `${user.profile.classId.className}-${user.profile.classId.section}`
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-indigo-400" /> Weekly Timetable Calendar
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Showing schedule for class section: <span className="text-indigo-400 font-bold">{className}</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : user?.profile?.classId?._id ? (
        <div className="space-y-4">
          {weekDays.map((targetDay) => {
            const daySlots = getSlotsByDay(targetDay);
            return (
              <div key={targetDay} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-slate-800/80 transition-all shadow-xl">
                {/* Day marker */}
                <div className="w-full md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 pb-2 md:pb-0 md:pr-4">
                  <h3 className="font-extrabold text-sm text-slate-100 tracking-wide">{targetDay}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{daySlots.length} sessions</span>
                </div>

                {/* Slots */}
                <div className="flex-1 flex flex-wrap gap-3">
                  {daySlots.length > 0 ? (
                    daySlots.map((slot) => (
                      <div key={slot._id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col gap-1.5 min-w-[180px] hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> {slot.subject}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {slot.startTime} - {slot.endTime}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                          <User className="w-3.5 h-3.5 text-slate-600" /> {slot.teacher?.user?.name || 'Staff'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 italic py-2">No scheduled classes for this day. Enjoy your free time!</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          No classroom currently assigned. Please contact the administration.
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;
