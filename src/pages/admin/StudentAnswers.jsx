import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Eye, Download, CheckCircle,
  XCircle, Clock, User, BookOpen, Award, TrendingUp,
  ChevronDown, ChevronUp, AlertCircle, Calendar
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const StudentAnswers = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exams, setExams] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchExams();
  }, [filterExam, filterStatus]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterExam !== 'all') params.append('examId', filterExam);
      
      const response = await api.get(`/admin/sessions/detailed?${params.toString()}`);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showNotification('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/admin/sessions/${sessionId}/details`);
      setSessionDetails(response.data);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Error fetching session details:', error);
      showNotification('Failed to load session details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const exportSessionData = () => {
    if (!sessionDetails) return;

    const csvData = [
      ['Question #', 'Question Text', 'Type', 'Student Answer', 'Correct Answer', 'Result'],
      ...sessionDetails.questionDetails.map((q, idx) => [
        idx + 1,
        q.questionText,
        q.questionType,
        formatAnswer(q.studentAnswer),
        formatAnswer(q.correctAnswer),
        q.isCorrect ? 'Correct' : 'Incorrect'
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-answers-${sessionDetails.session.student.name}-${Date.now()}.csv`;
    link.click();
    showNotification('Answers exported successfully', 'success');
  };

  const formatAnswer = (answer) => {
    if (answer === null || answer === undefined) return 'Not answered';
    if (typeof answer === 'object') return JSON.stringify(answer);
    return answer.toString();
  };

  const getAnswerDisplay = (question) => {
    const { questionType, studentAnswer, options } = question;

    switch (questionType) {
      case 'multiple-choice':
      case 'single-choice':
        if (options && options[studentAnswer] !== undefined) {
          return options[studentAnswer];
        }
        return formatAnswer(studentAnswer);
      
      case 'multiple-answer':
        if (Array.isArray(studentAnswer) && options) {
          return studentAnswer.map(idx => options[idx]).join(', ');
        }
        return formatAnswer(studentAnswer);
      
      default:
        return formatAnswer(studentAnswer);
    }
  };

  const getCorrectAnswerDisplay = (question) => {
    const { questionType, correctAnswer, options } = question;

    switch (questionType) {
      case 'multiple-choice':
      case 'single-choice':
        if (options && options[correctAnswer] !== undefined) {
          return options[correctAnswer];
        }
        return formatAnswer(correctAnswer);
      
      case 'multiple-answer':
        if (Array.isArray(correctAnswer) && options) {
          return correctAnswer.map(idx => options[idx]).join(', ');
        }
        return formatAnswer(correctAnswer);
      
      default:
        return formatAnswer(correctAnswer);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'passed' && session.passed) ||
      (filterStatus === 'failed' && !session.passed);

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Answers Review</h1>
              <p className="text-gray-600 mt-1">View detailed answers and question-by-question analysis</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search student or exam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Exams</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>{exam.title}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Exam Sessions</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredSessions.length} sessions found</p>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium">No sessions found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session._id}
                    onClick={() => fetchSessionDetails(session._id)}
                    className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                      selectedSession === session._id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-600'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <p className="font-semibold text-gray-900">{session.student?.name}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{session.exam?.title}</span>
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : 'N/A'}</span>
                          </span>
                          <span className={`text-xs font-bold ${session.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {session.percentage?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {session.grade || 'N/A'}
                        </span>
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Answer Details</h2>
                {sessionDetails && (
                  <button
                    onClick={exportSessionData}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {detailsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading details...</p>
                </div>
              ) : !sessionDetails ? (
                <div className="p-8 text-center text-gray-500">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium">Select a session to view details</p>
                  <p className="text-sm mt-2">Click on any session from the list</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Student</p>
                        <p className="font-semibold text-gray-900">{sessionDetails.session.student?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="font-semibold text-gray-900">{sessionDetails.session.percentage?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Correct Answers</p>
                        <p className="font-semibold text-green-600">
                          {sessionDetails.session.correctAnswers} / {sessionDetails.session.totalQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Grade</p>
                        <p className="font-semibold text-blue-600">{sessionDetails.session.grade}</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span>Question-by-Question Analysis</span>
                    </h3>
                    {sessionDetails.questionDetails && sessionDetails.questionDetails.length > 0 ? (
                      sessionDetails.questionDetails.map((question, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                            question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div
                            onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                            className="p-4 cursor-pointer hover:bg-opacity-70 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700">
                                    Q{question.questionOrder || index + 1}
                                  </span>
                                  <span className="text-xs text-gray-600 capitalize">{question.questionType}</span>
                                  {question.isCorrect ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {question.questionText}
                                </p>
                              </div>
                              {expandedQuestion === index ? (
                                <ChevronUp className="w-5 h-5 text-gray-600 ml-2" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600 ml-2" />
                              )}
                            </div>
                          </div>

                          {expandedQuestion === index && (
                            <div className="px-4 pb-4 space-y-3 animate-fade-in">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Student's Answer:</p>
                                <p className="text-sm text-gray-900">{getAnswerDisplay(question)}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Correct Answer:</p>
                                <p className="text-sm text-green-700 font-medium">{getCorrectAnswerDisplay(question)}</p>
                              </div>
                              {question.options && question.options.length > 0 && (
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-2">All Options:</p>
                                  <div className="space-y-1">
                                    {question.options.map((option, idx) => (
                                      <div key={idx} className="text-sm text-gray-700 flex items-center space-x-2">
                                        <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                                        <span>{option}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No question details available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StudentAnswers;
