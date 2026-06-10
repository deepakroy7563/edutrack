import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import {
  School,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  FileText
} from 'lucide-react';

const SchoolInfo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Form Fields State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [principal, setPrincipal] = useState('');
  const [established, setEstablished] = useState('');
  const [description, setDescription] = useState('');

  // Logo and Banner states
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const logoInputRef = useRef();
  const bannerInputRef = useRef();

  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  const fetchSchoolDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setName(data.name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setPrincipal(data.principal || '');
        setEstablished(data.established || '');
        setDescription(data.description || '');
        setLogoPreview(data.logo || '');
        setBannerPreview(data.banner || '');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching school profile:', err);
      showStatus('error', 'Failed to retrieve school settings from database.');
      setLoading(false);
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => {
      setStatus({ type: '', message: '' });
    }, 5000);
  };

  const validateImage = (file) => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showStatus('error', 'Invalid file type. Only PNG, JPG, JPEG, and WEBP images are accepted.');
      return false;
    }
    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      showStatus('error', 'Image file is too large. Maximum allowed size is 5MB.');
      return false;
    }
    return true;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateImage(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateImage(file)) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBannerPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      showStatus('error', 'School Name and Location Address are required fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/school', {
        name,
        address,
        phone,
        email,
        principal,
        established,
        description,
        logo: logoPreview,
        banner: bannerPreview
      });

      if (res.data.success) {
        showStatus('success', 'School Profile and branding details successfully updated.');
        // Refresh to apply changes to layouts/headers
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      setSaving(false);
    } catch (err) {
      console.error('Error updating school details:', err);
      showStatus('error', err.response?.data?.message || 'Failed to update school settings.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const renderedLogo = logoPreview
    ? (logoPreview.startsWith('data:') || logoPreview.startsWith('http') ? logoPreview : `http://localhost:5000${logoPreview}`)
    : '';

  const renderedBanner = bannerPreview
    ? (bannerPreview.startsWith('data:') || bannerPreview.startsWith('http') ? bannerPreview : `http://localhost:5000${bannerPreview}`)
    : '';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <School className="w-6 h-6 text-indigo-400" /> School Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure your institution's profile, contact details, principal sign-off, and portal branding.</p>
      </div>

      {/* Notifications */}
      {status.message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fadeIn transition-all ${
          status.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-semibold">{status.message}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-800/60">
          
          {/* Banner & Logo Cover Preview */}
          <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden">
            {renderedBanner ? (
              <img src={renderedBanner} alt="School Banner" className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="text-slate-700 flex flex-col items-center gap-2 text-center p-4">
                <ImageIcon className="w-10 h-10" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">No Cover Banner Uploaded</span>
              </div>
            )}
            
            {/* Absolute Logo overlay */}
            <div className="absolute -bottom-10 left-8 w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-xl p-1">
              <div className="w-full h-full rounded-xl bg-slate-950/80 border border-slate-800/50 flex items-center justify-center overflow-hidden">
                {renderedLogo ? (
                  <img src={renderedLogo} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                  <School className="w-8 h-8 text-slate-600" />
                )}
              </div>
            </div>

            {/* Quick Actions top-right */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() => bannerInputRef.current.click()}
                className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800/95 border border-slate-700/80 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Banner
              </button>
              <button
                type="button"
                onClick={() => logoInputRef.current.click()}
                className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800/95 border border-slate-700/80 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Logo
              </button>
              
              <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoChange} className="hidden" />
              <input type="file" accept="image/*" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 pt-16 space-y-6">
            
            {/* Primary Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">Institution Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-slate-500" /> School Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Oakridge International School"
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Principal
                    </label>
                    <input
                      type="text"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      placeholder="e.g. Dr. A. K. Sharma"
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Established Year
                    </label>
                    <input
                      type="text"
                      value={established}
                      onChange={(e) => setEstablished(e.target.value)}
                      placeholder="e.g. 1995"
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Description / School Motto
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief vision, mission statement, or bio details of the school..."
                  className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">Contact & Location</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> Administrative Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@school.com"
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Campus Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot No. 12, Knowledge Park, Sector 5, New Delhi"
                  className="w-full p-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Actions panel */}
            <div className="pt-6 border-t border-slate-800/60 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>Save School Settings</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolInfo;
