import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Search, CheckSquare, Square } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function ExamBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    filterAvailableQuestions();
  }, [searchTerm, filterType, allQuestions, exam]);

  const fetchData = async () => {
    try {
      const [examsResponse, questionsResponse] = await Promise.all([
        api.get('/admin/exams'),
        api.get('/admin/questions'),
      ]);

      const currentExam = examsResponse.data.find(e => e._id === id);
      setExam(currentExam);
      setAllQuestions(questionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAvailableQuestions = () => {
    if (!exam) return;

    const examQuestionIds = exam.questions?.map(q => q._id) || [];
    let filtered = allQuestions.filter(q => !examQuestionIds.includes(q._id));

    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
  };

  const handleAddQuestion = async (questionId) => {
    try {
      await api.post(`/admin/exams/${id}/questions/${questionId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Failed to add question');
    }
  };

  const handleBulkAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      showNotification('Please select at least one question', 'error');
      return;
    }

    setBulkAdding(true);
    try {
      const response = await api.post(`/admin/exams/${id}/questions/bulk`, {
        questionIds: selectedQuestions
      });
      showNotification(response.data.message, 'success');
      setSelectedQuestions([]);
      fetchData();
    } catch (error) {
      console.error('Failed to bulk add questions:', error);
      showNotification(error.response?.data?.error || 'Failed to add questions', 'error');
    } finally {
      setBulkAdding(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q._id));
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRemoveQuestion = async (questionId) => {
    try {
      await api.delete(`/admin/exams/${id}/questions/${questionId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove question:', error);
      alert('Failed to remove question');
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'single-choice': 'Single Choice',
      'multiple-answer': 'Multiple Answer',
      'short-answer': 'Short Answer',
      'match-following': 'Match Following',
      'code-test': 'Code Test',
    };
    return labels[type] || type;
  };

  const getQuestionTypeBadge = (type) => {
    const colors = {
      'multiple-choice': 'bg-blue-100 text-blue-800',
      'single-choice': 'bg-green-100 text-green-800',
      'multiple-answer': 'bg-cyan-100 text-indigo-800',
      'short-answer': 'bg-purple-100 text-purple-800',
      'match-following': 'bg-yellow-100 text-yellow-800',
      'code-test': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!exam) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam not found</h2>
          <button
            onClick={() => navigate('/admin/exams')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Exam Management
          </button>
        </div>
      </AdminLayout>
    );
  }

  const totalPoints = exam.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

  return (
    <AdminLayout>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/exams')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exam Management
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Exam: {exam.title}</h1>
        <p className="text-gray-600">{exam.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Questions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Exam Questions</h2>
            <div className="text-sm text-gray-600">
              {exam.questions?.length || 0} questions • {totalPoints} points
            </div>
          </div>

          {!exam.questions || exam.questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No questions added yet</p>
              <p className="text-sm mt-2">Add questions from the available questions panel</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {exam.questions.map((question, index) => (
                <div
                  key={question._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-gray-500">Q{index + 1}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getQuestionTypeBadge(question.type)}`}>
                          {getQuestionTypeLabel(question.type)}
                        </span>
                        <span className="text-xs text-gray-600">{question.points} pts</span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{question.question}</p>
                      {question.category && (
                        <p className="text-xs text-gray-500 mt-1">Category: {question.category}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(question._id)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Questions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Available Questions</h2>
            {selectedQuestions.length > 0 && (
              <button
                onClick={handleBulkAddQuestions}
                disabled={bulkAdding}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{bulkAdding ? 'Adding...' : `Add ${selectedQuestions.length} Selected`}</span>
              </button>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="single-choice">Single Choice</option>
              <option value="multiple-answer">Multiple Answer</option>
              <option value="short-answer">Short Answer</option>
              <option value="match-following">Match Following</option>
              <option value="code-test">Code Test</option>
            </select>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No available questions</p>
              <p className="text-sm mt-2">
                {allQuestions.length === 0
                  ? 'Create questions in the Question Bank first'
                  : 'All questions have been added or no matches found'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All Bar */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {selectedQuestions.length === filteredQuestions.length ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span>
                      {selectedQuestions.length === filteredQuestions.length 
                        ? 'Deselect All' 
                        : 'Select All'}
                    </span>
                  </button>
                  {selectedQuestions.length > 0 && (
                    <span className="text-sm text-blue-600 font-semibold">
                      {selectedQuestions.length} selected
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredQuestions.map((question) => (
                  <div
                    key={question._id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedQuestions.includes(question._id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleQuestionSelection(question._id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {selectedQuestions.includes(question._id) ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-green-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getQuestionTypeBadge(question.type)}`}>
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          <span className="text-xs text-gray-600">{question.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2">{question.question}</p>
                        {question.category && (
                          <p className="text-xs text-gray-500 mt-1">Category: {question.category}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddQuestion(question._id)}
                        className="ml-3 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                        title="Add to exam"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredQuestions.length} available questions
            {selectedQuestions.length > 0 && (
              <span className="ml-2 text-green-600 font-semibold">
                • {selectedQuestions.length} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Exam Summary</h3>
            <div className="text-sm text-blue-800 space-x-4">
              <span>Questions: {exam.questions?.length || 0}</span>
              <span>•</span>
              <span>Total Points: {totalPoints}</span>
              <span>•</span>
              <span>Duration: {exam.duration} minutes</span>
              <span>•</span>
              <span>Passing Score: {exam.passingScore}%</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ExamBuilder;
