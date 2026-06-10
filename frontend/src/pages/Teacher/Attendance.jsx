import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import { useFaceApi } from '../../hooks/useFaceApi';
import { downloadAttendanceReport } from '../../utils/pdfGenerator';
import {
  ClipboardCheck,
  Camera,
  Users,
  Search,
  Check,
  X,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCw,
  FileDown
} from 'lucide-react';

const AttendancePage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: status }
  const [faceVerifiedList, setFaceVerifiedList] = useState({}); // { studentId: boolean }
  const [loading, setLoading] = useState(false);

  // Tab: manual | camera
  const [activeMode, setActiveMode] = useState('manual');

  // Camera Settings
  const webcamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('Idle'); // Idle | Loading Models | Scanning | Matched | Error
  const [matchedStudentName, setMatchedStudentName] = useState('');
  const [scanIntervalId, setScanIntervalId] = useState(null);

  const studentsRef = useRef(students);
  const selectedClassIdRef = useRef(selectedClassId);
  const dateRef = useRef(date);

  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { selectedClassIdRef.current = selectedClassId; }, [selectedClassId]);
  useEffect(() => { dateRef.current = date; }, [date]);

  const { modelsLoaded, loadingModels, modelsError, getFaceDescriptor, findBestMatch } = useFaceApi();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && date) {
      fetchClassAttendance();
    } else {
      setStudents([]);
      setAttendanceRecords({});
      setFaceVerifiedList({});
    }
  }, [selectedClassId, date]);

  // Clean up camera intervals on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalId) clearInterval(scanIntervalId);
    };
  }, [scanIntervalId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedClassId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchClassAttendance = async () => {
    setLoading(true);
    try {
      // 1. Fetch all students belonging to the class
      const studentRes = await api.get(`/students?classId=${selectedClassId}`);
      let classStudents = [];
      if (studentRes.data.success) {
        classStudents = studentRes.data.data;
        setStudents(classStudents);
      }

      // 2. Fetch already marked attendance for this class and date
      const attendanceRes = await api.get(`/attendance?classId=${selectedClassId}&date=${date}`);
      
      // Seed default attendance states
      const records = {};
      const verified = {};
      
      // Set default all as Present
      classStudents.forEach(s => {
        records[s._id] = 'Present';
        verified[s._id] = false;
      });

      if (attendanceRes.data.success && attendanceRes.data.data.length > 0) {
        attendanceRes.data.data.forEach(rec => {
          // If record exists, update status
          const studentId = rec.student?._id;
          if (studentId) {
            records[studentId] = rec.status;
            verified[studentId] = rec.faceVerified || false;
          }
        });
      }

      setAttendanceRecords(records);
      setFaceVerifiedList(verified);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: status
    });
    // If status is changed manually, clear face verified state
    if (faceVerifiedList[studentId]) {
      setFaceVerifiedList({
        ...faceVerifiedList,
        [studentId]: false
      });
    }
  };

  const handleSaveManualAttendance = async () => {
    try {
      const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));

      const res = await api.post('/attendance/bulk', {
        classId: selectedClassId,
        date,
        records: recordsArray
      });

      if (res.data.success) {
        alert('Attendance sheet updated successfully!');
        fetchClassAttendance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    if (students.length === 0) return;
    const formattedRecords = students.map(s => ({
      student: s,
      status: attendanceRecords[s._id] || 'Absent',
      faceVerified: faceVerifiedList[s._id] || false,
      markedBy: { name: 'Principal/Teacher' }
    }));
    const className = classes.find(c => c._id === selectedClassId);
    const classLabel = className ? `${className.className}-${className.section}` : 'Class';
    downloadAttendanceReport(classLabel, date, formattedRecords);
  };

  // CAMERA SCANNING IMPLEMENTATION
  const startCameraScanning = () => {
    if (modelsError) {
      alert(`Face Recognition models error: ${modelsError}`);
      return;
    }
    if (!modelsLoaded) {
      alert('Face Recognition models are still loading. Please wait a few seconds.');
      return;
    }
    setIsCameraActive(true);
    setScanningStatus('Scanning');
    setMatchedStudentName('');

    // Setup periodic frame captures (every 2.5 seconds)
    let isProcessingFrame = false;
    const interval = setInterval(async () => {
      if (webcamRef.current && !isProcessingFrame) {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          isProcessingFrame = true;
          try {
            await processCameraFrame(video);
          } catch (err) {
            console.error('Frame processing failed:', err);
          } finally {
            isProcessingFrame = false;
          }
        }
      }
    }, 2500);

    setScanIntervalId(interval);
  };

  const stopCameraScanning = () => {
    setIsCameraActive(false);
    setScanningStatus('Idle');
    if (scanIntervalId) {
      clearInterval(scanIntervalId);
      setScanIntervalId(null);
    }
  };

  // Process video element frame and analyze
  const processCameraFrame = async (videoElement) => {
    try {
      // Detect single face descriptor
      const queryDescriptor = await getFaceDescriptor(videoElement);
      if (!queryDescriptor) {
        setScanningStatus('Scanning: Align your face...');
        return;
      }

      // Match descriptor against students in this class
      const bestMatch = findBestMatch(queryDescriptor, studentsRef.current, 0.55);

      if (bestMatch) {
        const matchedStudent = bestMatch.student;
        const distance = bestMatch.distance;
        
        console.log(`Matched student: ${matchedStudent.user.name} (Dist: ${distance})`);
        setMatchedStudentName(`${matchedStudent.user.name} (${(100 - distance * 100).toFixed(0)}% match)`);
        setScanningStatus('Matched');

        // Call API to mark attendance
        const res = await api.post('/attendance/face', {
          studentId: matchedStudent._id,
          classId: selectedClassIdRef.current,
          date: dateRef.current,
          status: 'Present'
        });

        if (res.data.success) {
          // Update local state instantly
          setAttendanceRecords(prev => ({
            ...prev,
            [matchedStudent._id]: 'Present'
          }));
          setFaceVerifiedList(prev => ({
            ...prev,
            [matchedStudent._id]: true
          }));
          
          // Clear matching notice after 2 seconds
          setTimeout(() => {
            setScanningStatus('Scanning');
            setMatchedStudentName('');
          }, 2000);
        }
      } else {
        setScanningStatus('No registered student match found.');
      }
    } catch (err) {
      console.error('Frame processing failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-indigo-400" /> Attendance Register
            </h2>
            <div className="flex items-center gap-2">
              {loadingModels && (
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 animate-pulse">
                  Loading AI Models...
                </span>
              )}
              {modelsLoaded && (
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400">
                  AI Models Online
                </span>
              )}
              {modelsError && (
                <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-full text-[10px] font-bold text-rose-400" title={modelsError}>
                  Models Error
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">Mark attendance manually or launch automated webcam face scanning.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Class select */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full sm:w-40 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
            ))}
          </select>

          {/* Date select */}
          <div className="relative w-full sm:w-36">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={students.length === 0}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Download PDF Attendance"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modes tab */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => {
            stopCameraScanning();
            setActiveMode('manual');
          }}
          className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
            activeMode === 'manual'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Manual Checklist
        </button>
        <button
          onClick={() => {
            setActiveMode('camera');
            startCameraScanning();
          }}
          className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeMode === 'camera'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" /> Face Recognition webcam
        </button>
      </div>

      {/* Active Panel View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      ) : activeMode === 'manual' ? (
        /* MANUAL VIEW */
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest font-semibold">
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4 text-center">Attendance Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {students.map((s) => {
                    const status = attendanceRecords[s._id] || 'Absent';
                    const verified = faceVerifiedList[s._id] || false;
                    return (
                      <tr key={s._id} className="hover:bg-slate-900/20">
                        <td className="p-4 font-semibold text-slate-100">{s.user?.name}</td>
                        <td className="p-4 font-mono text-slate-300">{s.rollNumber}</td>
                        <td className="p-4">
                          {verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              Face Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-500">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="p-4 flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleStatusChange(s._id, 'Present')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              status === 'Present'
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(s._id, 'Late')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              status === 'Late'
                                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/10'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(s._id, 'Absent')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              status === 'Absent'
                                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/10'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveManualAttendance}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Save Attendance Sheet
            </button>
          </div>
        </div>
      ) : (
        /* CAMERA VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Webcam stream panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
              {isCameraActive ? (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                  />
                  {/* Bounding box feedback layout */}
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 pointer-events-none animate-pulse"></div>
                  
                  {/* Scanning sweep line */}
                  <div className="absolute left-0 w-full h-1 bg-indigo-500/30 blur-[1px] animate-sweep pointer-events-none"></div>
                </>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 bg-slate-950 border border-slate-800 text-slate-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-400 text-sm">Webcam is currently disabled</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Activate the webcam above to automatically identify students and log present marks.</p>
                </div>
              )}

              {/* Status overlay */}
              {isCameraActive && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center p-4 bg-slate-950/80 backdrop-blur-md border border-slate-850 rounded-2xl">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanner Status</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> {scanningStatus}
                    </div>
                  </div>

                  {matchedStudentName && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">MATCH FOUND!</div>
                      <div className="text-xs font-black text-white mt-0.5">{matchedStudentName}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {isCameraActive ? (
                <button
                  onClick={stopCameraScanning}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-rose-600/10 cursor-pointer transition-all duration-200"
                >
                  Turn Camera Offline
                </button>
              ) : (
                <button
                  onClick={startCameraScanning}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-indigo-600/10 cursor-pointer transition-all duration-200"
                >
                  Turn Camera Online
                </button>
              )}
            </div>
          </div>

          {/* Verification log sidebar */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl h-[55vh] flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Users className="w-4 h-4 text-indigo-400" /> Room Roster ({students.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {students.map((s) => {
                const verified = faceVerifiedList[s._id] || false;
                const status = attendanceRecords[s._id] || 'Absent';
                return (
                  <div key={s._id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{s.user?.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Roll: {s.rollNumber}</div>
                    </div>

                    <div>
                      {verified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 shadow-inner">
                          <Check className="w-3 h-3" /> Present (Face)
                        </span>
                      ) : status === 'Present' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          Present (Manual)
                        </span>
                      ) : status === 'Late' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          Late
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          Absent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
