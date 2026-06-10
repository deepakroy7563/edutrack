import React from 'react';
import { Link } from 'react-router-dom';
import { School, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative font-sans">
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="z-10 text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
          <School className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-6xl font-black text-slate-100">404</h1>
        <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The dashboard link or portal page you are looking for might have been moved or is currently offline.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
