import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { downloadFeeReceipt } from '../../utils/pdfGenerator';
import {
  DollarSign,
  Plus,
  Trash2,
  FileDown,
  CreditCard,
  X,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const FeesPage = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [feeType, setFeeType] = useState('Tuition Fee');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees');
      if (res.data.success) {
        setFees(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fees:', err);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleOpenCreate = () => {
    setStudentId('');
    setAmount('');
    setFeeType('Tuition Fee');
    setDueDate('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await api.delete(`/fees/${id}`);
      if (res.data.success) {
        fetchFees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('Process payment for this student invoice? This will lock payment logs and generate a PDF Receipt.')) return;
    try {
      const res = await api.put(`/fees/${id}/pay`);
      if (res.data.success) {
        // Auto trigger PDF Download
        downloadFeeReceipt(res.data.data);
        fetchFees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        student: studentId,
        amount: parseFloat(amount),
        feeType,
        dueDate
      };

      const res = await api.post('/fees', payload);
      if (res.data.success) {
        setShowModal(false);
        fetchFees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invoicing failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-400" /> Tuition Fees & Billing
          </h2>
          <p className="text-xs text-slate-400 mt-1">Invoice students, view pending balances, and record tuition fee payments.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">
              ${fees.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payments Collected</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-2">
              ${fees.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Outstanding</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-2">
              ${fees.filter(f => f.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                  <th className="p-4">Student Info</th>
                  <th className="p-4">Fee Item Type</th>
                  <th className="p-4">Invoiced Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Billing Status</th>
                  <th className="p-4 text-center">Receipt & Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {fees.map((f) => {
                  const studentName = f.student?.user?.name || 'N/A';
                  const rollNumber = f.student?.rollNumber || 'N/A';
                  return (
                    <tr key={f._id} className="hover:bg-slate-900/20">
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Roll: {rollNumber}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">{f.feeType}</td>
                      <td className="p-4 font-mono font-bold text-slate-200">${f.amount.toFixed(2)}</td>
                      <td className="p-4 text-slate-400">{new Date(f.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        {f.status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            Fully Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Invoice Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        {f.status === 'Pending' ? (
                          <button
                            onClick={() => handlePay(f._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Capture Pay
                          </button>
                        ) : (
                          <button
                            onClick={() => downloadFeeReceipt(f)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-bold cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Print Receipt
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(f._id)}
                          className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Invoice creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-6">Create Student Invoice</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Student</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">Choose Student Account</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.user?.name} (Roll: {s.rollNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fee Item Name</label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option>Tuition Fee</option>
                  <option>Exam Fee</option>
                  <option>Sports Fee</option>
                  <option>Laboratory Fee</option>
                  <option>Library Fee</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1200.00"
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Due Date Limit
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all duration-200"
              >
                Invoiced Student Bill
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
