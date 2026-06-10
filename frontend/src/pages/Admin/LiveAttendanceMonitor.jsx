import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import { useFaceApi } from '../../hooks/useFaceApi';
import { 
  Camera, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Users, 
  RefreshCw, 
  Activity, 
  Smile, 
  ShieldCheck,
  Zap,
  Globe,
  Monitor
} from 'lucide-react';

const LiveAttendanceMonitor = () => {
  const [scanType, setScanType] = useState('student'); // student | teacher
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Master lists
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Logs of checkins today
  const [checkInLogs, setCheckInLogs] = useState([]);
  const [livenessStatus, setLivenessStatus] = useState('Idle');
  const [scannerFeedback, setScannerFeedback] = useState('System ready. Activate camera.');
  const [matchedUser, setMatchedUser] = useState(null);
  
  // Liveness constraints
  const [promptAction, setPromptAction] = useState('Blink'); // Action we are asking they do: 'Blink' or 'Smile' or 'Look Center'
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);

  const webcamRef = useRef(null);
  const monitorLoopRef = useRef(null);

  const promptActionRef = useRef(promptAction);
  const blinkDetectedRef = useRef(blinkDetected);
  const smileDetectedRef = useRef(smileDetected);
  const scanTypeRef = useRef(scanType);
  const studentsRef = useRef(students);
  const teachersRef = useRef(teachers);
  const selectedClassIdRef = useRef(selectedClassId);

  useEffect(() => { promptActionRef.current = promptAction; }, [promptAction]);
  useEffect(() => { blinkDetectedRef.current = blinkDetected; }, [blinkDetected]);
  useEffect(() => { smileDetectedRef.current = smileDetected; }, [smileDetected]);
  useEffect(() => { scanTypeRef.current = scanType; }, [scanType]);
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { teachersRef.current = teachers; }, [teachers]);
  useEffect(() => { selectedClassIdRef.current = selectedClassId; }, [selectedClassId]);

  const { modelsLoaded, loadingModels, modelsError, getLivenessMetrics, findBestMatch } = useFaceApi();

  useEffect(() => {
    fetchClassrooms();
    fetchRosters();
  }, []);

  useEffect(() => {
    if (scanType === 'student' && selectedClassId) {
      fetchRosters();
    }
  }, [scanType, selectedClassId]);

  // Cleanup loop
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedClassId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error classrooms:', err);
    }
  };

  const fetchRosters = async () => {
    try {
      if (scanType === 'student') {
        const endpoint = selectedClassId ? `/students?classId=${selectedClassId}` : '/students';
        const res = await api.get(endpoint);
        if (res.data.success) {
          setStudents(res.data.data);
        }
      } else {
        const res = await api.get('/teachers');
        if (res.data.success) {
          setTeachers(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching roster:', err);
    }
  };

  const startScanner = () => {
    if (modelsError) {
      alert(`Error loading face recognition models: ${modelsError}`);
      return;
    }
    if (!modelsLoaded) {
      alert('Models are still loading.');
      return;
    }
    setIsCameraActive(true);
    setScannerFeedback('Scanner Online. Analyzing frames...');
    setMatchedUser(null);
    startMonitorLoop();
  };

  const stopScanner = () => {
    setIsCameraActive(false);
    setLivenessStatus('Idle');
    setScannerFeedback('Scanner offline.');
    setMatchedUser(null);
    if (monitorLoopRef.current) {
      clearInterval(monitorLoopRef.current);
      if (monitorLoopRef.current._promptInterval) {
        clearInterval(monitorLoopRef.current._promptInterval);
      }
      monitorLoopRef.current = null;
    }
  };

  const startMonitorLoop = () => {
    if (monitorLoopRef.current) return;

    let isProcessing = false;
    let preBlinkState = false;
    let successThrottle = false; // Prevent double-marking same face instantly

    // Randomize liveness prompt every 8 seconds
    const promptInterval = setInterval(() => {
      setPromptAction(prev => prev === 'Blink' ? 'Smile' : 'Blink');
    }, 8000);

    monitorLoopRef.current = setInterval(async () => {
      if (webcamRef.current && !isProcessing && !successThrottle) {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          isProcessing = true;
          try {
            const metrics = await getLivenessMetrics(video);
            if (metrics) {
              setLivenessStatus(`EAR: ${metrics.ear.toFixed(2)} | MAR: ${metrics.smileRatio.toFixed(2)}`);

              // Blink logic
              if (metrics.ear < 0.20) {
                preBlinkState = true;
              } else if (metrics.ear > 0.25 && preBlinkState) {
                setBlinkDetected(true);
                preBlinkState = false;
                setTimeout(() => setBlinkDetected(false), 2000);
              }

              // Smile logic
              if (metrics.isSmiling) {
                setSmileDetected(true);
                setTimeout(() => setSmileDetected(false), 2000);
              }

              // Validate against currently prompted action
              let isLivenessVerified = false;
              if (promptActionRef.current === 'Blink' && (blinkDetectedRef.current || metrics.ear < 0.20)) {
                isLivenessVerified = true;
              } else if (promptActionRef.current === 'Smile' && (metrics.isSmiling || smileDetectedRef.current)) {
                isLivenessVerified = true;
              }

              if (isLivenessVerified) {
                // Perform matching
                const descriptor = metrics.detection?.descriptor;
                if (descriptor) {
                  const descArray = Array.from(descriptor);
                  const roster = scanTypeRef.current === 'student' ? studentsRef.current : teachersRef.current;
                  const match = findBestMatch(descArray, roster, 0.55);

                  if (match) {
                    const matchedRecord = match.record;
                    const confidence = (1 - match.distance) * 100;
                    
                    // Capture snapshot only on successful match
                    const screenshot = webcamRef.current.getScreenshot();

                    // Throttle scanner and trigger api save
                    successThrottle = true;
                    setMatchedUser({
                      name: matchedRecord.user?.name || 'User',
                      role: scanTypeRef.current,
                      id: scanTypeRef.current === 'student' ? matchedRecord.rollNumber : matchedRecord.employeeId,
                      confidence: confidence.toFixed(1),
                      img: screenshot || ''
                    });
                    setScannerFeedback(`Matching Confirmed: ${matchedRecord.user?.name}`);

                    await logBiometricAttendance(matchedRecord, confidence);

                    // Resume scanning after 4 seconds
                    setTimeout(() => {
                      setMatchedUser(null);
                      setScannerFeedback('Scanner Online. Ready for next scan...');
                      successThrottle = false;
                    }, 4000);
                  } else {
                    setScannerFeedback('Unknown Face detected - Biometric check rejected.');
                  }
                }
              } else {
                setScannerFeedback(`Verify Liveness: Please ${promptActionRef.current} to confirm.`);
              }
            } else {
              setScannerFeedback('No Face Detected in scanner bounds.');
            }
          } catch (err) {
            console.error('Error in gate scanner loop:', err);
            setScannerFeedback('Scanner processing error.');
          } finally {
            isProcessing = false;
          }
        }
      }
    }, 450);

    // Save prompt interval to clear on stop
    monitorLoopRef.current._promptInterval = promptInterval;
  };

  const logBiometricAttendance = async (record, confidence) => {
    try {
      const currentScanType = scanTypeRef.current;
      const currentClassId = selectedClassIdRef.current;
      const endpoint = currentScanType === 'student' ? '/attendance/student/face' : '/attendance/teacher/face';
      const payload = currentScanType === 'student' ? {
        studentId: record._id,
        classId: currentClassId,
        faceConfidence: parseFloat((confidence / 100).toFixed(2)),
        location: 'Admin Gate Monitor'
      } : {
        teacherId: record._id,
        faceConfidence: parseFloat((confidence / 100).toFixed(2)),
        location: 'Admin Gate Monitor'
      };

      const res = await api.post(endpoint, payload);
      if (res.data.success) {
        const checkinInfo = {
          name: record.user.name,
          role: currentScanType,
          id: currentScanType === 'student' ? record.rollNumber : record.employeeId,
          timestamp: new Date().toLocaleTimeString(),
          status: res.data.data?.attendanceStatus || 'Present',
          type: res.data.type || 'check-in',
          workingHours: res.data.data?.totalHours || null
        };
        setCheckInLogs(prev => [checkinInfo, ...prev].slice(0, 10)); // Top 10
      }
    } catch (err) {
      console.error('Logging attendance failed:', err);
      setScannerFeedback(err.response?.data?.message || 'Biometric Logging Failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Monitor className="w-6 h-6 text-indigo-400 animate-pulse" /> Live Face Attendance Monitor
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
          <p className="text-xs text-slate-400 mt-1">Real-time school gate scanner enforcing dynamic liveness and identity mapping.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Scan role toggle */}
          <select
            value={scanType}
            onChange={(e) => {
              setScanType(e.target.value);
              stopScanner();
            }}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
          >
            <option value="student">Scan Student Check-in</option>
            <option value="teacher">Scan Teacher Check-in/Out</option>
          </select>

          {/* Classroom filter if student scan */}
          {scanType === 'student' && (
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                stopScanner();
              }}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
            >
              <option value="">All Classrooms</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className} - {c.section}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
            {isCameraActive ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover scale-x-[-1]"
                  videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                />

                {/* Bounding box guide overlays */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/10 pointer-events-none"></div>
                <div className="absolute w-52 h-52 border-2 border-dashed border-indigo-500/30 rounded-3xl pointer-events-none animate-pulse"></div>

                {/* Sweeping scan bar */}
                <div className="absolute left-0 w-full h-1 bg-indigo-500/40 blur-[2px] animate-sweep pointer-events-none"></div>

                {/* Match Popup */}
                {matchedUser && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden shadow-lg shadow-emerald-500/20">
                      <img src={matchedUser.img} alt="Snapshot" className="w-full h-full object-cover scale-x-[-1]" />
                    </div>
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        MATCH CONFIRMED ({matchedUser.confidence}%)
                      </span>
                      <h3 className="text-xl font-black text-white">{matchedUser.name}</h3>
                      <p className="text-xs text-slate-400">ID: {matchedUser.id} | Role: {matchedUser.role.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" /> BIOMETRICS VERIFIED
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 text-slate-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-350 text-sm">Gate Camera Offline</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Activate the webcam interface to launch scanning. The scanner performs instant geometric checks for blink and smile.</p>
                </div>
              </div>
            )}

            {/* Prompt Actions */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Prompt:</span>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-lg animate-pulse uppercase tracking-wider text-[10px]">
                    {promptAction === 'Blink' ? 'Blink Eyes!' : 'Smile Big!'}
                  </span>
                </div>

                <div className="text-[9px] font-mono text-slate-500">
                  LIVENESS CHECK ACTIVE
                </div>
              </div>
            )}

            {/* Feedback footer */}
            {isCameraActive && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <div>Feedback: {scannerFeedback}</div>
                <div>{livenessStatus}</div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {isCameraActive ? (
              <button
                onClick={stopScanner}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-rose-600/10 cursor-pointer transition-all duration-200"
              >
                Deactivate Scanner
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-xs shadow-lg shadow-indigo-600/10 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Start Gate Scanner
              </button>
            )}
          </div>
        </div>

        {/* Live Logs side panel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[55vh]">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-4 border-b border-slate-800 shrink-0">
            <Users className="w-4 h-4 text-indigo-400" /> Scanner Registry Logs
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
            {checkInLogs.map((log, index) => (
              <div key={index} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs hover:border-slate-700/60 transition-all">
                <div className="space-y-1">
                  <div className="font-bold text-slate-100">{log.name}</div>
                  <div className="text-[10px] text-slate-500">ID: {log.id} | {log.timestamp}</div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    log.status === 'Present' 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : log.status === 'Late'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-450'
                  }`}>
                    {log.type === 'check-out' ? `Checked Out (${log.workingHours}h)` : log.status}
                  </span>
                </div>
              </div>
            ))}

            {checkInLogs.length === 0 && (
              <div className="text-center py-20 text-xs text-slate-650">No check-in scans registered today yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAttendanceMonitor;
