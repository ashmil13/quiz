import React, { useState, useEffect, useRef } from 'react';
import { Play, Award, Timer, RotateCcw, BookOpen, AlertCircle, Camera, Mic, Shield, ShieldAlert, Volume2, UserCheck, RefreshCw, Sparkles, Activity, FileText, CheckCircle2, Lock, Move } from 'lucide-react';
import axios from '../../axios';
import { loadTensorFlowAndBlazeFace, startCamera, stopStream, startVoiceDetection, startMediaRecorder, stopMediaRecorder, blobToBase64 } from '../../services/proctorHelper';
import useAuth from '../../hooks/useAuth';
import '../../css/userstyle/quiz.css';

const QUESTIONS = [
  {
    id: 1,
    question: "“യാസീൻ” ഏത് സൂറത്തിന്റെ പേരാണ്?",
    options: [
      { key: "A", text: "അൽബഖറ" },
      { key: "B", text: "യാസീൻ" },
      { key: "C", text: "അൽഫാതിഹ" },
      { key: "D", text: "അന്നിസാ" }
    ],
    answer: "B"
  },
  {
    id: 2,
    question: "ഖുർആനിലെ ഏറ്റവും വലിയ സൂറത്ത് ഏതാണ്?",
    options: [
      { key: "A", text: "അൽബഖറ" },
      { key: "B", text: "ആലു ഇംറാൻ" },
      { key: "C", text: "യാസീൻ" },
      { key: "D", text: "അൽമാഇദ" }
    ],
    answer: "A"
  },
  {
    id: 3,
    question: "ഖുർആൻ ആദ്യമായി അവതരിക്കപ്പെട്ട മാസം ഏതാണ്?",
    options: [
      { key: "A", text: "റജബ്" },
      { key: "B", text: "ശഅ്ബാൻ" },
      { key: "C", text: "റമദാൻ" },
      { key: "D", text: "ദുൽഹിജ്ജ" }
    ],
    answer: "C"
  },
  {
    id: 4,
    question: "ബിസ്മി ഇല്ലാതെ ആരംഭിക്കുന്ന സൂറത്ത് ഏതാണ്?",
    options: [
      { key: "A", text: "അത്തൗബ" },
      { key: "B", text: "അൽഫാതിഹ" },
      { key: "C", text: "അൽഇഖ്ലാസ്" },
      { key: "D", text: "അൽകാഫിറൂൻ" }
    ],
    answer: "A"
  },
  {
    id: 5,
    question: "ഖുർആനിലെ ഏറ്റവും ചെറിയ സൂറത്ത് ഏതാണ്?",
    options: [
      { key: "A", text: "അൽഫലഖ്" },
      { key: "B", text: "അൽഅസ്വർ" },
      { key: "C", text: "അൽഫാതിഹ" },
      { key: "D", text: "അൽകൗഥർ" }
    ],
    answer: "D"
  }
];

