import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Edit, Trash2, Save, X, CheckCircle,
  AlertCircle, BookOpen, Clock, Award, Eye, EyeOff,
  ArrowLeft, Search, Filter
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const QuestionPapers = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQP, setEditingQP] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration: 60,
    questions: [],
    isActive: true
  });

  useEffect(() => {
    fetchExamData();
    fetchQuestionPapers();
  }, [examId]);

  useEffect(() => {
    if (exam) {
      fetchAllQuestions();
    }
  }, [exam]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchExamData = async () => {
    try {
      const response = await api.get(`/admin/exams/${examId}`);
      setExam(response.data);
    } catch (error) {
      console.error('Error fetching exam:', error);
      showNotification('Failed to load exam details', 'error');
    }
  };

  const toggleQuestionPaper = async (qpId) => {
    try {
      const response = await api.put(`/admin/exams/${examId}/toggle-qp`, { questionPaperId: qpId });
      showNotification(response.data.message, 'success');
      
      // Show warning if below minimum
      if (response.data.selectedCount < response.data.minimumRequired) {
        showNotification(
          `Warning: At least ${response.data.minimumRequired} question papers must be selected. Currently ${response.data.selectedCount} selected.`,
          'error'
        );
      }
      
      fetchExamData();
    } catch (error) {
      console.error('Error toggling question paper:', error);
      showNotification('Failed to toggle question paper', 'error');
    }
  };

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exams/${examId}/question-papers`);
      setQuestionPapers(response.data);
    } catch (error) {
      console.error('Error fetching question papers:', error);
      showNotification('Failed to load question papers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      // Only fetch questions that are in the exam
      if (exam && exam.questions && exam.questions.length > 0) {
        const examQuestionIds = exam.questions.map(q => q._id || q);
        const response = await api.get('/admin/questions');
        // Filter to only show questions that are in this exam
        const examQuestions = response.data.filter(q => examQuestionIds.includes(q._id));
        setAllQuestions(examQuestions);
      } else {
        setAllQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleCreateQP = async (e) => {
    e.preventDefault();
    
    if (formData.questions.length === 0) {
      showNotification('Please select at least one question', 'error');
      return;
    }

    try {
      await api.post(`/exams/${examId}/question-papers`, formData);
      showNotification('Question Paper created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchQuestionPapers();
    } catch (error) {
      console.error('Error creating question paper:', error);
      showNotification(error.response?.data?.error || 'Failed to create question paper', 'error');
    }
  };

  const handleUpdateQP = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/question-papers/${editingQP._id}`, formData);
      showNotification('Question Paper updated successfully', 'success');
      setEditingQP(null);
      resetForm();
      fetchQuestionPapers();
    } catch (error) {
      console.error('Error updating question paper:', error);
      showNotification('Failed to update question paper', 'error');
    }
  };

  const handleDeleteQP = async (qpId) => {
    if (!window.confirm('Are you sure you want to delete this question paper?')) {
      return;
    }

    try {
      await api.delete(`/question-papers/${qpId}`);
      showNotification('Question Paper deleted successfully', 'success');
      fetchQuestionPapers();
    } catch (error) {
      console.error('Error deleting question paper:', error);
      showNotification('Failed to delete question paper', 'error');
    }
  };

  const handleToggleActive = async (qp) => {
    try {
      await api.put(`/question-papers/${qp._id}`, {
        ...qp,
        isActive: !qp.isActive
      });
      showNotification(`Question Paper ${qp.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchQuestionPapers();
    } catch (error) {
      console.error('Error toggling active status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  const openEditModal = (qp) => {
    setEditingQP(qp);
    setFormData({
      name: qp.name,
      code: qp.code,
      description: qp.description || '',
      duration: qp.duration,
      questions: qp.questions.map(q => q._id),
      isActive: qp.isActive
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      duration: 60,
      questions: [],
      isActive: true
    });
  };

  const toggleQuestionSelection = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.includes(questionId)
        ? prev.questions.filter(id => id !== questionId)
        : [...prev.questions, questionId]
    }));
  };

  const filteredQuestions = allQuestions.filter(q =>
    q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalMarks = () => {
    return formData.questions.reduce((sum, qId) => {
      const question = allQuestions.find(q => q._id === qId);
      return sum + (question?.points || 1);
    }, 0);
  };

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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/exams')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Question Papers</h1>
                <p className="text-gray-600 mt-1">{exam?.title || 'Loading...'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!exam?.questions || exam.questions.length === 0) {
                showNotification('Please add questions to exam first using "Build Exam"', 'error');
                return;
              }
              setEditingQP(null);
              resetForm();
              setShowCreateModal(true);
            }}
            disabled={!exam?.questions || exam.questions.length === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 shadow-lg ${
              !exam?.questions || exam.questions.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Create Question Paper</span>
          </button>
        </div>

        {/* No Questions Warning */}
        {exam && (!exam.questions || exam.questions.length === 0) && (
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900">No Questions in Exam</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please add questions to the exam using "Build Exam" before creating question papers.
                </p>
              </div>
              <button
                onClick={() => navigate(`/admin/exams/build/${examId}`)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
              >
                Go to Build Exam
              </button>
            </div>
          </div>
        )}

        {/* Selection Status Banner */}
        {exam && exam.questions && exam.questions.length > 0 && (
          <div className={`rounded-xl p-6 ${
            (exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2)
              ? 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2) ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3 className={`text-lg font-bold ${
                    (exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2)
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}>
                    {(exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2)
                      ? 'Exam Ready to Start'
                      : 'Selection Required'
                    }
                  </h3>
                  <p className={`text-sm ${
                    (exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2)
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {exam.selectedQuestionPapers?.length || 0} of {exam.minimumQPRequired || 2} minimum question papers selected
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  (exam.selectedQuestionPapers?.length || 0) >= (exam.minimumQPRequired || 2)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {exam.selectedQuestionPapers?.length || 0}/{exam.minimumQPRequired || 2}
                </div>
                <p className="text-xs text-gray-600 mt-1">Selected</p>
              </div>
            </div>
          </div>
        )}

        {/* Question Papers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : questionPapers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Question Papers Yet</h3>
              <p className="text-gray-600 mb-6">Create your first question paper to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Question Paper
              </button>
            </div>
          ) : (
            questionPapers.map((qp) => {
              const isSelected = exam?.selectedQuestionPapers?.some(selected => selected._id === qp._id);
              const selectedCount = exam?.selectedQuestionPapers?.length || 0;
              const minimumRequired = exam?.minimumQPRequired || 2;
              return (
              <div
                key={qp._id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-2xl ${
                  !qp.isActive ? 'opacity-60' : ''
                } ${isSelected ? 'ring-4 ring-green-500' : ''}`}
              >
                <div className={`p-6 ${
                  isSelected ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  qp.isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-white text-sm font-semibold">
                        {qp.code}
                      </span>
                      {isSelected && (
                        <span className="px-3 py-1 bg-white bg-opacity-30 rounded-full text-white text-xs font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>SELECTED</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleActive(qp)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      {qp.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{qp.name}</h3>
                  {qp.description && (
                    <p className="text-white text-opacity-90 text-sm">{qp.description}</p>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Questions</p>
                        <p className="font-semibold text-gray-900">{qp.questions?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Marks</p>
                        <p className="font-semibold text-gray-900">{qp.totalMarks || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-semibold text-gray-900">{qp.duration} minutes</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <button
                      onClick={() => toggleQuestionPaper(qp._id)}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors font-semibold ${
                        isSelected
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <X className="w-5 h-5" />
                          <span>Deselect</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Select for Exam</span>
                        </>
                      )}
                    </button>
                  </div>
                  {selectedCount > 0 && (
                    <div className={`text-center text-sm font-medium mb-3 ${
                      selectedCount >= minimumRequired ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedCount} of {minimumRequired} minimum selected
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <button
                      onClick={() => openEditModal(qp)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteQP(qp._id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {editingQP ? 'Edit Question Paper' : 'Create Question Paper'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingQP(null);
                      resetForm();
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={editingQP ? handleUpdateQP : handleCreateQP} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Paper Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Set A, Morning Paper"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code * {editingQP && '(Cannot be changed)'}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!editingQP}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., QP-A, SET-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Questions * ({formData.questions.length} selected, {calculateTotalMarks()} marks)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search questions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                      {filteredQuestions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <p>No questions available</p>
                        </div>
                      ) : (
                        filteredQuestions.map((question) => (
                          <div
                            key={question._id}
                            onClick={() => toggleQuestionSelection(question._id)}
                            className={`p-4 border-b cursor-pointer transition-colors ${
                              formData.questions.includes(question._id)
                                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.questions.includes(question._id)}
                                onChange={() => {}}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 line-clamp-2">{question.text}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-700 capitalize">
                                    {question.type}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {question.points || 1} {question.points === 1 ? 'mark' : 'marks'}
                                  </span>
                                  <span className="text-xs text-gray-600 capitalize">
                                    {question.difficulty || 'medium'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingQP(null);
                      resetForm();
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingQP ? 'Update' : 'Create'} Question Paper</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default QuestionPapers;
