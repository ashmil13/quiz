import React, { useState, useEffect, useRef } from 'react';
import { Play, Award, Timer, RotateCcw, BookOpen, AlertCircle, Camera, Mic, Shield, ShieldAlert, Volume2, UserCheck, RefreshCw, Sparkles, Activity, FileText } from 'lucide-react';
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

  // Reset/Start Quiz logic
  const handleStartStandardQuiz = () => {
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
          handleAutoSubmit("AI suspicion index reached 100%");
        }, 1200);
      }
      return nextScore;
    });

    setWarnings(prev => {
      const nextWarnings = prev + 1;
      setWarningModal({
        show: true,
        title: `AI System Warning (${nextWarnings}/${maxWarnings})`,
        message: `${type}: ${message}`
      });

      if (nextWarnings >= maxWarnings) {
        setTimeout(() => {
          handleAutoSubmit(`Violations limit exceeded (${maxWarnings}/${maxWarnings} warnings)`);
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
          videoBase64 = await blobToBase64(blob);
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

      {/* Floating Webcam View (Proctoring Active) */}
      {gameState === 'quiz' && isProctorEnabled && (
        <div className="floating-proctor-container">
          <div className="floating-camera-card">
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
            <div className="proctor-meta-info">
              <span className="score-tag" style={{
                color: suspicionScore > 0 ? '#f97316' : '#10b981',
                background: suspicionScore > 0 ? 'rgba(249, 115, 22, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                fontWeight: 700,
                fontSize: '0.725rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px'
              }}>
                AI Suspicion: {suspicionScore}%
              </span>
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
                      : 'You have successfully completed the exam. Your attempt is blocked.'}
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
                      <li style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                        <span>Score Obtained:</span>
                        <strong style={{ color: '#ffffff' }}>{attemptReport.score} / {attemptReport.totalQuestions} ({Math.round((attemptReport.score / attemptReport.totalQuestions) * 100)}%)</strong>
                      </li>
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
                  <h3 className="rules-title">Quiz Instructions:</h3>
                  <ul className="rules-list">
                    <li>
                      <Timer size={18} />
                      Each question has a 30-second time limit.
                    </li>
                    <li>
                      <Award size={18} />
                      You get 1 point for each correct answer.
                    </li>
                    <li>
                      <AlertCircle size={18} />
                      No points are deducted for wrong answers.
                    </li>
                    {isProctorEnabled && (
                      <>
                        <li className="proctor-rule">
                          <Shield size={18} />
                          Active proctoring will monitor your camera, eye focus, and browser focus.
                        </li>
                        <li className="proctor-rule" style={{ color: '#f87171' }}>
                          <Shield size={18} color="#f87171" />
                          Detection of multiple faces or secondary devices will result in immediate exam termination.
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <button onClick={handleStartStandardQuiz} className="action-btn">
                  <Play size={20} fill="#ffffff" />
                  Start Standard Quiz
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
            <div className="quiz-header">
              <span className="quiz-progress-text">
                Question {currentIdx + 1} of {quizQuestions.length}
              </span>
              <span className="quiz-score-badge">
                Score: {score}
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
              background: examStatus === 'Terminated' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)',
              borderColor: examStatus === 'Terminated' ? '#ef4444' : '#a855f7'
            }}>
              {examStatus === 'Terminated' ? (
                <ShieldAlert size={80} color="#ef4444" />
              ) : (
                <Award size={80} color="#a855f7" />
              )}
            </div>

            <h1 className="welcome-title" style={{
              color: examStatus === 'Terminated' ? '#ef4444' : '#ffffff'
            }}>
              {examStatus === 'Terminated' ? 'Exam Terminated!' : 'Quiz Completed!'}
            </h1>
            <p className="welcome-subtitle">
              {examStatus === 'Terminated' 
                ? 'Your exam session was terminated due to proctoring violations.' 
                : 'Here is how you performed in the Islamic Quiz Challenge.'}
            </p>

            <div className="result-stats-grid" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="stat-box" style={{ minWidth: '160px' }}>
                <div className="stat-val correct">{score} / {quizQuestions.length}</div>
                <div className="stat-lbl">Correct</div>
              </div>
            </div>

            {/* AI Proctoring Performance Report Card */}
            {isProctorEnabled && (
              <div className="proctoring-report-card">
                <div className="report-header">
                  <Shield size={20} className="shield-glow" />
                  <h3>AI Proctoring & Anti-Cheat Report</h3>
                </div>

                <div className="report-body">
                  <div className="gauge-score-section">
                    <div className="suspicion-gauge-wrapper">
                      <div className="suspicion-val-glow" style={{
                        color: suspicionScore > 0 ? '#f97316' : '#10b981',
                        textShadow: suspicionScore > 0 ? '0 0 10px rgba(249, 115, 22, 0.3)' : '0 0 10px rgba(16, 185, 129, 0.3)',
                        fontSize: '2.25rem',
                        fontWeight: 900
                      }}>
                        {suspicionScore}%
                      </div>
                      <span className="gauge-label">AI Suspicion Index</span>
                    </div>

                    <div className="verdict-summary">
                      <span className="verdict-title">System Verdict:</span>
                      {suspicionScore >= 60 ? (
                        <span className="verdict-badge flaged">FLAGGED FOR REVIEW</span>
                      ) : suspicionScore >= 30 ? (
                        <span className="verdict-badge warning">SUSPICIOUS ACTIVITIES</span>
                      ) : (
                        <span className="verdict-badge passed">PASSED PROCTORING</span>
                      )}
                    </div>
                  </div>

                  <div className="proctor-quick-stats">
                    <div className="q-stat">
                      <span className="q-val">{warnings}</span>
                      <span className="q-lbl">Warnings</span>
                    </div>
                    <div className="q-stat">
                      <span className="q-val">{formatElapsedTime(elapsedSeconds)}</span>
                      <span className="q-lbl">Test Duration</span>
                    </div>
                  </div>

                  {/* Violation Timelines */}
                  <div className="timeline-container">
                    <h4 className="timeline-title">
                      <FileText size={14} />
                      Exam Proctor Log
                    </h4>
                    {proctorLogs.length === 0 ? (
                      <p className="empty-logs">No violations detected during this exam session. Excellent compliance!</p>
                    ) : (
                      <div className="timeline-list">
                        {proctorLogs.map((log, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="time-badge">{log.time}</div>
                            <div className="log-details">
                              <span className="log-type">{log.type}</span>
                              <span className="log-msg">{log.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  : '0 4px 12px rgba(16, 185, 129, 0.2)'
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
                  Submit & Finish
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
