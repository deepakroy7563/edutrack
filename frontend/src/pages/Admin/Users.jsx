import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Image,
  Upload,
  Check,
  X,
  Loader2
} from 'lucide-react';

const UsersPage = () => {
  const [activeTab, setActiveTab] = useState('student'); // student | teacher | parent
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // If editing a user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  // Role specific states
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');

  // Image Upload preview
  const [imagePreview, setImagePreview] = useState('');

  const fileInputRef = useRef();

  // Search filter computations
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.user?.name || '').toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q) ||
      (s.classId ? `${s.classId.className}-${s.classId.section}` : '').toLowerCase().includes(q)
    );
  });

  const filteredTeachers = teachers.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      (t.user?.name || '').toLowerCase().includes(q) ||
      (t.employeeId || '').toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const studentRes = await api.get('/students');
      if (studentRes.data.success) {
        setStudents(studentRes.data.data);
      }

      const teacherRes = await api.get('/teachers');
      if (teacherRes.data.success) {
        setTeachers(teacherRes.data.data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const processImageSource = (src) => {
    setImagePreview(src);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      processImageSource(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenRegister = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole(activeTab);
    setRollNumber('');
    setClassId('');
    setParentEmail('');
    setEmployeeId('');
    setDepartment('');
    setDesignation('');
    setPhone('');
    setAddress('');
    setGender('Male');
    setImagePreview('');
    setShowModal(true);
  };

  const handleDelete = async (id, userRole) => {
    if (!window.confirm('Are you sure you want to delete this user profile? All linked files will be removed.')) return;
    try {
      const endpoint = userRole === 'student' ? `/students/${id}` : `/teachers/${id}`;
      const res = await api.delete(endpoint);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const profileData = {};
      if (role === 'student') {
        profileData.rollNumber = rollNumber;
        profileData.classId = classId;
        profileData.parentEmail = parentEmail;
        profileData.gender = gender;
        profileData.phone = phone;
        profileData.address = address;
      } else if (role === 'teacher') {
        profileData.employeeId = employeeId;
        profileData.phone = phone;
        profileData.designation = designation;
        profileData.department = department;
      }

      if (editingId) {
        // Edit student / teacher
        const endpoint = role === 'student' ? `/students/${editingId}` : `/teachers/${editingId}`;
        const res = await api.put(endpoint, {
          name,
          email,
          profileImage: imagePreview,
          ...profileData
        });
        if (res.data.success) {
          setShowModal(false);
          fetchUsers();
        }
      } else {
        // Register new
        const res = await api.post('/auth/register', {
          name,
          email,
          password,
          role,
          profileImage: imagePreview,
          ...profileData
        });
        if (res.data.success) {
          setShowModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Saving failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Offscreen image analysis is performed dynamically in-memory */}

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> User Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">Add, update, or remove students, teachers, and parents.</p>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Register Account
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder={`Search ${activeTab === 'student' ? 'students by name, roll number, class...' : 'teachers by name, ID, department...'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => {
            setActiveTab('student');
            setSearchQuery('');
          }}
          className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'student'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Students ({filteredStudents.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('teacher');
            setSearchQuery('');
          }}
          className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'teacher'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Teachers ({filteredTeachers.length})
        </button>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : activeTab === 'student' ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4 w-12 text-center">Photo</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Assigned Class</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredStudents.map(s => {
                  const avatarUrl = s.user?.profileImage;
                  return (
                    <tr key={s._id} className="hover:bg-slate-900/20">
                      <td className="p-4 text-center">
                        <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden mx-auto shadow-md">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-100">
                        {s.user?.name || 'N/A'}
                        <div className="text-[10px] text-slate-500 font-normal">{s.user?.email}</div>
                      </td>
                      <td className="p-4 text-slate-300 font-mono">{s.rollNumber}</td>
                      <td className="p-4 text-slate-300">
                        {s.classId ? `${s.classId.className}-${s.classId.section}` : 'Unassigned'}
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(s._id);
                            setName(s.user?.name || '');
                            setEmail(s.user?.email || '');
                            setRole('student');
                            setRollNumber(s.rollNumber);
                            setClassId(s.classId?._id || '');
                            setGender(s.gender || 'Male');
                            setPhone(s.phone || '');
                            setAddress(s.address || '');
                            setImagePreview(s.user?.profileImage || '');
                            setShowModal(true);
                          }}
                          className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, 'student')}
                          className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4 w-12 text-center">Photo</th>
                  <th className="p-4">Name / ID</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Subjects taught</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredTeachers.map(t => {
                  const avatarUrl = t.user?.profileImage;
                  return (
                    <tr key={t._id} className="hover:bg-slate-900/20">
                      <td className="p-4 text-center">
                        <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden mx-auto shadow-md">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-100">
                        {t.user?.name || 'N/A'}
                        <div className="text-[10px] text-slate-500 font-normal">ID: {t.employeeId} | {t.user?.email}</div>
                      </td>
                      <td className="p-4 text-slate-300 font-semibold">{t.department || 'N/A'}</td>
                      <td className="p-4 text-slate-300">{t.designation || 'N/A'}</td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{t.subjects?.join(', ') || 'N/A'}</td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(t._id);
                            setName(t.user?.name || '');
                            setEmail(t.user?.email || '');
                            setRole('teacher');
                            setEmployeeId(t.employeeId);
                            setDepartment(t.department || '');
                            setDesignation(t.designation || '');
                            setPhone(t.phone || '');
                            setImagePreview(t.user?.profileImage || '');
                            setShowModal(true);
                          }}
                          className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id, 'teacher')}
                          className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD / Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-6">
              {editingId ? 'Modify Profile' : 'Register New Account'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Student specific fields */}
              {role === 'student' && (
                <div className="space-y-4 border-t border-slate-800/60 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Roll Number</label>
                      <input
                        type="text"
                        required
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g. ROLL-10A01"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Classroom ID</label>
                      <select
                        required
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Select Class Room</option>
                        {classes.map(c => (
                          <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Parent Contact Email</label>
                      <input
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="e.g. parent1@edutrack.com"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher specific fields */}
              {role === 'teacher' && (
                <div className="space-y-4 border-t border-slate-800/60 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Employee ID</label>
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. EMP018"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department</label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Science / Mathematics"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Senior Faculty"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 555-0100"
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Photo upload section (Shared for both) */}
              <div className="space-y-2 border-t border-slate-800/40 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Profile Photo</span>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
                    {imagePreview ? (
                      <img
                        src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : `http://localhost:5000${imagePreview}`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="w-full py-2 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-[10px] font-semibold text-slate-300 hover:text-slate-100 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    >
                      <Upload className="w-4 h-4 text-slate-400" /> Upload Profile Image
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">Accepts JPG, PNG, and GIF up to 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center"
              >
                {editingId ? 'Update Profile Data' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
