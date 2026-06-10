import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Calendar,
  X,
  Loader2,
  Users
} from 'lucide-react';

const NoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All');

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
      console.error('Error fetching notices:', err);
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setAudience('All');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await api.delete(`/notices/${id}`);
      if (res.data.success) {
        fetchNotices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { title, content, audience };
      if (editingId) {
        const res = await api.put(`/notices/${editingId}`, payload);
        if (res.data.success) {
          setShowModal(false);
          fetchNotices();
        }
      } else {
        const res = await api.post('/notices', payload);
        if (res.data.success) {
          setShowModal(false);
          fetchNotices();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Saving failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" /> Announcement Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">Publish bulletins and announcements targeted at specific school audiences.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Post Announcement
        </button>
      </div>

      {/* Grid of notices */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.map((n) => (
            <div key={n._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 shadow-xl space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">
                    To: {n.audience}
                  </span>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(n._id);
                        setTitle(n.title);
                        setContent(n.content);
                        setAudience(n.audience);
                        setShowModal(true);
                      }}
                      className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100">{n.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{n.content}</p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-800/40">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Published by: {n.author?.name || 'Administrator'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(n.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-6">
              {editingId ? 'Modify School Announcement' : 'Compose School Bulletin'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bulletin Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Science Laboratory Renovation Update"
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option>All</option>
                  <option>Teachers</option>
                  <option>Students</option>
                  <option>Parents</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Content Bulletin</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide comprehensive details for the school group..."
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all duration-200"
              >
                {editingId ? 'Update and Resend' : 'Publish Announcement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
