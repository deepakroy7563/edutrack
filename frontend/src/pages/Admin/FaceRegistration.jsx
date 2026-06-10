const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../../utils/api';
import { useFaceApi } from '../../hooks/useFaceApi';
import { 
  Camera, 
  UserCheck, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Smile, 
  Eye, 
  ArrowRight,
  ArrowLeft,
  ChevronsRight
} from 'lucide-react';

const REGISTRATION_STEPS = [
  { id: 0, label: 'Look Straight', instruction: 'Look directly at the camera with a neutral face.', icon: Camera, validator: (m) => m && m.headPosition === 'Center' && !m.isSmiling },
  { id: 1, label: 'Smile!', instruction: 'Give a big smile to verify liveness.', icon: Smile, validator: (m) => m && m.isSmiling },
  { id: 2, label: 'Blink!', instruction: 'Blink your eyes to verify liveness.', icon: Eye, validator: (m) => m && m.isBlinking },
  { id: 3, label: 'Turn Left', instruction: 'Turn your head slightly to the left.', icon: ChevronsRight, validator: (m) => m && m.headPosition === 'Left' },
  { id: 4, label: 'Turn Right', instruction: 'Turn your head slightly to the right.', icon: ChevronsRight, validator: (m) => m && m.headPosition === 'Right' }
];

const getBackendUrl = () => {
  const backendApiUrl = import.meta.env.VITE_API_URL || '';
  return backendApiUrl.endsWith('/api') ? backendApiUrl.slice(0, -4) : 'http://localhost:5000';
};

