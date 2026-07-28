import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, Flag, ChevronLeft, ChevronRight, 
  Grid3x3, AlertTriangle, CheckCircle, Calculator as CalcIcon, Camera 
} from 'lucide-react';
import api from '../api/axios';
import { useExamStore } from '../store/examStore';
import ExamTimer from '../components/ExamTimer';
import QuestionNavigator from '../components/QuestionNavigator';
import SubmitConfirmation from '../components/SubmitConfirmation';
import ModernConfirmDialog from '../components/ModernConfirmDialog';
import MultipleChoiceQuestion from '../components/questions/MultipleChoiceQuestion';
import MultipleAnswerQuestion from '../components/questions/MultipleAnswerQuestion';
import ShortAnswerQuestion from '../components/questions/ShortAnswerQuestion';
import MatchFollowingQuestion from '../components/questions/MatchFollowingQuestion';
import CodeTestQuestion from '../components/questions/CodeTestQuestion';
import ReviewScreen from '../components/ReviewScreen';
import { decryptQuestions } from '../utils/encryption';
import notificationManager from '../utils/notificationManager';

// TCS iON Components (simplified versions to avoid import issues)
const SimpleReviewScreen = ({ exam, answers, flaggedQuestions, onBack, onSubmit }) => {
  const questions = exam?.questions || [];
  const answeredCount = Object.keys(answers || {}).filter(id => {
    const answer = answers[id];
    return answer !== null && answer !== undefined && answer !== '';
  }).length;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📋 Review Your Answers</h1>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
              <div className="text-green-700">Answered</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{questions.length - answeredCount}</div>
              <div className="text-red-700">Not Answered</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{flaggedQuestions?.length || 0}</div>
              <div className="text-yellow-700">Flagged</div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3 mb-6">
            {questions.map((q, index) => {
              const hasAnswer = answers?.[q._id] !== undefined && answers?.[q._id] !== null && answers?.[q._id] !== '';
              const isFlagged = flaggedQuestions?.includes(q._id);
              
              let bgColor = 'bg-gray-200';
              if (hasAnswer && isFlagged) bgColor = 'bg-purple-200';
              else if (hasAnswer) bgColor = 'bg-green-200';
              else if (isFlagged) bgColor = 'bg-yellow-200';
              else bgColor = 'bg-red-200';
              
              return (
                <div key={q._id} className={`p-3 rounded-lg text-center font-semibold ${bgColor}`}>
                  Q{index + 1}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <span>← Back to Exam</span>
            </button>
            <button
              onClick={onSubmit}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <span>Submit Exam →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleInstructionsPage = ({ exam, onStart }) => {
  const [agreed, setAgreed] = useState(false);

  const handleStart = () => {
    if (!agreed) {
      // Show modern notification for terms agreement
      notificationManager.warning(
        'Terms Agreement Required! 📋',
        'Please agree to the terms and conditions before starting the exam.',
        { 
          autoCloseDelay: 5000,
          position: 'top-right'
        }
      );
      
      // Highlight the checkbox
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.focus();
        checkbox.parentElement.style.animation = 'pulse 0.5s ease-in-out 3';
      }
      
      return;
    }
    onStart();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Exam Instructions</h1>
          <h2 className="text-xl text-blue-600 font-semibold">{exam.title}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900">Duration</h3>
            <p className="text-blue-700">{exam.duration} minutes</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900">Questions</h3>
            <p className="text-green-700">{exam.questions?.length || 0} questions</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <AlertTriangle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Passing Score</h3>
            <p className="text-purple-700">{exam.passingScore || 70}%</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-3">📝 Important Instructions:</h3>
          <ul className="text-yellow-800 space-y-2">
            <li>• Read all questions carefully before answering</li>
            <li>• You can flag questions for review</li>
            <li>• Use the calculator if available</li>
            <li>• Photo capture may be required for proctoring</li>
            <li>• Submit your exam before time runs out</li>
          </ul>
        </div>

        <div className="flex items-center justify-center space-x-4 mb-6">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
            />
            <span className="text-gray-700">I agree to the terms and conditions</span>
          </label>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleStart}
            disabled={!agreed}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🚀 Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

const SimpleCalculator = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Calculator</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>
      <div className="bg-gray-100 p-4 rounded text-right mb-4">
        <div className="text-2xl font-mono">0</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((btn) => (
          <button key={btn} className="bg-gray-200 hover:bg-gray-300 p-3 rounded font-semibold">
            {btn}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const SimplePhotoCapture = ({ onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(photoData);
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setTimeout(() => {
      setCapturing(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📷 Photo Capture</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        
        <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          {error ? (
            <div className="text-center text-red-600">
              <Camera className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded"
            />
          )}
        </div>
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="flex space-x-3">
          <button
            onClick={capturePhoto}
            disabled={error || capturing}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {capturing ? '📸 Capturing...' : '📸 Capture'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SecurityWarningModal = ({ isOpen, message, onClose, isAutoSubmit = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-red-500">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-red-600 mb-4">
            {isAutoSubmit ? '🚨 Exam Termination' : '⚠️ Security Warning'}
          </h3>
          
          <div className="text-gray-700 mb-6 whitespace-pre-line text-sm leading-relaxed">
            {message}
          </div>
          
          {isAutoSubmit ? (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting exam automatically...
              </div>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              I Understand
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function EnhancedTCSExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const {
    currentExam,
    answers,
    sessionId,
    flaggedQuestions,
    currentQuestionIndex,
    showInstructions,
    showReviewScreen,
    initialPhotoTaken,
    setCurrentExam,
    setAnswer,
    toggleFlag,
    setCurrentQuestionIndex,
    setShowInstructions,
    setShowReviewScreen,
    addPhotoCapture,
    setInitialPhotoTaken,
    clearAnswers,
    resetExam,
  } = useExamStore();

  // Get current question with logging
  const currentQuestion = currentExam?.questions?.[currentQuestionIndex];
  
  // Debug logging
  useEffect(() => {
    console.log('📝 Current Question Index:', currentQuestionIndex);
    console.log('📚 Total Questions:', currentExam?.questions?.length);
    console.log('❓ Current Question:', currentQuestion);
    console.log('💬 Question Text:', currentQuestion?.question || currentQuestion?.questionText);
  }, [currentQuestionIndex, currentExam, currentQuestion]);

  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [sessionStartTime] = useState(new Date().toISOString());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityWarningMessage, setSecurityWarningMessage] = useState('');

  // CRITICAL: Always reset UI state and answers when component mounts or examId changes
  useEffect(() => {
    console.log('🎯 Component mounted/examId changed - resetting UI state');
    console.log('📍 Current examId:', examId);
    console.log('📍 Current sessionId:', sessionId);
    
    // Force reset to initial state
    setShowReviewScreen(false);
    setShowInstructions(true);
    setCurrentQuestionIndex(0);
    
    // CRITICAL: Clear all answers to prevent showing previous student's answers
    // This ensures each new exam session starts with a clean slate
    clearAnswers();
    console.log('🧹 Cleared all answers for fresh start');
    
    console.log('✅ UI state reset complete - starting fresh');
  }, [examId, setShowReviewScreen, setShowInstructions, setCurrentQuestionIndex, clearAnswers]);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        navigate('/dashboard');
        return;
      }

      // Initialize exam state - ALWAYS start on question 1, never on review screen
      console.log('🎯 Initializing exam - resetting to question 1');
      setCurrentQuestionIndex(0);
      setShowReviewScreen(false);
      setShowInstructions(true);

      try {
        console.log('🔄 Fetching exam data for ID:', examId);
        // Fetch complete exam data with questions
        const response = await api.get(`/exams/${examId}`);
        const examData = response.data;
        
        console.log('✅ Exam data received:', examData);
        console.log('📋 Questions array:', examData.questions);
        console.log('📊 Questions count:', examData.questions?.length || 0);
        
        // Decrypt questions if they are encrypted
        if (examData.questions && examData.questions.length > 0) {
          try {
            console.log('🔐 Decrypting questions...');
            examData.questions = decryptQuestions(examData.questions);
            console.log('✅ Questions decrypted successfully');
          } catch (decryptError) {
            console.error('❌ Decryption error:', decryptError);
            // If decryption fails, questions might not be encrypted
            console.log('ℹ️ Questions may not be encrypted, continuing...');
          }
        }
        
        // Update the store with complete exam data
        setCurrentExam(examData);
        
        // Clear any existing answers when starting a new exam
        console.log('🔄 Starting fresh exam, clearing any existing answers');
        clearAnswers();
        console.log('✅ Answers cleared, starting with clean state');
        
      } catch (error) {
        console.error('❌ Failed to fetch exam data:', error);
        
        // Fallback: Create mock exam data for testing
        console.log('🔄 Using mock exam data for testing');
        const mockExamData = {
          _id: examId,
          title: 'Sample Exam',
          description: 'This is a test exam with sample questions',
          duration: 60,
          totalQuestions: 6,
          passingScore: 70,
          showCalculator: true,
          showReviewScreen: true,
          showQuestionAnalysis: false,
          questions: [
            {
              _id: 'q1',
              question: 'What is the capital of France?',
              type: 'multiple-choice',
              options: ['London', 'Berlin', 'Paris', 'Madrid'],
              correctAnswer: 2,
              points: 1
            },
            {
              _id: 'q2',
              question: 'Which programming language is known for its simplicity?',
              type: 'multiple-choice',
              options: ['C++', 'Python', 'Assembly', 'Java'],
              correctAnswer: 1,
              points: 1
            },
            {
              _id: 'q3',
              question: 'What does HTML stand for?',
              type: 'multiple-choice',
              options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
              correctAnswer: 0,
              points: 1
            },
            {
              _id: 'q4',
              question: 'Match the following programming concepts:',
              type: 'match-following',
              leftItems: ['Variable', 'Function', 'Loop'],
              rightItems: ['Stores data', 'Repeats code', 'Executes code'],
              correctAnswer: { 0: 0, 1: 2, 2: 1 },
              points: 1
            },
            {
              _id: 'q5',
              question: 'What is the result of 2 + 2?',
              type: 'short-answer',
              correctAnswer: '4',
              points: 1
            },
            {
              _id: 'q6',
              question: 'Select all that are programming languages:',
              type: 'multiple-answer',
              options: ['JavaScript', 'HTML', 'Python', 'CSS', 'Java'],
              correctAnswer: [0, 2, 4],
              points: 1
            }
          ]
        };
        
        setCurrentExam(mockExamData);
        clearAnswers();
        
        // Ensure exam starts on question 1, not review screen
        setCurrentQuestionIndex(0);
        setShowReviewScreen(false);
        
        // Force clear any existing answers to ensure clean start
        setTimeout(() => {
          clearAnswers();
          setCurrentQuestionIndex(0);
          setShowReviewScreen(false);
          console.log('🧹 Force cleared answers and reset to question 1');
        }, 100);
        
        console.log('✅ Mock exam data loaded');
      }
    };

    if (!currentExam || !currentExam.questions) {
      fetchExamData();
    } else if (!sessionId) {
      navigate('/dashboard');
    }
  }, [examId, currentExam, sessionId, navigate, clearAnswers, setCurrentExam]);

  // Set up automatic photo capture intervals
  useEffect(() => {
    if (currentExam?.requirePhotoCapture && currentExam?.photoCaptureInterval && initialPhotoTaken) {
      const interval = setInterval(() => {
        setShowPhotoCapture(true);
      }, currentExam.photoCaptureInterval);

      return () => clearInterval(interval);
    }
  }, [currentExam, initialPhotoTaken]);

  // Poll session status so an admin terminating this session from Live Exam
  // Monitor actually kicks the student out — without this, the backend
  // correctly marks the session terminated but the student's screen keeps
  // running uninterrupted since answer-save failures were only logged to
  // the console, never surfaced.
  useEffect(() => {
    if (!examStarted || !sessionId) return;

    const checkSessionStatus = async () => {
      try {
        const response = await api.get(`/exams/sessions/${sessionId}/status`);
        if (response.data.status === 'terminated') {
          alert('Your exam session has been terminated by an administrator.');
          resetExam();
          navigate('/dashboard');
        } else if (response.data.status === 'expired') {
          alert('Your exam session has expired.');
          resetExam();
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to check session status:', error);
      }
    };

    const interval = setInterval(checkSessionStatus, 10000);
    return () => clearInterval(interval);
  }, [examStarted, sessionId, navigate, resetExam]);

  // Initialize webcam and microphone monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        if (currentExam?.enableWebcam || currentExam?.enableMicrophone) {
          // Check if getUserMedia is supported
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('⚠️ Media devices not supported in this browser');
            return;
          }

          const constraints = {
            video: currentExam?.enableWebcam === true,
            audio: currentExam?.enableMicrophone === true
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('🎥 Monitoring initialized:', {
            webcam: currentExam?.enableWebcam,
            microphone: currentExam?.enableMicrophone
          });
          
          // Store stream reference for cleanup
          if (window) {
            window.examMonitoringStream = stream;
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize monitoring:', error);
        // Don't show alert immediately, just log the error
        console.warn('⚠️ Camera/Microphone access not available');
      }
    };

    // Only initialize if currentExam exists
    if (currentExam) {
      initializeMonitoring();
    }

    // Cleanup on unmount
    return () => {
      try {
        if (window?.examMonitoringStream) {
          window.examMonitoringStream.getTracks().forEach(track => track.stop());
          delete window.examMonitoringStream;
        }
      } catch (error) {
        console.error('Error cleaning up monitoring stream:', error);
      }
    };
  }, [currentExam]);

  // Security Functions
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  const handleSecurityViolation = (type) => {
    const newWarningCount = securityWarnings + 1;
    setSecurityWarnings(newWarningCount);
    console.warn(`🚨 Security violation detected: ${type}`);
    
    // Log the violation
    if (sessionId) {
      api.post(`/exams/${examId}/sessions/${sessionId}/security-event`, {
        type,
        timestamp: new Date().toISOString(),
        warningCount: newWarningCount
      }).catch(console.error);
    }

    // Show custom warning modal
    if (newWarningCount >= 3) {
      setSecurityWarningMessage(`Maximum security violations reached. Your exam will be submitted automatically.`);
      setShowSecurityWarning('auto-submit');
      
      // Auto-submit after showing warning
      setTimeout(async () => {
        setShowSecurityWarning(false);
        try {
          await handleSubmit();
        } catch (error) {
          console.error('Error in auto-submit:', error);
        }
      }, 3000);
    } else {
      setSecurityWarningMessage(`Security Warning: ${type}\n\nWarning ${newWarningCount}/3. Your exam may be terminated after 3 warnings.`);
      setShowSecurityWarning('warning');
    }
  };

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If exam has started and user exits fullscreen, show warning
      if (examStarted && !isCurrentlyFullscreen) {
        handleSecurityViolation('Exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, securityWarnings]);

  // Keyboard shortcuts blocking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!examStarted) return;

      // Block common shortcuts
      const blockedKeys = [
        'F11', 'F12', // Function keys
        'Alt+Tab', 'Ctrl+Shift+I', 'Ctrl+U', 'Ctrl+Shift+J', 'Ctrl+Shift+C', // Dev tools
        'Ctrl+R', 'Ctrl+F5', 'F5', // Refresh
        'Ctrl+W', 'Ctrl+T', 'Ctrl+N', // Window/Tab management
        'Ctrl+Shift+T', 'Ctrl+Shift+N',
        'Alt+F4', // Close window
        'Ctrl+L', 'Ctrl+D', // Address bar/bookmarks
        'Ctrl+H', 'Ctrl+J', // History/Downloads
        'Ctrl+Shift+Delete', // Clear data
        'Ctrl+P', // Print
        'Ctrl+S', // Save
      ];

      // Windows key combinations
      if (e.metaKey || e.key === 'Meta') {
        e.preventDefault();
        handleSecurityViolation('Windows key pressed');
        return false;
      }

      // Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handleSecurityViolation('Alt+Tab pressed');
        return false;
      }

      // Ctrl combinations
      if (e.ctrlKey) {
        const combo = `Ctrl+${e.key}`;
        if (['r', 'R', 'w', 'W', 't', 'T', 'n', 'N', 'l', 'L', 'd', 'D', 'h', 'H', 'j', 'J', 'p', 'P', 's', 'S', 'u', 'U'].includes(e.key)) {
          e.preventDefault();
          handleSecurityViolation(`${combo} pressed`);
          return false;
        }
      }

      // Function keys
      if (e.key.startsWith('F') && ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
        e.preventDefault();
        handleSecurityViolation(`${e.key} pressed`);
        return false;
      }

      // Escape key (can exit fullscreen)
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSecurityViolation('Escape key pressed');
        return false;
      }
    };

    if (examStarted) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [examStarted, securityWarnings]);

  // Right-click blocking
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (examStarted) {
        e.preventDefault();
        handleSecurityViolation('Right-click attempted');
        return false;
      }
    };

    if (examStarted) {
      document.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStarted, securityWarnings]);

  // Window focus/blur detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (examStarted && document.hidden) {
        handleSecurityViolation('Window lost focus/minimized');
      }
    };

    const handleBlur = () => {
      if (examStarted) {
        handleSecurityViolation('Window lost focus');
      }
    };

    if (examStarted) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [examStarted, securityWarnings]);

  // Prevent text selection and drag
  useEffect(() => {
    const preventSelection = (e) => {
      if (examStarted) {
        e.preventDefault();
        return false;
      }
    };

    if (examStarted) {
      document.addEventListener('selectstart', preventSelection);
      document.addEventListener('dragstart', preventSelection);
    }

    return () => {
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventSelection);
    };
  }, [examStarted]);

  // Error fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Component Error</h2>
          <p className="text-gray-700 mb-4">There was an error loading the exam interface.</p>
          <button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!currentExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Show instructions page first
  if (showInstructions) {
    return (
      <SimpleInstructionsPage
        exam={currentExam}
        onStart={async () => {
          setShowInstructions(false);
          setExamStarted(true);
          await enterFullscreen();
        }}
      />
    );
  }

  // Show review screen before final submission (only if explicitly requested)
  console.log('🔍 Review Screen Check:', {
    showReviewScreen,
    hasCurrentExam: !!currentExam,
    hasSessionId: !!sessionId,
    questionsCount: currentExam?.questions?.length,
    showInstructions
  });

  if (showReviewScreen && currentExam) {
    console.log('✅ Showing Review Screen with data:', {
      questionsCount: currentExam?.questions?.length,
      answersCount: Object.keys(answers || {}).length,
      flaggedCount: flaggedQuestions?.length
    });
    
    
    // Ultra simple test - just return basic HTML
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        padding: '2rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            📋 Review Your Answers
          </h1>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
            Please review your answers before final submission. You can go back to change any answer.
          </p>
          
          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #bbf7d0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534', marginBottom: '0.5rem' }}>
                {Object.keys(answers || {}).filter(id => {
                  const answer = answers[id];
                  return answer !== null && answer !== undefined && answer !== '';
                }).length}
              </div>
              <div style={{ color: '#166534', fontSize: '0.875rem', fontWeight: '600' }}>✅ Answered</div>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
                {(currentExam?.questions?.length || 0) - Object.keys(answers || {}).filter(id => {
                  const answer = answers[id];
                  return answer !== null && answer !== undefined && answer !== '';
                }).length}
              </div>
              <div style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>❌ Not Answered</div>
            </div>
            <div style={{ backgroundColor: '#fffbeb', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #fed7aa', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', marginBottom: '0.5rem' }}>
                {flaggedQuestions?.length || 0}
              </div>
              <div style={{ color: '#d97706', fontSize: '0.875rem', fontWeight: '600' }}>🏁 Flagged</div>
            </div>
            <div style={{ backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #bae6fd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '0.5rem' }}>
                {currentExam?.questions?.length || 0}
              </div>
              <div style={{ color: '#0369a1', fontSize: '0.875rem', fontWeight: '600' }}>📝 Total Questions</div>
            </div>
          </div>

          {/* Question Grid */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              📊 Question Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.75rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              {(currentExam?.questions || []).map((question, index) => {
                const hasAnswer = answers?.[question._id] !== undefined && answers?.[question._id] !== null && answers?.[question._id] !== '';
                const isFlagged = flaggedQuestions?.includes(question._id);
                
                let bgColor = '#fee2e2'; // Red - Not answered
                let textColor = '#dc2626';
                let borderColor = '#fecaca';
                let status = '❌';
                
                if (hasAnswer && isFlagged) {
                  bgColor = '#f3e8ff'; // Purple - Answered & Flagged
                  textColor = '#2563eb';
                  borderColor = '#d8b4fe';
                  status = '✅🏁';
                } else if (hasAnswer) {
                  bgColor = '#dcfce7'; // Green - Answered
                  textColor = '#166534';
                  borderColor = '#bbf7d0';
                  status = '✅';
                } else if (isFlagged) {
                  bgColor = '#fef3c7'; // Yellow - Flagged only
                  textColor = '#d97706';
                  borderColor = '#fed7aa';
                  status = '🏁';
                }
                
                return (
                  <div
                    key={question._id}
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: '8px',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    title={`Question ${index + 1}: ${hasAnswer ? 'Answered' : 'Not Answered'}${isFlagged ? ' (Flagged)' : ''}`}
                  >
                    <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Q{index + 1}</div>
                    <div style={{ fontSize: '1rem' }}>{status}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>
              🔍 Legend
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#dcfce7', border: '2px solid #bbf7d0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✅</div>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#fee2e2', border: '2px solid #fecaca', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>❌</div>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Not Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#fef3c7', border: '2px solid #fed7aa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🏁</div>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Flagged</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#f3e8ff', border: '2px solid #d8b4fe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✅🏁</div>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Answered & Flagged</span>
              </div>
            </div>
          </div>

          {/* Warning for incomplete exam */}
          {(currentExam?.questions?.length || 0) - Object.keys(answers || {}).filter(id => {
            const answer = answers[id];
            return answer !== null && answer !== undefined && answer !== '';
          }).length > 0 && (
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e', margin: 0 }}>Incomplete Exam</h4>
              </div>
              <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
                You have {(currentExam?.questions?.length || 0) - Object.keys(answers || {}).filter(id => {
                  const answer = answers[id];
                  return answer !== null && answer !== undefined && answer !== '';
                }).length} unanswered question(s). We recommend answering all questions before submission.
              </p>
            </div>
          )}
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setShowReviewScreen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              <span style={{ fontSize: '1.2rem' }}>←</span>
              <span>Back to Exam</span>
            </button>
            
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              <div>Ready to submit?</div>
              <div style={{ fontSize: '0.75rem' }}>This action cannot be undone</div>
            </div>
            
            
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                backgroundColor: submitting ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#047857')}
              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#059669')}
            >
              <span>{submitting ? '⏳' : '🚀'}</span>
              <span>{submitting ? 'Submitting...' : 'Submit Exam'}</span>
            </button>
          </div>
        </div>
        
        {/* Modern Confirmation Dialog */}
        {showConfirmDialog && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowConfirmDialog(false)}
            />
            
            <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 max-w-md w-full overflow-hidden">
              <div className="h-2 bg-yellow-500" />
              
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 ring-4 ring-white shadow-lg mb-6">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-yellow-900 mb-4">
                  Submit Your Exam?
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-8">
                  Are you ready to submit your exam? Once submitted, you cannot make any changes to your answers. Please make sure you have reviewed all your responses.
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      console.log('❌ Confirmation dialog cancelled');
                      setShowConfirmDialog(false);
                    }}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('✅ Confirmation dialog confirmed - starting submission');
                      console.log('Current submitting state:', submitting);
                      
                      try {
                        setShowConfirmDialog(false);
                        console.log('Dialog closed, calling handleSubmit...');
                        await handleSubmit();
                        console.log('handleSubmit completed');
                      } catch (error) {
                        console.error('Error in confirmation handler:', error);
                      }
                    }}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Yes, Submit Exam'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Check if exam data is loaded
  console.log('📦 Exam Data Status:', {
    hasCurrentExam: !!currentExam,
    hasQuestions: !!currentExam?.questions,
    questionsLength: currentExam?.questions?.length,
    currentQuestionIndex,
    showInstructions,
    showReviewScreen
  });

  if (!currentExam || !currentExam.questions || currentExam.questions.length === 0) {
    console.log('⏳ Showing loading screen - exam data not ready');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Exam...</h2>
          <p className="text-gray-600">Please wait while we prepare your exam.</p>
          <p className="text-xs text-gray-400 mt-4">Exam ID: {examId}</p>
        </div>
      </div>
    );
  }

  console.log('✅ Exam data loaded, rendering exam interface');
  
  // currentQuestion is already defined at the top of the component
  const totalQuestions = currentExam.questions.length;
  
  // Debug: Check what's in answers object
  console.log('🔍 Current answers object:', answers);
  console.log('🔍 Answer keys:', Object.keys(answers || {}));
  
  // AGGRESSIVE FIX: Force answers to be empty for accurate counting
  const shouldForceEmpty = Object.keys(answers || {}).length > 0 && Object.values(answers || {}).every(answer => 
    answer === null || answer === undefined || answer === '' || 
    (Array.isArray(answer) && answer.length === 0) ||
    (typeof answer === 'object' && Object.keys(answer).length === 0)
  );
  
  if (shouldForceEmpty) {
    console.log('🧹 FORCE CLEARING fake answers for accurate count');
    // Temporarily override answers for counting
    var emptyAnswers = {};
  } else {
    var emptyAnswers = answers;
  }
  
  // Fix: Only count answers that actually have meaningful values
  const answeredCount = Object.keys(emptyAnswers || {}).filter(questionId => {
    const answer = emptyAnswers[questionId];
    // More strict checking - exclude empty arrays, empty objects, etc.
    if (answer === null || answer === undefined || answer === '') {
      return false;
    }
    // For arrays (multiple choice), check if it has elements
    if (Array.isArray(answer) && answer.length === 0) {
      return false;
    }
    // For objects, check if it has meaningful content
    if (typeof answer === 'object' && Object.keys(answer).length === 0) {
      return false;
    }
    return true;
  }).length;
  
  const flaggedCount = flaggedQuestions.length;
  

  const handleAnswerSelect = async (optionIndex) => {
    setAnswer(currentQuestion._id, optionIndex);
    
    try {
      await api.post(`/exams/session/${sessionId}/answer`, {
        questionId: currentQuestion._id,
        answer: optionIndex,
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleCodeAnswerChange = async (codeValue) => {
    setAnswer(currentQuestion._id, codeValue);
    
    try {
      await api.post(`/exams/session/${sessionId}/answer`, {
        questionId: currentQuestion._id,
        answer: codeValue,
      });
    } catch (error) {
      console.error('Failed to save code answer:', error);
    }
  };

  const handleToggleFlag = () => {
    toggleFlag(currentQuestion._id);
  };

  // Define handleSubmit function at component scope so it's accessible everywhere
  // Use function declaration to avoid hoisting issues
  async function handleSubmit() {
    console.log('🚀 handleSubmit called');
    
    // Close the submit modal immediately
    setShowSubmitModal(false);
    
    // Check if any questions were answered
    const answeredCount = Object.keys(answers || {}).filter(id => {
      const answer = answers[id];
      return answer !== null && answer !== undefined && answer !== '';
    }).length;

    console.log('📝 Submitting exam:', {
      sessionId: sessionId,
      totalQuestions: currentExam?.questions?.length,
      answeredQuestions: answeredCount,
      answers: answers,
      submitUrl: `/exams/session/${sessionId}/submit`
    });

    // Warn if no questions answered
    if (answeredCount === 0) {
      notificationManager.warning(
        'No Answers Provided! ⚠️',
        'You haven\'t answered any questions. Are you sure you want to submit?',
        { autoCloseDelay: 6000 }
      );
      // Continue with submission anyway - user can cancel via the confirmation dialog
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/exams/session/${sessionId}/submit`);
      
      console.log('📊 Backend response data:', response.data);
      
      // Store exam results for detailed analysis
      const examResults = {
        examTitle: currentExam.title,
        totalQuestions: currentExam.questions.length,
        answeredQuestions: Object.keys(answers || {}).filter(id => {
          const answer = answers[id];
          return answer !== null && answer !== undefined && answer !== '';
        }).length,
        flaggedQuestions: flaggedQuestions?.length || 0,
        submissionTime: new Date().toISOString(),
        sessionId: sessionId,
        score: response.data?.score || null,
        percentage: response.data?.percentage || null,
        status: response.data?.status || 'submitted',
        // Add student information from backend response
        studentName: response.data?.studentName || 'N/A',
        studentEmail: response.data?.studentEmail || 'N/A',
        duration: response.data?.duration || 'N/A',
        durationMinutes: response.data?.durationMinutes || 0,
        // Add additional backend data
        correctAnswers: response.data?.correctAnswers || response.data?.score || 0,
        incorrectAnswers: response.data?.incorrectAnswers || 0,
        unansweredQuestions: response.data?.unansweredQuestions || 0,
        questionDetails: response.data?.questionDetails || [],
        totalPoints: response.data?.totalPoints || 0,
        grade: response.data?.grade || 'N/A',
        category: response.data?.category || 'N/A',
        passed: response.data?.passed || false,
        // Store actual exam and answer data for detailed analysis
        exam: currentExam,
        answers: answers || {},
        flaggedQuestionsList: flaggedQuestions || []
      };
      
      console.log('📊 Storing exam results with showQuestionAnalysis:', currentExam.showQuestionAnalysis);
      
      // Store in localStorage for results page to access
      localStorage.setItem('lastExamResult', JSON.stringify(examResults));
      
      console.log('✅ Exam submitted successfully');
      
      // Check if admin allows students to see results
      if (currentExam.showResultsToStudents !== false) {
        console.log('📊 Navigating to results page (admin allows results viewing)');
        navigate('/live-result');
      } else {
        console.log('🚫 Results hidden by admin, showing completion message');
        // Show completion message instead of results
        const completionModal = document.createElement('div');
        completionModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        completionModal.innerHTML = `
          <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Exam Submitted Successfully!</h3>
            <div class="text-left text-gray-600 mb-6 space-y-2">
              <p class="font-medium text-gray-800">✅ Your exam has been submitted successfully</p>
              <p>📋 Your responses have been recorded and saved</p>
              <p>🔍 Your exam will be reviewed by the administrator</p>
              <p>📧 Results will be communicated to you separately via email or announcement</p>
              <p class="text-sm text-gray-500 mt-3 pt-2 border-t">Thank you for completing the exam. You may now safely close this window.</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); window.location.href='/dashboard'" 
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Return to Dashboard
            </button>
          </div>
        `;
        document.body.appendChild(completionModal);
      }
    } catch (error) {
      console.error('Failed to submit exam:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const errorDetails = error.response?.data?.details || '';
      
      // Special handling for already submitted exam
      if (error.response?.data?.error === 'Exam already submitted') {
        // Still store the exam data for results display
        const examResults = {
          examTitle: currentExam.title,
          totalQuestions: currentExam.questions.length,
          answeredQuestions: Object.keys(answers || {}).filter(id => {
            const answer = answers[id];
            return answer !== null && answer !== undefined && answer !== '';
          }).length,
          flaggedQuestions: flaggedQuestions?.length || 0,
          submissionTime: new Date().toISOString(),
          sessionId: sessionId,
          score: 0, // Unknown since submission failed
          percentage: 0,
          status: 'already_submitted',
          // Add student information (may be available in error response)
          studentName: error.response?.data?.studentName || 'N/A',
          studentEmail: error.response?.data?.studentEmail || 'N/A',
          correctAnswers: 0,
          incorrectAnswers: 0,
          unansweredQuestions: currentExam.questions.length,
          questionDetails: [],
          exam: currentExam,
          answers: answers || {},
          flaggedQuestionsList: flaggedQuestions || []
        };
        
        localStorage.setItem('lastExamResult', JSON.stringify(examResults));
        
        // Check if admin allows students to see results for already submitted exam
        if (currentExam.showResultsToStudents !== false) {
          alert('✅ This exam has already been submitted!\n\nShowing your exam summary...');
          navigate('/live-result');
        } else {
          const alreadySubmittedModal = document.createElement('div');
          alreadySubmittedModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          alreadySubmittedModal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Exam Already Submitted!</h3>
              <div class="text-left text-gray-600 mb-6 space-y-2">
                <p class="font-medium text-gray-800">ℹ️ This exam has already been submitted</p>
                <p>📋 Your previous responses are safely recorded</p>
                <p>🔍 Your exam is being reviewed by the administrator</p>
                <p>📧 Results will be communicated to you separately via email or announcement</p>
                <p class="text-sm text-gray-500 mt-3 pt-2 border-t">No further action is required from your side.</p>
              </div>
              <button onclick="this.parentElement.parentElement.remove(); window.location.href='/dashboard'" 
                      class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </button>
            </div>
          `;
          document.body.appendChild(alreadySubmittedModal);
        }
        return;
      }
      
      // Show custom error modal instead of alert
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorModal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-red-600 mb-4">Submission Failed</h3>
          <p class="text-gray-700 mb-2">${errorMessage}</p>
          ${errorDetails ? `<p class="text-sm text-gray-500 mb-4">${errorDetails}</p>` : ''}
          <div class="flex space-x-3">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Close
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove(); window.location.reload()" 
                    class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(errorModal);
    } finally {
      setSubmitting(false);
    }
  }

  // Wrapper function for modal submission
  const handleModalSubmit = async () => {
    console.log('🚀 handleModalSubmit called');
    try {
      await handleSubmit();
    } catch (error) {
      console.error('Error in handleModalSubmit:', error);
      setSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };


  // Wrap the main render in try-catch
  try {
    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TCS iON Style Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                🚀 {currentExam.title}
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Calculator Button */}
              {currentExam.showCalculator && (
                <button
                  onClick={() => setShowCalculator(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <CalcIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Calculator</span>
                </button>
              )}
              
              {/* Photo Capture Button */}
              {currentExam.requirePhotoCapture && (
                <button
                  onClick={() => setShowPhotoCapture(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden md:inline">Photo</span>
                </button>
              )}
              
              {/* Webcam Monitoring Indicator */}
              {currentExam?.enableWebcam === true && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Webcam Active</span>
                </div>
              )}
              
              {/* Microphone Monitoring Indicator */}
              {currentExam?.enableMicrophone === true && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Mic Active</span>
                </div>
              )}
              
              {/* Timer */}
              <ExamTimer 
                duration={currentExam.duration}
                startTime={sessionStartTime}
                onTimeUp={handleTimeUp}
              />
              
              {/* Navigator Button - Only show if questions exist */}
              {currentExam?.questions?.length > 0 && (
                <button
                  onClick={() => setShowNavigator(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden md:inline">Navigator</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-600">
                  {currentQuestion?.points || 1} points
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion?.question || currentQuestion?.questionText || 'Question text not available'}
              </h2>
              {/* Debug info - remove in production */}
              {!currentQuestion?.question && !currentQuestion?.questionText && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-yellow-800">⚠️ Question data: {JSON.stringify(currentQuestion, null, 2)}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleToggleFlag}
              className={`ml-4 p-2 rounded-lg transition-colors ${
                flaggedQuestions.includes(currentQuestion?._id)
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={flaggedQuestions.includes(currentQuestion?._id) ? 'Unflag' : 'Flag for review'}
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Question Content */}
          <div className="mb-8">
            {currentQuestion && (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'single-choice') && (
              <MultipleChoiceQuestion
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion._id]}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion && currentQuestion.type === 'multiple-answer' && (
              <MultipleAnswerQuestion
                question={currentQuestion}
                selectedAnswers={answers[currentQuestion._id] || []}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion && currentQuestion.type === 'short-answer' && (
              <ShortAnswerQuestion
                question={currentQuestion}
                answer={answers[currentQuestion._id]}
                onAnswerChange={handleCodeAnswerChange}
              />
            )}

            {currentQuestion && currentQuestion.type === 'match-following' && (
              <MatchFollowingQuestion
                question={currentQuestion}
                answers={answers[currentQuestion._id]}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion && currentQuestion.type === 'code-test' && (
              <CodeTestQuestion
                question={currentQuestion}
                answer={answers[currentQuestion._id]}
                onAnswerChange={handleCodeAnswerChange}
              />
            )}

            {/* Fallback for unknown question types */}
            {currentQuestion && !['multiple-choice', 'single-choice', 'multiple-answer', 'short-answer', 'match-following', 'code-test'].includes(currentQuestion.type) && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <h3 className="text-yellow-800 font-bold mb-2">⚠️ Unknown Question Type</h3>
                <p className="text-yellow-700 mb-4">Question type "{currentQuestion.type}" is not supported.</p>
                <div className="bg-white rounded p-4 text-sm">
                  <p className="font-semibold mb-2">Question Data:</p>
                  <pre className="text-xs overflow-auto">{JSON.stringify(currentQuestion, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Answered: {answeredCount} / {totalQuestions}
              </p>
              <p className="text-xs text-gray-500">
                Flagged: {flaggedCount}
              </p>
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <div className="flex space-x-3">
                {currentExam.showReviewScreen && (
                  <button
                    onClick={() => setShowReviewScreen(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>Review & Submit</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Exam</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* TCS iON Status Bar */}
      <div className="bg-gray-100 border-t px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Status:</span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Answered: {answeredCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Flagged: {flaggedCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Remaining: {totalQuestions - answeredCount}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-gray-600">
              🚀 Enhanced Interface Active
            </div>
            {examStarted && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isFullscreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isFullscreen ? '🔒 Secure Mode' : '⚠️ Not Secure'}
                </span>
                {securityWarnings > 0 && (
                  <span className="text-sm text-red-600 font-semibold">
                    ⚠️ Warnings: {securityWarnings}/3
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNavigator && (
        <QuestionNavigator
          questions={currentExam.questions}
          currentIndex={currentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onSelect={(index) => {
            setCurrentQuestionIndex(index);
            setShowNavigator(false);
          }}
          onClose={() => setShowNavigator(false)}
          onSubmit={() => {
            setShowNavigator(false);
            setShowSubmitModal(true);
          }}
        />
      )}

      {showCalculator && (
        <SimpleCalculator onClose={() => setShowCalculator(false)} />
      )}

      {showPhotoCapture && (
        <SimplePhotoCapture
          onCapture={(photoData) => {
            addPhotoCapture(photoData);
            if (!initialPhotoTaken) {
              setInitialPhotoTaken(true);
            }
          }}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}

      {showSubmitModal && (
        <SubmitConfirmation
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
          onConfirm={handleModalSubmit}
          onCancel={() => setShowSubmitModal(false)}
          onReview={() => {
            setShowSubmitModal(false);
            setShowReviewScreen(true);
          }}
          submitting={submitting}
        />
      )}

      {/* Security Warning Modal */}
      <SecurityWarningModal
        isOpen={!!showSecurityWarning}
        message={securityWarningMessage}
        onClose={async () => {
          const wasAutoSubmit = showSecurityWarning === 'auto-submit';
          setShowSecurityWarning(false);
          // Fullscreen exit is what triggers most violations, and it stays
          // exited until re-requested — this click is the user gesture
          // browsers require to allow that, so re-lock immediately.
          if (examStarted && !wasAutoSubmit) {
            await enterFullscreen();
          }
        }}
        isAutoSubmit={showSecurityWarning === 'auto-submit'}
      />

      {/* Submission Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting Exam...</h3>
            <p className="text-gray-600 text-sm">Please wait while we process your submission.</p>
          </div>
        </div>
      )}

    </div>
  );
  } catch (renderError) {
    console.error('🚨 Render Error:', renderError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">🚨 Render Error</h2>
          <p className="text-gray-700 mb-4">There was an error rendering the exam interface.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default EnhancedTCSExamInterface;