function Quiz() {
  const { auth } = useAuth();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [gameState, setGameState] = useState('start'); // 'start' | 'verification' | 'quiz' | 'result'
  const [quizQuestions, setQuizQuestions] = useState(QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedKey, setSelectedKey] = useState(null);
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // AI Quiz Generator states
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState('');

  // Proctoring configurations
  const [isProctorEnabled, setIsProctorEnabled] = useState(true);
  const [maxWarnings, setMaxWarnings] = useState(2);
  const [examDuration, setExamDuration] = useState(30);
  const [proctorStatus, setProctorStatus] = useState('init'); // 'init' | 'loading' | 'ready' | 'verifying' | 'success' | 'failed'
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationLog, setVerificationLog] = useState('Initialize camera stream...');

  // Proctoring active logs
  const [proctorLogs, setProctorLogs] = useState([]);
  const [warnings, setWarnings] = useState(0);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '' });
  const [faceStatus, setFaceStatus] = useState('Active');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Loading/Uploading states for submission
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const [hasAttempted, setHasAttempted] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [attemptReport, setAttemptReport] = useState(null);
  const [examStatus, setExamStatus] = useState('Completed'); // 'Completed' | 'Terminated'

  // Pre-exam Compulsory Camera state
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false);
  const preCheckVideoRef = useRef(null);

  const timerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const videoRef = useRef(null);
  const floatingVideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Streams & Model References
  const [cameraStream, setCameraStream] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  const isMonitoringActive = useRef(false);
  const recorderStateRef = useRef(null);

  // Proctoring consecutive trigger counts & limiters
  const lastViolationTime = useRef(0);
  const noFaceCount = useRef(0);
  const multiFaceCount = useRef(0);

  // Draggable Floating Camera State & Event Logic (Touch & Mouse)
  const [camPos, setCamPos] = useState(null);
  const [isDraggingCam, setIsDraggingCam] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    isDraggingRef.current = true;
    setIsDraggingCam(true);
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDraggingRef.current) return;
      if (e.touches && e.cancelable) {
        e.preventDefault();
      }

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const newLeft = clientX - dragOffsetRef.current.x;
      const newTop = clientY - dragOffsetRef.current.y;

      const containerWidth = isMobile ? 110 : 140;
      const containerHeight = isMobile ? 140 : 180;

      const maxLeft = Math.max(5, window.innerWidth - containerWidth - 5);
      const maxTop = Math.max(5, window.innerHeight - containerHeight - 5);
      const clampedLeft = Math.max(5, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(5, Math.min(newTop, maxTop));

      setCamPos({ left: clampedLeft, top: clampedTop });
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      setIsDraggingCam(false);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isMobile]);

  // Handle compulsory camera toggle before exam start
  const handleToggleCamera = async () => {
    if (isCameraEnabled) {
      setIsCameraEnabled(false);
      setCameraPermissionBlocked(false);
      if (cameraStream) {
        stopStream(cameraStream);
        setCameraStream(null);
      }
      setCameraError('Camera turned OFF. Enabling camera is compulsory before starting the exam.');
      return;
    }

    setCameraLoading(true);
    setCameraError('');
    setCameraPermissionBlocked(false);

    try {
      const stream = await startCamera(preCheckVideoRef.current);
      setCameraStream(stream);
      setIsCameraEnabled(true);
      setCameraLoading(false);
      setCameraPermissionBlocked(false);
    } catch (err) {
      console.error("Camera pre-check failed:", err);
      setIsCameraEnabled(false);
      setCameraLoading(false);
      setCameraPermissionBlocked(true);
      setCameraError('Camera permission is disallowed or blocked on your phone/browser.');
    }
  };

  // Reset/Start Quiz logic
  const handleStartStandardQuiz = () => {
    if (!isCameraEnabled) {
      setCameraError('❌ Camera access is COMPULSORY! Please turn ON your camera before starting the exam.');
      return;
    }

    setQuizQuestions(QUESTIONS);
    setScore(0);
    setCurrentIdx(0);
    setTimeLeft(examDuration);
    setSelectedKey(null);
    setIsLocked(false);
    setProctorLogs([]);
    setWarnings(0);
    setSuspicionScore(0);
    recorderStateRef.current = null;
    setExamStatus('Completed');

    if (isProctorEnabled) {
      setGameState('verification');
    } else {
      setGameState('quiz');
    }
  };

  const handleStartQuiz = async () => {
    // Record user face camera stream instead of screen to avoid asking for screen share permission
    const screenStream = null;
    screenStreamRef.current = screenStream;

    setScore(0);
    setCurrentIdx(0);
    setTimeLeft(examDuration);
    setSelectedKey(null);
    setIsLocked(false);
    setProctorLogs([]);
    setWarnings(0);
    setSuspicionScore(0);
    recorderStateRef.current = null;
    setExamStatus('Completed');
    setGameState('quiz');
  };

  // AI Quiz Generator Action
  const handleGenerateAIQuiz = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGenerating(true);
    setGeneratorMessage("AI is crafting your custom quiz... please wait.");

    try {
      const res = await axios.post('/api/quiz/generate', { topic: aiTopic.trim() });
      if (res.data && res.data.success && res.data.questions) {
        setQuizQuestions(res.data.questions);
        setGeneratorMessage(`Success! Loaded questions generated by ${res.data.provider}.`);

        setTimeout(() => {
          setIsGenerating(false);
          setScore(0);
          setCurrentIdx(0);
          setTimeLeft(examDuration);
          setSelectedKey(null);
          setIsLocked(false);
          setProctorLogs([]);
          setWarnings(0);
          setSuspicionScore(0);
          recorderStateRef.current = null;
          setExamStatus('Completed');

          if (isProctorEnabled) {
            setGameState('verification');
          } else {
            setGameState('quiz');
          }
        }, 1200);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setGeneratorMessage("AI generation failed. Loading default quiz instead.");
      setQuizQuestions(QUESTIONS);
      setTimeLeft(examDuration);
      setTimeout(() => {
        if (isProctorEnabled) {
          setGameState('verification');
        } else {
          setGameState('quiz');
        }
      }, 1500);
    }
  };

  const handleSelectOption = (key) => {
    if (isLocked) return;
    setSelectedKey(key);
  };

  const handleLockAnswer = () => {
    if (selectedKey === null || isLocked) return;
    setIsLocked(true);
    if (selectedKey === quizQuestions[currentIdx].answer) {
      setScore((prev) => prev + 1);
    }
  };

  // Format elapsed time (MM:SS)
  const formatElapsedTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Proctoring Violations System
  const triggerViolation = (type, message) => {
    if (gameState !== 'quiz') return;

    const now = Date.now();
    // Limit alerts to once every 6 seconds to prevent double triggers
    if (now - lastViolationTime.current < 6000) return;
    lastViolationTime.current = now;

    const timeString = formatElapsedTime(elapsedSeconds);
    const newLog = { time: timeString, type, message };
    setProctorLogs(prev => [...prev, newLog]);

    let weight = 0;
    if (type === 'App Switch') weight = 34; // 3 tab switches = 100% suspicion
    if (type === 'No Face') weight = 15;
    if (type === 'Multiple Faces') weight = 20;
    if (type === 'Eye Focus') weight = 20;
    if (type === 'Proctor Error') weight = 25;

    setSuspicionScore(prev => {
      const nextScore = Math.min(100, prev + weight);
      if (nextScore >= 100) {
        setTimeout(() => {
          handleAutoSubmit("Exam terminated due to violating the rules of the exam");
        }, 1200);
      }
      return nextScore;
    });

    setWarnings(prev => {
      const nextWarnings = prev + 1;
      setWarningModal({
        show: true,
        title: `Exam Warning (${nextWarnings}/${maxWarnings})`,
        message: `${type}: ${message}`
      });

      if (nextWarnings >= maxWarnings) {
        setTimeout(() => {
          handleAutoSubmit(`Exam terminated due to violating the rules of the exam`);
        }, 1200);
      }
      return nextWarnings;
    });
  };

  const handleAutoSubmit = (reason) => {
    setWarningModal({ show: false, title: '', message: '' });

    // Log the auto submit event
    const timeString = formatElapsedTime(elapsedSeconds);
    const updatedLogs = [...proctorLogs, { time: timeString, type: 'Exam Terminated', message: reason }];
    setProctorLogs(updatedLogs);

    // Call exam finished directly with updated logs
    setTimeout(() => {
      handleExamFinished('Terminated', updatedLogs);
    }, 100);
  };

  // Stop recording and upload results
  const handleExamFinished = async (finalStatus = 'Completed', currentLogs = proctorLogs) => {
    // Clear monitoring flags & timers
    setExamStatus(finalStatus);
    isMonitoringActive.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    setUploadStatus('Stopping camera & audio feeds...');
    setIsUploading(true);

    let videoBase64 = '';

    // Stop recording and retrieve blob
    if (isProctorEnabled && recorderStateRef.current) {
      try {
        setUploadStatus('Saving proctoring video stream...');
        const blob = await stopMediaRecorder(recorderStateRef.current);
        if (blob) {
          setUploadStatus('Encoding footage for SuperAdmin review...');
          let base64 = await blobToBase64(blob);
          if (base64 && base64.length > 2500000) {
            console.warn("Video recording size exceeds Vercel payload limit; optimizing payload...");
            base64 = base64.slice(0, 2500000);
          }
          videoBase64 = base64;
        }

        // Clean up screen sharing tracks if any
        if (recorderStateRef.current.screenStream) {
          stopStream(recorderStateRef.current.screenStream);
        }
      } catch (err) {
        console.error("Error harvesting video recording:", err);
      }
    }

    // Stop tracks
    if (cameraStream) stopStream(cameraStream);

    try {
      setUploadStatus('Uploading exam reports & logs to secure database...');

      const payload = {
        examName: aiTopic ? `AI Quiz: ${aiTopic}` : 'Standard Islamic Quiz',
        score,
        totalQuestions: quizQuestions.length,
        status: finalStatus,
        suspicionScore,
        events: currentLogs,
        videoBase64
      };

      const token = localStorage.getItem("accessToken");
      await axios.post('/api/exam-report/upload', payload, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      setUploadStatus('Report uploaded successfully!');
    } catch (err) {
      console.error("Error uploading exam report:", err);
      setUploadStatus('Upload failed (Offline report only).');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setGameState('result');
      }, 1000);
    }
  };

  // Check user attempt status on start screen
  useEffect(() => {
    if (gameState === 'start' && auth?.accessToken) {
      const checkAttempt = async () => {
        setCheckingAttempt(true);
        try {
          const res = await axios.get('/api/exam-report/check-attempt', {
            headers: {
              'Authorization': `Bearer ${auth.accessToken}`
            },
            withCredentials: true
          });
          if (res.data && res.data.hasAttempted) {
            setHasAttempted(true);
            setAttemptReport(res.data.report);
          } else {
            setHasAttempted(false);
            setAttemptReport(null);
          }
        } catch (err) {
          console.error("Attempt status check failed:", err);
          setHasAttempted(false);
          setAttemptReport(null);
        } finally {
          setCheckingAttempt(false);
        }
      };

      checkAttempt();
    } else if (gameState === 'start' && !auth?.accessToken) {
      setHasAttempted(false);
      setAttemptReport(null);
      setCheckingAttempt(false);
    }
  }, [gameState, auth?.accessToken]);

  // Fetch Quiz configuration and dynamic questions
  useEffect(() => {
    const fetchQuizConfigAndQuestions = async () => {
      try {
        const configRes = await axios.get('/api/quiz/config');
        if (configRes.data && configRes.data.config) {
          const cfg = configRes.data.config;
          setIsProctorEnabled(cfg.isProctorEnabled);
          setMaxWarnings(cfg.maxWarnings);
          setExamDuration(cfg.examDuration);
          setTimeLeft(cfg.examDuration);
        }

        const questionsRes = await axios.get('/api/quiz/questions');
        if (questionsRes.data && questionsRes.data.questions && questionsRes.data.questions.length > 0) {
          setQuizQuestions(questionsRes.data.questions);
        }
      } catch (err) {
        console.error("Failed to load quiz config/questions:", err);
      }
    };

    if (auth?.accessToken) {
      fetchQuizConfigAndQuestions();
    }
  }, [gameState, auth?.accessToken]);

  // 1. Pre-quiz Face Verification Loader
  useEffect(() => {
    if (gameState !== 'verification') return;

    let activeStream = null;
    const initVerification = async () => {
      try {
        setProctorStatus('loading');
        setVerificationLog('Loading AI Face Recognition model...');
        const model = await loadTensorFlowAndBlazeFace();
        setFaceModel(model);

        setVerificationLog('Activating camera stream...');
        const stream = await startCamera(videoRef.current);
        setCameraStream(stream);
        activeStream = stream;
        setProctorStatus('ready');
        setVerificationLog('Face model loaded! Look straight at the camera and click "Verify Face"');
      } catch (err) {
        console.error(err);
        setProctorStatus('failed');
        setVerificationLog('Proctor Error: ' + err.message);
      }
    };

    initVerification();

    return () => {
      if (activeStream) stopStream(activeStream);
    };
  }, [gameState]);

  // Handle Scan Verification Process
  const handleVerifyFace = async () => {
    if (!faceModel || !videoRef.current) return;

    setProctorStatus('verifying');
    setVerificationLog('Scanning and analyzing facial landmarks...');
    setVerificationProgress(10);

    let faceSuccesses = 0;
    let scanCount = 0;

    const interval = setInterval(async () => {
      scanCount++;
      setVerificationProgress(Math.min(100, Math.floor((scanCount / 10) * 100)));

      try {
        const predictions = await faceModel.estimateFaces(videoRef.current, false);
        if (predictions.length === 1) {
          faceSuccesses++;
          setVerificationLog(`Scanning... [Face detected] (${faceSuccesses}/5)`);
        } else if (predictions.length > 1) {
          setVerificationLog('Scanning... [Multiple faces detected!]');
        } else {
          setVerificationLog('Scanning... [No face detected. Align your face]');
        }
      } catch (err) {
        console.error("Scanning error:", err);
      }

      if (scanCount >= 10) {
        clearInterval(interval);
        if (faceSuccesses >= 4) {
          setProctorStatus('success');
          setVerificationLog('Identity Verified Successfully! Ready to launch the exam.');
        } else {
          setProctorStatus('failed');
          setVerificationLog('Verification Failed. Keep your head stable, check lighting, and try again.');
        }
      }
    }, 450);
  };

  // 2. Active Proctoring & Recording during Quiz
  useEffect(() => {
    if (gameState !== 'quiz' || !isProctorEnabled) return;

    let activeCam = null;
    isMonitoringActive.current = true;

    const setupProctorMonitoring = async () => {
      // Setup webcam monitoring feed
      try {
        const cam = await startCamera(floatingVideoRef.current);
        setCameraStream(cam);
        activeCam = cam;

        // Launch Face Monitoring Loop (BlazeFace)
        if (faceModel && floatingVideoRef.current) {
          detectLoop(faceModel, floatingVideoRef.current);
        }
      } catch (err) {
        console.error(err);
        triggerViolation("Proctor Error", "Webcam access lost during active monitoring");
      }

      // 🎥 Initiate Media Recording by using the screen capture stream (captured during user gesture) and merging it with mic audio tracks
      try {
        let videoTrack = null;
        let screenStream = screenStreamRef.current;

        if (screenStream) {
          videoTrack = screenStream.getVideoTracks()[0];
          // Listen for screen sharing stop
          videoTrack.addEventListener('ended', () => {
            triggerViolation("Screen Share Stopped", "Do not stop sharing your screen during the exam.");
          });
        }

        const combinedTracks = [];
        if (videoTrack) {
          combinedTracks.push(videoTrack);
        } else if (activeCam) {
          combinedTracks.push(...activeCam.getVideoTracks());
        }

        if (combinedTracks.length > 0) {
          const combinedStream = new MediaStream(combinedTracks);
          const recorderState = startMediaRecorder(combinedStream);
          recorderStateRef.current = {
            ...recorderState,
            screenStream
          };
        }
      } catch (err) {
        console.error("Failed to start MediaRecorder recording:", err);
      }
    };

    setupProctorMonitoring();

    // Start clock timer
    setElapsedSeconds(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      isMonitoringActive.current = false;
      if (activeCam) stopStream(activeCam);
      if (recorderStateRef.current && recorderStateRef.current.screenStream) {
        stopStream(recorderStateRef.current.screenStream);
      }
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [gameState, isProctorEnabled, faceModel]);

  // Face checking recursion loop
  const detectLoop = async (model, videoEl) => {
    if (!videoEl || videoEl.paused || videoEl.ended || !isMonitoringActive.current) return;

    try {
      const predictions = await model.estimateFaces(videoEl, false);

      if (predictions.length === 0) {
        setFaceStatus("Missing");
        noFaceCount.current += 1;
        if (noFaceCount.current >= 2) {
          triggerViolation("No Face", "Maintain facial alignment in camera view.");
          noFaceCount.current = 0;
        }
      } else if (predictions.length > 1) {
        setFaceStatus("Multi-Face");
        handleAutoSubmit("Exam terminated: Multiple faces or secondary devices detected in webcam view");
        return;
      } else {
        const prediction = predictions[0];
        if (prediction.landmarks && prediction.landmarks.length >= 4) {
          const rightEye = prediction.landmarks[0];
          const leftEye = prediction.landmarks[1];
          const nose = prediction.landmarks[2];
          const mouth = prediction.landmarks[3];

          // 1. Horizontal Turn (Left/Right look away)
          const eyeDist = Math.hypot(leftEye[0] - rightEye[0], leftEye[1] - rightEye[1]);
          const eyeMidX = (leftEye[0] + rightEye[0]) / 2;
          const noseToMidX = Math.abs(nose[0] - eyeMidX);
          const horizontalRatio = noseToMidX / (eyeDist || 1);

          // 2. Vertical Turn (Up/Down look away)
          const eyeMidY = (leftEye[1] + rightEye[1]) / 2;
          const noseToMidY = nose[1] - eyeMidY;
          const mouthToMidY = mouth[1] - eyeMidY;
          const verticalRatio = noseToMidY / (mouthToMidY || 1);

          // Thresholds: horizontalRatio > 0.30, verticalRatio < 0.20 (looking up) or > 0.70 (looking down)
          if (horizontalRatio > 0.30 || verticalRatio < 0.20 || verticalRatio > 0.70) {
            setFaceStatus("Unfocused");
            triggerViolation("Eye Focus", "Please keep your eyes focused on the exam screen.");
          } else {
            setFaceStatus("Active");
            noFaceCount.current = 0;
            multiFaceCount.current = 0;
          }
        } else {
          setFaceStatus("Active");
          noFaceCount.current = 0;
          multiFaceCount.current = 0;
        }
      }
    } catch (err) {
      console.warn("Face loop warning:", err);
    }

    if (isMonitoringActive.current) {
      setTimeout(() => detectLoop(model, videoEl), 3000);
    }
  };

  // 3. App/Tab Switching, Minimize & Screen Split Event Listeners
  useEffect(() => {
    if (gameState !== 'quiz' || !isProctorEnabled) return;

    // Check on quiz load if screen is split (skip on mobile since orientation/viewport size differs)
    if (!isMobile && window.innerWidth < window.screen.width * 0.85) {
      handleAutoSubmit("Exam terminated: Screen split detected (window not maximized)");
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleAutoSubmit("Exam terminated: Window minimized or tab switched");
      }
    };

    const handleWindowBlur = () => {
      // Ignore blur on mobile to prevent false positives from native keyboards/overlays
      if (!isMobile) {
        handleAutoSubmit("Exam terminated: Clicked outside the exam window");
      }
    };

    const handleResize = () => {
      if (!isMobile && window.innerWidth < window.screen.width * 0.85) {
        handleAutoSubmit("Exam terminated: Screen split or resized window detected");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    if (!isMobile) {
      window.addEventListener("blur", handleWindowBlur);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!isMobile) {
        window.removeEventListener("blur", handleWindowBlur);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [gameState, isProctorEnabled, elapsedSeconds, isMobile]);

  // 4. Timer Countdown Logic
  useEffect(() => {
    if (gameState !== 'quiz' || isLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx, isLocked]);

  // Handle auto-advancing on timeout (auto-locks instead of skipping immediately)
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'quiz') {
      setIsLocked(true);
    }
  }, [timeLeft, gameState]);

  // Automatically advance to the next question after 1 second when locked
  useEffect(() => {
    if (isLocked && gameState === 'quiz') {
      const timer = setTimeout(() => {
        if (currentIdx < quizQuestions.length - 1) {
          setCurrentIdx((prev) => prev + 1);
          setTimeLeft(examDuration);
          setSelectedKey(null);
          setIsLocked(false);
        } else {
          handleExamFinished('Completed');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, gameState, currentIdx, quizQuestions]);

  const getTimerClass = () => {
    if (timeLeft <= 5) return 'danger';
    if (timeLeft <= 15) return 'warning';
    return '';
  };

  const getSuspicionClass = () => {
    if (suspicionScore >= 75) return 'danger';
    if (suspicionScore >= 40) return 'warning';
    return 'safe';
  };

  const currentQuestion = quizQuestions[currentIdx];
  const progressPercentage = (timeLeft / 30) * 100;

  return (
    <div className="quiz-wrapper">
      {/* Uploading Loader overlay screen */}
      {isUploading && (
        <div className="warning-overlay-container">
          <div className="warning-modal upload-loader-modal">
            <RefreshCw className="spinner-icon upload-spinner" size={48} />
            <h2 className="warning-title" style={{ color: '#a855f7', marginTop: '1.5rem' }}>Uploading Exam Data</h2>
            <p className="warning-desc">{uploadStatus}</p>
          </div>
        </div>
      )}

      {/* Warning Overlay Modal */}
      {warningModal.show && (
        <div className="warning-overlay-container">
          <div className="warning-modal">
            <div className="warning-icon-wrapper">
              <ShieldAlert size={48} className="warning-glow-icon" />
            </div>
            <h2 className="warning-title">{warningModal.title}</h2>
            <p className="warning-desc">{warningModal.message}</p>
            <button
              className="warning-btn"
              onClick={() => setWarningModal({ show: false, title: '', message: '' })}
            >
              I Understand & Proceed
            </button>
          </div>
        </div>
      )}

      {/* Floating Webcam View (Proctoring Active - Draggable on Mobile & PC) */}
      {gameState === 'quiz' && isProctorEnabled && (
        <div
          className="floating-proctor-container"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            cursor: isDraggingCam ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            boxShadow: isDraggingCam ? '0 15px 35px rgba(168, 85, 247, 0.45)' : '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: isDraggingCam ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
            transition: isDraggingCam ? 'none' : 'box-shadow 0.2s ease, border 0.2s ease',
            ...(camPos ? {
              left: `${camPos.left}px`,
              top: `${camPos.top}px`,
              right: 'auto',
              bottom: 'auto'
            } : {})
          }}
        >
          <div className="floating-camera-card">
            {/* Drag Handle Top Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0',
              background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.65rem',
              color: '#a78bfa',
              fontWeight: 700,
              letterSpacing: '0.03em'
            }}>
              <Move size={11} color="#a78bfa" />
              <span>Drag / Move</span>
            </div>

            <video
              ref={floatingVideoRef}
              autoPlay
              playsInline
              muted
              className="floating-video"
            />
            <div className="camera-indicator-bar">
              <div className="indicator-group">
                <span className={`status-dot ${faceStatus === 'Active' ? 'green' : faceStatus === 'Unfocused' ? 'orange' : 'red'}`}></span>
                <span className="indicator-label">{faceStatus === 'Active' ? 'Face: OK' : faceStatus === 'Unfocused' ? 'Eye Focus: Away' : `Face: ${faceStatus}`}</span>
              </div>
              <div className="indicator-group">
                <Shield size={11} className={faceStatus === 'Unfocused' ? 'pulsing-shield' : ''} />
                <span className="indicator-label">Gaze: {faceStatus === 'Unfocused' ? 'Unfocused' : 'Focused'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quiz-card">
        {/* GAME STATE: START SCREEN */}
        {gameState === 'start' && (
          <div className="start-screen">
            {checkingAttempt ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
                <RefreshCw className="spinner-icon animate-spin" size={32} color="#a855f7" />
                <span style={{ color: '#94a3b8' }}>Checking exam attempt...</span>
              </div>
            ) : hasAttempted ? (
              <div className="attempted-container" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>Attempt Blocked</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
                    {attemptReport?.status === 'Terminated'
                      ? 'Your exam was terminated due to proctoring violations. Your attempt is blocked.'
                      : 'Your exam is finished, congratulations! Your attempt is blocked.'}
                  </p>
                </div>
                
                {attemptReport && (
                  <div className="rules-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>Attempt Record Details:</h4>
                    <ul className="rules-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                        <span>Status:</span>
                        <strong style={{ color: attemptReport.status === 'Completed' ? '#10b981' : '#ef4444' }}>{attemptReport.status}</strong>
                      </li>
                      {attemptReport.status === 'Completed' && typeof attemptReport.score === 'number' && (
                        <li style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                          <span>Mark Grade:</span>
                          <strong style={{
                            color: (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.8 
                              ? '#10b981' 
                              : (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.5 
                              ? '#3b82f6' 
                              : '#f59e0b'
                          }}>
                            {(attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.8 
                              ? 'Excellent' 
                              : (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.5 
                              ? 'Good' 
                              : 'Not Bad'}
                          </strong>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="welcome-icon-container">
                  <BookOpen size={40} />
                </div>
                <h1 className="welcome-title">Islamic Quiz Challenge</h1>
                <p className="welcome-subtitle">
                  Test your knowledge on Quran Surahs and Islamic facts in Malayalam.
                </p>

                {/* Proctor settings (Forced Enabled) */}
                <div className="proctor-toggle-card">
                  <div className="proctor-toggle-header">
                    <Shield size={20} className="proctor-shield-icon" />
                    <div className="proctor-toggle-texts">
                      <h4 className="proctor-title">AI Proctoring & Anti-Cheat</h4>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Always Enabled
                    </span>
                  </div>
                </div>

                <div className="rules-card">
                  <h3 className="rules-title">Quiz Instructions / പരീക്ഷാ നിർദ്ദേശങ്ങൾ:</h3>
                  <ul className="rules-list">
                    <li>
                      <Timer size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>Each question has a 30-second time limit.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          ഓരോ ചോദ്യത്തിനും 30 സെക്കൻഡ് സമയപരിധിയുണ്ട്.
                        </div>
                      </div>
                    </li>
                    <li>
                      <Award size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>You get 1 point for each correct answer.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          ഓരോ ശരിയായ ഉത്തരത്തിനും 1 പോയിന്റ് ലഭിക്കും.
                        </div>
                      </div>
                    </li>
                    <li>
                      <AlertCircle size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>No points are deducted for wrong answers.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          തെറ്റായ ഉത്തരങ്ങൾക്ക് പോയിന്റുകൾ കുറയ്ക്കില്ല.
                        </div>
                      </div>
                    </li>
                    {isProctorEnabled && (
                      <>
                        <li className="proctor-rule">
                          <Shield size={18} />
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>Active proctoring will monitor your camera, eye focus, and browser focus.</div>
                            <div style={{ fontSize: '0.825rem', color: '#a78bfa', marginTop: '0.2rem' }}>
                              നിങ്ങളുടെ ക്യാമറ, കണ്ണുകളുടെ ശ്രദ്ധ, ബ്രൗസർ ഫോക്കസ് എന്നിവ എഐ പ്രോക്ടറിംഗ് വഴി നിരീക്ഷിക്കുന്നതാണ്.
                            </div>
                          </div>
                        </li>
                        <li className="proctor-rule" style={{ color: '#f87171' }}>
                          <Shield size={18} color="#f87171" />
                          <div>
                            <div style={{ color: '#f87171', fontWeight: 600 }}>Detection of multiple faces or secondary devices will result in immediate exam termination.</div>
                            <div style={{ fontSize: '0.825rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                              ഒന്നിൽ കൂടുതൽ ആളുകളെ കാണുകയോ മറ്റു ഫോൺ/ഉപകരണങ്ങൾ ഉപയോഗിക്കുകയോ ചെയ്താൽ പരീക്ഷ ഉടനടി റദ്ദാക്കുന്നതാണ്.
                            </div>
                          </div>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* COMPULSORY CAMERA PERMISSION CARD */}
                <div className="camera-precheck-card" style={{
                  background: isCameraEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: isCameraEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  margin: '1.25rem 0',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isCameraEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Camera size={22} color={isCameraEnabled ? '#10b981' : '#ef4444'} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          Camera Access
                          <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>COMPULSORY</span>
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                          {isCameraEnabled 
                            ? '✓ Camera is ON and verified. You are ready to start!' 
                            : 'You must turn ON your camera option before starting the exam.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      disabled={cameraLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: cameraLoading ? 'not-allowed' : 'pointer',
                        border: 'none',
                        background: isCameraEnabled
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        boxShadow: isCameraEnabled
                          ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                          : '0 4px 14px rgba(239, 68, 68, 0.35)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cameraLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Connecting Camera...
                        </>
                      ) : isCameraEnabled ? (
                        <>
                          <CheckCircle2 size={16} />
                          Camera ON (Active)
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          Turn ON Camera
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Video Preview Box when Camera is ON */}
                  {isCameraEnabled && (
                    <div style={{ marginTop: '1rem', borderRadius: '12px', overflow: 'hidden', height: '140px', background: '#0f172a', position: 'relative', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <video
                        ref={preCheckVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                      <div style={{ position: 'absolute', bottom: '8px', left: '12px', background: 'rgba(0,0,0,0.65)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        Live Feed Active
                      </div>
                    </div>
                  )}

                  {/* Camera Error Banner */}
                  {cameraError && (
                    <div style={{ marginTop: '0.75rem', color: '#ef4444', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={16} />
                      {cameraError}
                    </div>
                  )}

                  {/* Step-by-step guidance box when camera permission is disallowed/blocked */}
                  {cameraPermissionBlocked && (
                    <div style={{
                      marginTop: '0.85rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldAlert size={16} />
                        How to Allow Camera Permission on Phone & Browser:
                      </div>
                      <ol style={{ margin: '0 0 0.85rem 1.1rem', padding: 0, color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.45' }}>
                        <li>Look at the browser address bar at the top/bottom of your phone screen.</li>
                        <li>Tap the <strong>Lock 🔒</strong> or <strong>Camera / Tune ⚙️</strong> icon.</li>
                        <li>Tap <strong>Permissions / Site Settings</strong> and change <strong>Camera</strong> to <strong>ALLOW</strong>.</li>
                        <li>Then click the button below to grant permission and activate your camera.</li>
                      </ol>
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        disabled={cameraLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 1.1rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          border: 'none',
                          cursor: cameraLoading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                        }}
                      >
                        <RefreshCw size={15} className={cameraLoading ? 'animate-spin' : ''} />
                        {cameraLoading ? 'Requesting Permission...' : 'Allow Camera & Re-try'}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartStandardQuiz}
                  className="action-btn"
                  style={{
                    background: isCameraEnabled
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                      : 'rgba(100, 116, 139, 0.3)',
                    cursor: isCameraEnabled ? 'pointer' : 'not-allowed',
                    opacity: isCameraEnabled ? 1 : 0.7,
                    boxShadow: isCameraEnabled ? '0 10px 25px rgba(139, 92, 246, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCameraEnabled ? (
                    <>
                      <Play size={20} fill="#ffffff" />
                      Start Standard Quiz
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Turn ON Camera to Start Exam
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* GAME STATE: FACE VERIFICATION */}
        {gameState === 'verification' && (
          <div className="verification-screen">
            <div className="screen-header">
              <Camera size={24} />
              <h2>Face Verification Scan</h2>
            </div>
            <p className="verification-intro">
              We need to verify your face identity before launching the proctored environment.
            </p>

            <div className="scanner-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="scanner-video"
              />
              <div className={`scanner-visual-line ${proctorStatus === 'verifying' ? 'animating' : ''}`}></div>

              {proctorStatus === 'loading' && (
                <div className="scanner-loader-overlay">
                  <RefreshCw className="spinner-icon" size={36} />
                  <span>Configuring AI...</span>
                </div>
              )}
            </div>

            <div className="verification-log-card">
              <p className="verification-log">{verificationLog}</p>
              {proctorStatus === 'verifying' && (
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${verificationProgress}%` }}></div>
                </div>
              )}
            </div>

            <div className="verification-actions">
              {proctorStatus === 'ready' && (
                <button onClick={handleVerifyFace} className="action-btn verify-action">
                  <UserCheck size={18} />
                  Verify Face
                </button>
              )}
              {proctorStatus === 'success' && (
                <button onClick={handleStartQuiz} className="action-btn success-action">
                  <Play size={18} fill="#ffffff" />
                  Proceed to Exam
                </button>
              )}
              {proctorStatus === 'failed' && (
                <button
                  onClick={() => {
                    setGameState('verification');
                    setProctorStatus('init');
                  }}
                  className="action-btn retry-action"
                >
                  <RotateCcw size={18} />
                  Retry Scan
                </button>
              )}
            </div>
          </div>
        )}

        {/* GAME STATE: ACTIVE QUIZ */}
        {gameState === 'quiz' && (
          <div>
            {/* Upper Info */}
            <div className="quiz-header" style={{ justifyContent: 'center' }}>
              <span className="quiz-progress-text">
                Question {currentIdx + 1} of {quizQuestions.length}
              </span>
            </div>

            {/* Timer Countdown Area */}
            <div className="timer-container">
              <div className="timer-info">
                <span className="timer-label">
                  <Timer size={16} />
                  Time Left
                </span>
                <span className={`timer-seconds ${getTimerClass()}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="timer-bar-bg">
                <div
                  className={`timer-bar-fill ${getTimerClass()}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text */}
            <div className="question-container">
              <h2 className="question-text">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="options-grid">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedKey === opt.key;

                let buttonClass = "";
                if (isSelected) {
                  buttonClass = "selected";
                }

                return (
                  <button
                    key={opt.key}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`option-button ${buttonClass}`}
                  >
                    <span className="option-letter">{opt.key}</span>
                    <span className="option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>
            {/* Control Buttons (Lock Answer) */}
            <div className="control-btn-container">
              {!isLocked && (
                <button
                  disabled={selectedKey === null}
                  onClick={handleLockAnswer}
                  className="lock-btn"
                >
                  Lock Answer
                </button>
              )}
            </div>
          </div>
        )}

        {/* GAME STATE: RESULT / EVALUATION */}
        {gameState === 'result' && (
          <div className="result-screen">
            <div className="result-circle-wrapper" style={{
              background: examStatus === 'Terminated' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: examStatus === 'Terminated' ? '#ef4444' : '#10b981'
            }}>
              {examStatus === 'Terminated' ? (
                <ShieldAlert size={80} color="#ef4444" />
              ) : (
                <CheckCircle2 size={80} color="#10b981" />
              )}
            </div>

            <h1 className="welcome-title" style={{
              color: examStatus === 'Terminated' ? '#ef4444' : '#ffffff'
            }}>
              {examStatus === 'Terminated' ? 'Exam Terminated!' : 'Your exam is finished, congratulations!'}
            </h1>
            <p className="welcome-subtitle">
              {examStatus === 'Terminated' 
                ? 'Your exam was terminated due to violating the rules of the exam.' 
                : 'You have completed the exam. Your response has been submitted successfully.'}
            </p>

            {/* Mark-based evaluation: Excellent, Good, Not Bad */}
            {examStatus === 'Completed' && (() => {
              const total = quizQuestions.length || 1;
              const ratio = score / total;
              let gradeText = 'Not Bad';
              let badgeColor = '#f59e0b';
              let badgeBg = 'rgba(245, 158, 11, 0.15)';
              let badgeBorder = 'rgba(245, 158, 11, 0.3)';

              if (ratio >= 0.8) {
                gradeText = 'Excellent';
                badgeColor = '#10b981';
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeBorder = 'rgba(16, 185, 129, 0.3)';
              } else if (ratio >= 0.5) {
                gradeText = 'Good';
                badgeColor = '#3b82f6';
                badgeBg = 'rgba(59, 130, 246, 0.15)';
                badgeBorder = 'rgba(59, 130, 246, 0.3)';
              }

              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  width: '100%',
                  maxWidth: '380px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Exam Result
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.75rem' }}>
                    {score} <span style={{ fontSize: '1.25rem', color: '#64748b' }}>/ {quizQuestions.length}</span>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '30px',
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    color: badgeColor,
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    letterSpacing: '0.5px'
                  }}>
                    {gradeText === 'Excellent' && '🌟 '}
                    {gradeText === 'Good' && '👍 '}
                    {gradeText === 'Not Bad' && '👌 '}
                    {gradeText}
                  </div>
                </div>
              );
            })()}

            <button 
              onClick={() => {
                setGameState('start');
              }} 
              className="action-btn submit-quiz-btn"
              style={{
                background: examStatus === 'Terminated'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: examStatus === 'Terminated'
                  ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                  : '0 4px 12px rgba(16, 185, 129, 0.2)',
                marginTop: '1rem'
              }}
            >
              {examStatus === 'Terminated' ? (
                <>
                  <ShieldAlert size={20} />
                  Exam Terminated
                </>
              ) : (
                <>
                  <UserCheck size={20} />
                  Finish Exam
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;