const FaceRegistration = () => {
  const [role, setRole] = useState('student'); // student | teacher
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserObj, setSelectedUserObj] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Liveness real-time feed
  const [livenessStatus, setLivenessStatus] = useState('Position your face');
  const [smileProgress, setSmileProgress] = useState(0);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [headPos, setHeadPos] = useState('Center');

  const webcamRef = useRef(null);
  const loopRef = useRef(null);
  
  const currentStepRef = useRef(currentStep);
  const blinkDetectedRef = useRef(blinkDetected);

  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { blinkDetectedRef.current = blinkDetected; }, [blinkDetected]);

  // Handle final step completion side effects cleanly
  useEffect(() => {
    if (capturedDescriptors.length === REGISTRATION_STEPS.length) {
      stopCamera();
      saveDescriptorToDatabase(capturedDescriptors);
    }
  }, [capturedDescriptors]);

  const { modelsLoaded, loadingModels, modelsError, getLivenessMetrics } = useFaceApi();

  useEffect(() => {
    fetchUsers();
    return () => {
      stopLivenessLoop();
    };
  }, [role]);

  useEffect(() => {
    if (selectedUserId) {
      const found = usersList.find(u => u._id === selectedUserId);
      setSelectedUserObj(found || null);
      // Reset registration
      setCurrentStep(0);
      setCapturedDescriptors([]);
      setRegistrationSuccess(false);
    } else {
      setSelectedUserObj(null);
    }
  }, [selectedUserId, usersList]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const endpoint = role === 'student' ? '/students' : '/teachers';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setUsersList(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedUserId(res.data.data[0]._id);
        } else {
          setSelectedUserId('');
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startCamera = () => {
    if (modelsError) {
      alert(`Error loading face recognition models: ${modelsError}`);
      return;
    }
    if (!modelsLoaded) {
      alert('Models are still loading. Please wait.');
      return;
    }
    setIsCameraActive(true);
    setCurrentStep(0);
    setCapturedDescriptors([]);
    setRegistrationSuccess(false);
    startLivenessLoop();
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    stopLivenessLoop();
  };

  const startLivenessLoop = () => {
    if (loopRef.current) return;

    let isProcessing = false;
    let preBlinkState = false; // State machine to catch a full blink

    loopRef.current = setInterval(async () => {
      if (webcamRef.current && !isProcessing) {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          isProcessing = true;
          try {
            const metrics = await getLivenessMetrics(video);
            if (metrics) {
              setSmileProgress(Math.min(100, Math.max(0, Math.round((metrics.smileRatio / 0.38) * 100))));
              setHeadPos(metrics.headPosition);

              // Eye Aspect Ratio check for blink state machine
              if (metrics.ear < 0.20) {
                preBlinkState = true;
              } else if (metrics.ear > 0.25 && preBlinkState) {
                // blink registered!
                setBlinkDetected(true);
                preBlinkState = false;
                setTimeout(() => setBlinkDetected(false), 1500);
              }

              // Evaluate current step validator
              const stepInfo = REGISTRATION_STEPS[currentStepRef.current];
              let stepCompleted = false;

              if (stepInfo.id === 2) {
                // Blink requires checking the blink flag
                if (blinkDetectedRef.current || metrics.ear < 0.20) {
                  stepCompleted = true;
                }
              } else {
                stepCompleted = stepInfo.validator(metrics);
              }

              if (stepCompleted) {
                // Capture descriptor
                const descriptor = metrics.detection?.descriptor;
                if (descriptor) {
                  const descArray = Array.from(descriptor);
                  setCapturedDescriptors(prev => [...prev, descArray]);
                  if (currentStepRef.current < REGISTRATION_STEPS.length - 1) {
                    setCurrentStep(c => c + 1);
                  }
                }
              }
              setLivenessStatus(`Eye Ratio: ${metrics.ear.toFixed(2)} | Smile: ${(metrics.smileRatio * 100).toFixed(0)}% | Head: ${metrics.headPosition}`);
            } else {
              setLivenessStatus('Align your face in the box');
            }
          } catch (err) {
            console.error('Error during registration liveness loop:', err);
            setLivenessStatus('Scanner processing error');
          } finally {
            isProcessing = false;
          }
        }
      }
    }, 400);
  };

  const stopLivenessLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  const saveDescriptorToDatabase = async (descriptors) => {
    if (descriptors.length === 0) return;
    setRegistering(true);
    try {
      // Calculate averaged embedding descriptor (128 floats vector)
      const avgDescriptor = new Array(128).fill(0);
      for (let i = 0; i < 128; i++) {
        let sum = 0;
        descriptors.forEach(desc => {
          sum += desc[i];
        });
        avgDescriptor[i] = sum / descriptors.length;
      }

      // Save to server
      const endpoint = role === 'student' 
        ? `/students/${selectedUserId}` 
        : `/teachers/${selectedUserId}`;
        
      const res = await api.put(endpoint, {
        faceDescriptor: avgDescriptor,
        // Also capture the Neutral photo as profile image!
        profileImage: webcamRef.current ? webcamRef.current.getScreenshot() : undefined
      });

      if (res.data.success) {
        setRegistrationSuccess(true);
        setIsCameraActive(false);
      }
    } catch (error) {
      console.error('Save descriptor failed:', error);
      alert('Failed to save face embedding to database.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-400" /> Biometric Face Registration
            </h2>
            <p className="text-xs text-slate-400 mt-1">Enroll teachers and students by capturing multiple pose embeddings and validating liveness.</p>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            {loadingModels && (
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 animate-pulse">
                Loading AI Models...
              </span>
            )}
            {modelsLoaded && (
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400">
                AI Models Online
              </span>
            )}
            {modelsError && (
              <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-[10px] font-bold text-rose-400" title={modelsError}>
                Models Error: {modelsError}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection side panel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl h-fit">
          <h3 className="text-sm font-bold text-slate-200">1. Select Candidate</h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    setRole('student');
                    setSelectedUserId('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    role === 'student'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => {
                    setRole('teacher');
                    setSelectedUserId('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Name</label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Fetching directory...
                </div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.user?.name} {role === 'student' ? `(Roll: ${u.rollNumber})` : `(Dept: ${u.department})`}
                    </option>
                  ))}
                  {usersList.length === 0 && <option value="">No candidates available</option>}
                </select>
              )}
            </div>
          </div>

          {selectedUserObj && (
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center">
                  {selectedUserObj.user?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{selectedUserObj.user?.name}</h4>
                  <p className="text-[10px] text-slate-500">{selectedUserObj.user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-400">
                <div>
                  <strong>Biometric Status:</strong>
                </div>
                <div className="text-right">
                  {selectedUserObj.faceDescriptor ? (
                    <span className="text-emerald-400 font-bold">Registered</span>
                  ) : (
                    <span className="text-amber-400 font-bold">Missing</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Webcam scanning / execution panel */}
        <div className="lg:col-span-2 space-y-4">
          {isCameraActive ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
              {/* Guided steps visualizer */}
              <div className="grid grid-cols-5 gap-2 border-b border-slate-800 pb-4">
                {REGISTRATION_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = capturedDescriptors.length > step.id;
                  const isActive = currentStep === step.id;
                  return (
                    <div 
                      key={step.id} 
                      className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : isActive 
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 scale-105 shadow-md shadow-indigo-500/5' 
                          : 'bg-slate-950/20 border-transparent text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[9px] font-bold hidden sm:inline">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="bg-indigo-600/15 border border-indigo-500/20 p-3.5 rounded-2xl text-center">
                <h4 className="font-bold text-xs text-indigo-300">Step {currentStep + 1}: {REGISTRATION_STEPS[currentStep].label}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{REGISTRATION_STEPS[currentStep].instruction}</p>
              </div>

              {/* Live Webcam Frame */}
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover scale-x-[-1]"
                  videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                />
                
                {/* Visual guideline boxes */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 pointer-events-none"></div>
                <div className="absolute w-44 h-44 border-2 border-indigo-500/40 rounded-full pointer-events-none animate-pulse"></div>

                {/* Status Overlays */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-850 p-3 rounded-xl flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <div>Status: {livenessStatus}</div>
                  <div className="flex gap-2">
                    <span>Head: <strong className="text-slate-200">{headPos}</strong></span>
                    {currentStep === 1 && <span>Smile: <strong className="text-indigo-400">{smileProgress}%</strong></span>}
                    {currentStep === 2 && <span>Blink: <strong className={blinkDetected ? "text-emerald-400" : "text-amber-400"}>{blinkDetected ? "YES" : "NO"}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={stopCamera}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl flex flex-col items-center justify-center min-h-[45vh]">
              {registrationSuccess ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-100">Face Profile Synced!</h3>
                    <p className="text-xs text-slate-400 max-w-sm">The 128-dimensional face embedding descriptor was calculated and stored in MongoDB securely.</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-all cursor-pointer"
                  >
                    Register Another Candidate
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-950 border border-slate-800 text-slate-500 rounded-3xl flex items-center justify-center shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-350">Biometric Verification Offline</h3>
                    <p className="text-xs text-slate-500 max-w-sm">Select a candidate from the left panel and click start to open the liveness webcam registration wizard.</p>
                  </div>
                  <button
                    onClick={startCamera}
                    disabled={!selectedUserId}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Start Registration Wizard
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
