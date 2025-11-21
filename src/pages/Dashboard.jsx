import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Award, LogOut, User, Calendar, MapPin, AlertCircle, CheckCircle2, TrendingUp, Zap, Target, Trophy, Star, ChevronRight, Play, FileText } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

function Dashboard() {
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'scheduled'
  const [lastExamResult, setLastExamResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [hoveredExam, setHoveredExam] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 });
  const [hasVisibleResults, setHasVisibleResults] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const fetchExams = useCallback(async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load exams. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await api.get('/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      // Schedules are optional, don't show error for this
    }
  }, []);

  const checkVisibleResults = useCallback(async () => {
    try {
      const response = await api.get('/results/my-results');
      const hasResults = response.data.results && response.data.results.length > 0;
      setHasVisibleResults(hasResults);
    } catch (error) {
      console.error('Error checking visible results:', error);
      setHasVisibleResults(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
    fetchSchedules();
    checkVisibleResults();
    
    // Check for exam results from localStorage
    const storedResult = localStorage.getItem('lastExamResult');
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult);
        setLastExamResult(result);
        setShowResults(true);
        // Clear the stored result after displaying
        localStorage.removeItem('lastExamResult');
      } catch (error) {
        console.error('Error parsing exam result:', error);
      }
    }
  }, [fetchExams, fetchSchedules]);

  const isExamScheduled = useCallback((examId) => {
    return schedules.some(schedule => 
      schedule.exam?._id === examId && 
      schedule.status === 'scheduled' &&
      new Date(schedule.scheduledDate) >= new Date()
    );
  }, [schedules]);

  const getScheduleForExam = useCallback((examId) => {
    return schedules.find(schedule => 
      schedule.exam?._id === examId && 
      schedule.status === 'scheduled'
    );
  }, [schedules]);

  const displayedExams = useMemo(() => {
    return viewMode === 'scheduled' 
      ? exams.filter(exam => isExamScheduled(exam._id))
      : exams;
  }, [viewMode, exams, isExamScheduled]);

  const scheduledExamsCount = useMemo(() => {
    return exams.filter(exam => isExamScheduled(exam._id)).length;
  }, [exams, isExamScheduled]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Exam Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {hasVisibleResults && (
                <button
                  onClick={() => navigate('/my-results')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">My Results</span>
                </button>
              )}
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Results Analysis */}
        {showResults && lastExamResult && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🎉 Exam Submitted Successfully!</h3>
                  <p className="text-gray-600">Here's your exam analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                📊 {lastExamResult.examTitle} - Analysis
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{lastExamResult.totalQuestions}</div>
                  <div className="text-blue-700 text-sm font-medium">Total Questions</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{lastExamResult.answeredQuestions}</div>
                  <div className="text-green-700 text-sm font-medium">Answered</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{lastExamResult.flaggedQuestions}</div>
                  <div className="text-yellow-700 text-sm font-medium">Flagged</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((lastExamResult.answeredQuestions / lastExamResult.totalQuestions) * 100)}%
                  </div>
                  <div className="text-purple-700 text-sm font-medium">Completion</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>📅 Submitted:</strong> {new Date(lastExamResult.submissionTime).toLocaleString()}
                </div>
                <div>
                  <strong>🆔 Session ID:</strong> {lastExamResult.sessionId}
                </div>
                <div>
                  <strong>📊 Status:</strong> 
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {lastExamResult.status.toUpperCase()}
                  </span>
                </div>
                {lastExamResult.score && (
                  <div>
                    <strong>🎯 Score:</strong> {lastExamResult.score} ({lastExamResult.percentage}%)
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>💡 Note:</strong> Your exam has been successfully submitted and is being processed. 
                  Results will be available in the "My Results" section once grading is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{exams.length}</div>
            </div>
            <div className="text-blue-100 text-sm font-medium">Total Exams</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{scheduledExamsCount}</div>
            </div>
            <div className="text-green-100 text-sm font-medium">Scheduled</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{exams.filter(e => e.isActive).length}</div>
            </div>
            <div className="text-purple-100 text-sm font-medium">Active Exams</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 opacity-80" />
              <div className="text-3xl font-bold">{exams.filter(e => !isExamScheduled(e._id)).length}</div>
            </div>
            <div className="text-orange-100 text-sm font-medium">Available Now</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span>Available Exams</span>
          </h2>
          <p className="text-gray-600">Select an exam to begin your assessment</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Exams ({exams.length})
          </button>
          <button
            onClick={() => setViewMode('scheduled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Scheduled Exams ({scheduledExamsCount})
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-semibold">Error Loading Exams</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    fetchExams();
                    fetchSchedules();
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your exams...</p>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedExams.map((exam) => {
              const schedule = getScheduleForExam(exam._id);
              const isHovered = hoveredExam === exam._id;
              return (
              <div
                key={exam._id}
                onMouseEnter={() => setHoveredExam(exam._id)}
                onMouseLeave={() => setHoveredExam(null)}
                className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 ${
                  isHovered ? 'border-blue-500 transform scale-105' : 'border-transparent'
                } relative overflow-hidden group`}
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isHovered ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-110' : 'bg-blue-100'
                    }`}>
                      <BookOpen className={`w-6 h-6 transition-colors ${isHovered ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                        <Zap className="w-3 h-3" />
                        <span>Available</span>
                      </span>
                      {exam.category && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                          {exam.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{exam.description}</p>

                {/* Schedule Information */}
                {schedule && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-sm text-blue-800 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-semibold">
                        {new Date(schedule.scheduledDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-blue-700">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    {schedule.venue && schedule.venue !== 'Online' && (
                      <div className="flex items-center text-sm text-blue-700 mt-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{schedule.venue}</span>
                      </div>
                    )}
                  </div>
                )}

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center border border-blue-200 hover:shadow-md transition-shadow">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg font-bold text-blue-900">{exam.duration}</div>
                      <div className="text-xs text-blue-700">minutes</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center border border-purple-200 hover:shadow-md transition-shadow">
                      <FileText className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                      <div className="text-lg font-bold text-purple-900">{exam.totalQuestions || 0}</div>
                      <div className="text-xs text-purple-700">questions</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center border border-green-200 hover:shadow-md transition-shadow">
                      <Target className="w-5 h-5 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-green-900">{exam.passingScore}%</div>
                      <div className="text-xs text-green-700">passing</div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/exam/${exam._id}/pre-checks`)}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      isHovered 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Exam</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {!loading && !error && displayedExams.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {viewMode === 'scheduled' ? 'No scheduled exams' : 'No exams available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {viewMode === 'scheduled' 
                ? 'You don\'t have any scheduled exams at the moment.' 
                : 'There are no exams available for you right now.'
              }
            </p>
            {viewMode === 'scheduled' && (
              <button
                onClick={() => setViewMode('all')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Exams
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
