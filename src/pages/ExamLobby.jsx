import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Award, AlertCircle, ArrowLeft, Play, XCircle, Calendar, Timer } from 'lucide-react';
import api from '../api/axios';
import { useExamStore } from '../store/examStore';
import notificationManager from '../utils/notificationManager';

function ExamLobby() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [hasVisibleResults, setHasVisibleResults] = useState(false);
  const setCurrentExam = useExamStore((state) => state.setCurrentExam);
  const setSessionId = useExamStore((state) => state.setSessionId);
  const setSessionStartTime = useExamStore((state) => state.setSessionStartTime);
  const setShowInstructions = useExamStore((state) => state.setShowInstructions);

  useEffect(() => {
    fetchExamDetails();
    fetchSchedule();
    checkVisibleResults();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/exams/${examId}`);
      setExam(response.data);
      setCurrentExam(response.data);
    } catch (error) {
      console.error('Failed to fetch exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/schedules');
      const examSchedule = response.data.find(s => s.exam?._id === examId);
      setSchedule(examSchedule);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  const checkVisibleResults = async () => {
    try {
      const response = await api.get('/results/my-results');
      const hasResults = response.data.results && response.data.results.length > 0;
      setHasVisibleResults(hasResults);
    } catch (error) {
      console.error('Error checking visible results:', error);
      setHasVisibleResults(false);
    }
  };

  const handleStartExam = async () => {
    if (!agreed) {
      // Show modern notification for agreement requirement
      notificationManager.warning(
        'Agreement Required! ⚠️',
        'Please read and agree to the exam rules and regulations before starting.',
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

    try {
      setError(null);
      const response = await api.post(`/exams/${examId}/start`);
      setSessionId(response.data.sessionId);
      setSessionStartTime(response.data.startTime || new Date().toISOString());
      setShowInstructions(true); // Show instructions page first
      navigate(`/exam/${examId}/start`);
    } catch (error) {
      console.error('Failed to start exam:', error);
      
      // Handle specific error responses
      if (error.response?.status === 403 && error.response?.data?.details) {
        const details = error.response.data.details;
        const errorMsg = error.response.data.error || '';
        
        // Check if it's a schedule time error
        if (errorMsg.includes('not yet available') || errorMsg.includes('time has passed')) {
          setError({
            type: 'schedule_time',
            title: error.response.data.error,
            message: error.response.data.message,
            details: details
          });
        } else if (errorMsg.includes('Maximum attempts')) {
          setError({
            type: 'max_attempts',
            title: 'Maximum Attempts Reached',
            message: error.response.data.message,
            details: details
          });
        } else {
          setError({
            type: 'general',
            title: error.response.data.error || 'Unable to Start Exam',
            message: error.response.data.message || 'Failed to start exam.'
          });
        }
      } else {
        setError({
          type: 'general',
          title: 'Unable to Start Exam',
          message: error.response?.data?.error || 'Failed to start exam. Please try again or contact support.'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
            <p className="text-gray-600">{exam.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{exam.duration}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{exam.totalQuestions ?? exam.questions.length}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{exam.passingScore}%</div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
          </div>

          {/* Schedule Info */}
          {schedule && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6">
              <div className="flex items-start">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Scheduled Exam</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-blue-800">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(schedule.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center text-blue-800">
                      <Timer className="w-4 h-4 mr-2" />
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ⚠️ This exam can only be started during the scheduled time window
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`border rounded-lg p-6 mb-6 ${
              error.type === 'max_attempts' 
                ? 'bg-red-50 border-red-200' 
                : error.type === 'schedule_time'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                <XCircle className={`w-6 h-6 mt-0.5 mr-3 flex-shrink-0 ${
                  error.type === 'max_attempts' ? 'text-red-600' : 
                  error.type === 'schedule_time' ? 'text-orange-600' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${
                    error.type === 'max_attempts' ? 'text-red-900' : 
                    error.type === 'schedule_time' ? 'text-orange-900' : 'text-yellow-900'
                  }`}>
                    {error.title}
                  </h3>
                  <p className={`mb-3 ${
                    error.type === 'max_attempts' ? 'text-red-800' : 
                    error.type === 'schedule_time' ? 'text-orange-800' : 'text-yellow-800'
                  }`}>
                    {error.message}
                  </p>
                  
                  {error.type === 'schedule_time' && error.details && (
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Scheduled Date:</span>
                          <p className="font-bold text-orange-600">
                            {new Date(error.details.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Time Window:</span>
                          <p className="font-bold text-orange-600">
                            {error.details.startTime} - {error.details.endTime}
                          </p>
                        </div>
                        {error.details.minutesUntilStart && (
                          <div className="md:col-span-2">
                            <span className="text-gray-600">Time Until Start:</span>
                            <p className="font-bold text-orange-600 text-lg">
                              {error.details.minutesUntilStart} minutes
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {error.type === 'max_attempts' && error.details && (
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Attempts Used:</span>
                          <p className="font-bold text-red-600 text-lg">
                            {error.details.attemptsUsed} / {error.details.attemptsAllowed}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-bold text-red-600 text-lg">No Attempts Left</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`text-sm ${
                    error.type === 'max_attempts' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {error.type === 'max_attempts' ? (
                      <>
                        <p className="font-semibold mb-2">What you can do:</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Contact your instructor or administrator for assistance</li>
                          <li>• Review your previous attempts in the Results section</li>
                          <li>• Check if additional attempts can be granted</li>
                        </ul>
                      </>
                    ) : (
                      <p>Please try again or contact support if the problem persists.</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Return to Dashboard
                    </button>
                    {hasVisibleResults && (
                      <button
                        onClick={() => navigate('/my-results')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View My Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Important Instructions</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Once started, the timer cannot be paused</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• You can flag questions for review</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Do not refresh the page during the exam</li>
                  <li>• Submit your exam before time runs out</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Exam Rules & Regulations</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>1. This is a timed examination. You must complete all questions within the allocated time.</p>
              <p>2. Each question carries equal points unless otherwise specified.</p>
              <p>3. There is no negative marking for incorrect answers.</p>
              <p>4. You must achieve at least {exam.passingScore}% to pass this examination.</p>
              <p>5. Ensure you review all your answers before final submission.</p>
              <p>6. Once submitted, you cannot change your answers.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agree" className="ml-2 text-sm text-gray-700 font-medium">
                I have read and agree to the exam rules and regulations
              </label>
            </div>
            <p className="text-xs text-blue-600 ml-6">
              ⚠️ Note: You will need to agree to additional terms on the next page before starting the exam.
            </p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!agreed}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Exam</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamLobby;
