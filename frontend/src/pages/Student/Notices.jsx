import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Megaphone,
  Calendar,
  Loader2,
  Users
} from 'lucide-react';

const StudentNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices');
      if (res.data.success) {
        setNotices(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student notices:', err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" /> School Notice Board
        </h2>
        <p className="text-xs text-slate-400 mt-1">Review the latest updates and announcements published for your class group.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : notices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.map((n) => (
            <div key={n._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 shadow-xl space-y-4">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">
                  To: {n.audience}
                </span>

                <h3 className="text-base font-bold text-slate-100">{n.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{n.content}</p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-800/40">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Logged by: Staff Instructor
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(n.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          No notices currently posted for your student role. Check back later!
        </div>
      )}
    </div>
  );
};

export default StudentNoticesPage;
