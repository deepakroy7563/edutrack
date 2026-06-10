import { useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

// Global states to cache face-api.js loading across all hook instances
let globalModelsLoaded = false;
let globalLoadingPromise = null;
let globalModelsError = null;

export const useFaceApi = () => {
  const [modelsLoaded, setModelsLoaded] = useState(globalModelsLoaded);
  const [loadingModels, setLoadingModels] = useState(!!globalLoadingPromise && !globalModelsLoaded);
  const [modelsError, setModelsError] = useState(globalModelsError);

  useEffect(() => {
    if (globalModelsLoaded) {
      setModelsLoaded(true);
      setLoadingModels(false);
      return;
    }

    if (!globalLoadingPromise) {
      globalLoadingPromise = (async () => {
        globalModelsError = null;
        try {
          let MODEL_URL = '/models';
          try {
            console.log('Testing if models are available on frontend server...');
            const testRes = await fetch('/models/face_recognition_model-weights_manifest.json');
            if (!testRes.ok) throw new Error('Fetch failed');
            await testRes.json();
            console.log('Models confirmed on frontend server.');
            MODEL_URL = '/models';
          } catch (err) {
            console.warn('Frontend static models not found or returned invalid JSON. Falling back to backend server...', err);
            MODEL_URL = typeof window !== 'undefined'
              ? `${window.location.protocol}//${window.location.hostname}:5000/models`
              : 'http://localhost:5000/models';
          }

          console.log('Loading face-api.js models from:', MODEL_URL);
          
          // Attempt to use WebGL backend first for fast hardware acceleration, fallback to CPU if WebGL fails
          if (faceapi.tf && typeof faceapi.tf.setBackend === 'function') {
            try {
              console.log('Setting TFJS backend to WebGL...');
              await faceapi.tf.setBackend('webgl');
              console.log('TFJS backend initialized with WebGL:', faceapi.tf.getBackend());
            } catch (tfErr) {
              console.warn('WebGL backend failed, falling back to CPU backend...', tfErr);
              try {
                await faceapi.tf.setBackend('cpu');
                console.log('TFJS backend initialized with CPU:', faceapi.tf.getBackend());
              } catch (cpuErr) {
                console.error('Failed to initialize CPU backend:', cpuErr);
              }
            }
          }

          console.log('Loading ssdMobilenetv1...');
          await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
          console.log('ssdMobilenetv1 loaded. Loading faceLandmark68Net...');
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          console.log('faceLandmark68Net loaded. Loading faceRecognitionNet...');
          await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          
          console.log('All face-api.js models loaded successfully!');
          globalModelsLoaded = true;
          return true;
        } catch (error) {
          console.error('Error loading face-api.js models:', error);
          globalModelsError = error.message || String(error);
          globalLoadingPromise = null; // reset to allow retry
          throw error;
        }
      })();
    }

    let isMounted = true;
    setLoadingModels(true);

    globalLoadingPromise.then(() => {
      if (isMounted) {
        setModelsLoaded(true);
        setLoadingModels(false);
        setModelsError(null);
      }
    }).catch((err) => {
      if (isMounted) {
        setModelsLoaded(false);
        setLoadingModels(false);
        setModelsError(err.message || String(err));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Extract face descriptor from an image element or canvas
  const getFaceDescriptor = async (inputElement) => {
    if (!modelsLoaded) {
      console.warn('face-api.js models are not yet loaded.');
      return null;
    }

    try {
      // Find single face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(inputElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return Array.from(detection.descriptor);
    } catch (error) {
      console.error('Error extracting face descriptor:', error);
      return null;
    }
  };

  // Detect liveness landmarks (EAR, Smile, Head Turn)
  const getLivenessMetrics = async (inputElement) => {
    if (!modelsLoaded) return null;

    try {
      const detection = await faceapi
        .detectSingleFace(inputElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;

      const landmarks = detection.landmarks.positions;

      // 1. EAR (Eye Aspect Ratio) for Blink Detection
      const getEAR = (eyePoints) => {
        const p0 = eyePoints[0];
        const p1 = eyePoints[1];
        const p2 = eyePoints[2];
        const p3 = eyePoints[3];
        const p4 = eyePoints[4];
        const p5 = eyePoints[5];

        const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        return (dist(p1, p5) + dist(p2, p4)) / (2.0 * dist(p0, p3));
      };

      const leftEye = landmarks.slice(36, 42);
      const rightEye = landmarks.slice(42, 48);

      const leftEAR = getEAR(leftEye);
      const rightEAR = getEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      // 2. Smile Ratio (Mouth Width vs Face Width)
      const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
      const mouthWidth = dist(landmarks[48], landmarks[54]);
      const faceWidth = dist(landmarks[0], landmarks[16]);
      const smileRatio = mouthWidth / faceWidth;

      // 3. Head Turn Ratio (Yaw)
      const noseTip = landmarks[30];
      const leftCheek = landmarks[2];
      const rightCheek = landmarks[14];
      const distToLeft = dist(noseTip, leftCheek);
      const distToRight = dist(noseTip, rightCheek);
      const headTurnRatio = distToLeft / distToRight;

      let headPosition = 'Center';
      if (headTurnRatio < 0.5) headPosition = 'Left';
      else if (headTurnRatio > 2.0) headPosition = 'Right';

      return {
        ear: avgEAR,
        smileRatio,
        headTurnRatio,
        headPosition,
        isBlinking: avgEAR < 0.20,
        isSmiling: smileRatio > 0.38,
        detection // return raw detection for drawing bounding boxes if needed
      };
    } catch (error) {
      console.error('Error analyzing liveness metrics:', error);
      return null;
    }
  };

  // Match a descriptor against a list of student/teacher records
  const findBestMatch = (queryDescriptor, recordList, threshold = 0.55) => {
    if (!queryDescriptor || !recordList || recordList.length === 0) return null;

    let bestRecord = null;
    let minDistance = Infinity;

    recordList.forEach((record) => {
      if (!record.faceDescriptor || !Array.isArray(record.faceDescriptor) || record.faceDescriptor.length !== 128) {
        return;
      }

      const distance = getEuclideanDistance(queryDescriptor, record.faceDescriptor);

      if (distance < minDistance) {
        minDistance = distance;
        bestRecord = record;
      }
    });

    if (bestRecord && minDistance < threshold) {
      return {
        record: bestRecord,
        distance: minDistance
      };
    }

    return null;
  };

  // Helper: Euclidean distance
  const getEuclideanDistance = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      sum += Math.pow(arr1[i] - arr2[i], 2);
    }
    return Math.sqrt(sum);
  };

  return {
    modelsLoaded,
    loadingModels,
    modelsError,
    getFaceDescriptor,
    getLivenessMetrics,
    findBestMatch
  };
};
