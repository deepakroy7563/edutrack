import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { School, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [school, setSchool] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await api.get('/school');
        if (res.data.success) {
          setSchool(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching school details for login:', err);
      }
    };
    fetchSchool();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* School Banner Background Overlay */}
      {school && school.banner && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${school.banner.startsWith('data:') || school.banner.startsWith('http') ? school.banner : `http://localhost:5000${school.banner}`})` }}
        />
      )}

      <div className="w-full max-w-md z-10">
        {/* Branding Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/5 mb-4 overflow-hidden p-2">
            {school && school.logo ? (
              <img
                src={school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`}
                alt="Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <School className="w-10 h-10 text-indigo-400" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent text-center">
            {school ? `Welcome to ${school.name}` : 'Welcome to EduTrack'}
          </h1>
          <p className="text-slate-400 mt-2 text-xs text-center px-4 leading-relaxed max-w-sm">
            {school?.description || 'School Management & Automated Face Recognition Attendance'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. admin@edutrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing you in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Login Info */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              Developer Demo Accounts
            </h3>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div><strong className="text-slate-300">Admin:</strong> admin@edutrack.com / password123</div>
              <div><strong className="text-slate-300">Teacher:</strong> john.miller@edutrack.com / password123</div>
              <div><strong className="text-slate-300">Student:</strong> student1@edutrack.com / password123</div>
              <div><strong className="text-slate-300">Parent:</strong> parent1@edutrack.com / password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
