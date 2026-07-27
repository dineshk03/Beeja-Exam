import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Users, BookOpen, Clock, 
  Award, Settings, Eye, EyeOff, X, Check, AlertCircle,
  Calendar, Target, FileText, Camera, Video, Mic,
  Search, Filter, TrendingUp, Copy, BarChart2, CheckSquare,
  Square, MoreHorizontal, Zap, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function ExamManagement() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalQuestions: 0,
    averageQuestions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Bulk Selection States
  const [selectedExams, setSelectedExams] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Batch Assignment States
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedExamForBatch, setSelectedExamForBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [assigningBatch, setAssigningBatch] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchBatches();
  }, []);

  useEffect(() => {
    filterAndSortExams();
  }, [exams, searchTerm, filterStatus, sortBy]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
      calculateStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch exams');
      setLoading(false);
    }
  };

  const calculateStats = (examData) => {
    const totalExams = examData.length;
    const activeExams = examData.filter(exam => exam.isActive).length;
    const totalQuestions = examData.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0);
    const averageQuestions = totalExams > 0 ? Math.round(totalQuestions / totalExams) : 0;

    setStats({
      totalExams,
      activeExams,
      totalQuestions,
      averageQuestions
    });
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      // Extract batch names for assignment
      const batchNames = response.data.map(batch => batch.name);
      setBatches(batchNames);
      console.log('✅ Fetched batches for exam management:', batchNames);
    } catch (error) {
      console.error('Error fetching batches from /batches:', error);
      // Fallback to admin endpoint
      try {
        const fallbackResponse = await api.get('/admin/batches');
        setBatches(fallbackResponse.data);
      } catch (fallbackError) {
        console.error('Error fetching batches from fallback:', fallbackError);
      }
    }
  };

  const openBatchModal = (exam) => {
    setSelectedExamForBatch(exam);
    setSelectedBatch('');
    setShowBatchModal(true);
  };

  const handleBatchAssignment = async () => {
    if (!selectedBatch) {
      setError('Please select a batch');
      return;
    }

    setAssigningBatch(true);
    try {
      const response = await api.post(`/admin/exams/${selectedExamForBatch._id}/assign-batch`, {
        batch: selectedBatch
      });
      
      setSuccess(response.data.message);
      setShowBatchModal(false);
      setSelectedBatch('');
      fetchExams(); // Refresh exam data
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error assigning batch:', error);
      setError(error.response?.data?.error || 'Failed to assign batch to exam');
      setTimeout(() => setError(''), 5000);
    } finally {
      setAssigningBatch(false);
    }
  };

  const filterAndSortExams = () => {
    let filtered = [...exams];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(exam => 
        filterStatus === 'active' ? exam.isActive : !exam.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'questions':
          return (b.questions?.length || 0) - (a.questions?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredExams(filtered);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSuccess('Exam created successfully!');
    fetchExams();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditSuccess = () => {
    setEditingExam(null);
    setSuccess('Exam updated successfully!');
    fetchExams();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await api.delete(`/admin/exams/${examId}`);
        setSuccess('Exam deleted successfully!');
        fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting exam:', error);
        setError('Failed to delete exam');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const duplicateExam = async (exam) => {
    try {
      const duplicatedExam = {
        ...exam,
        title: `${exam.title} (Copy)`,
        questions: [], // Reset questions for new exam
        assignedStudents: [], // Reset assigned students
        isActive: false // Start as inactive
      };
      delete duplicatedExam._id;
      delete duplicatedExam.createdAt;
      delete duplicatedExam.updatedAt;

      await api.post('/admin/exams', duplicatedExam);
      setSuccess('Exam duplicated successfully!');
      fetchExams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error duplicating exam:', error);
      setError('Failed to duplicate exam');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      await api.put(`/admin/exams/${examId}`, { isActive: !currentStatus });
      setSuccess(`Exam ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchExams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling exam status:', error);
      setError('Failed to update exam status');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Bulk Selection Functions
  const toggleSelectExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExams.length === filteredExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map(exam => exam._id));
    }
  };

  const clearSelection = () => {
    setSelectedExams([]);
    setShowBulkActions(false);
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedExams.length} exams?`)) {
      try {
        await Promise.all(selectedExams.map(id => api.delete(`/admin/exams/${id}`)));
        setSuccess(`${selectedExams.length} exams deleted successfully!`);
        clearSelection();
        fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting exams:', error);
        setError('Failed to delete some exams');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(selectedExams.map(id => 
        api.put(`/admin/exams/${id}`, { isActive: true })
      ));
      setSuccess(`${selectedExams.length} exams activated successfully!`);
      clearSelection();
      fetchExams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error activating exams:', error);
      setError('Failed to activate some exams');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(selectedExams.map(id => 
        api.put(`/admin/exams/${id}`, { isActive: false })
      ));
      setSuccess(`${selectedExams.length} exams deactivated successfully!`);
      clearSelection();
      fetchExams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deactivating exams:', error);
      setError('Failed to deactivate some exams');
      setTimeout(() => setError(''), 3000);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
            <span className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </span>
            Exam Management
          </h1>
          <p className="text-gray-500 text-sm ml-11">Manage exams, questions, and monitor performance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalExams}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeExams}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Questions</p>
              <p className="text-3xl font-bold text-orange-600">{stats.averageQuestions}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="questions">Most Questions</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || filterStatus !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedExams.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedExams.length} exam{selectedExams.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <CheckSquare className="w-4 h-4 inline mr-1" />
                Activate
              </button>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <Square className="w-4 h-4 inline mr-1" />
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Bulk Selection Header */}
      {filteredExams.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedExams.length === filteredExams.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({filteredExams.length} exams)
              </span>
            </label>
            <div className="text-sm text-gray-500">
              {filteredExams.length} of {exams.length} exams shown
            </div>
          </div>
        </div>
      )}

      {/* Exam Cards */}
      {filteredExams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <div 
              key={exam._id} 
              className={`bg-white rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
                selectedExams.includes(exam._id) ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-200'
              }`}
            >
              {/* Header with Checkbox and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedExams.includes(exam._id)}
                    onChange={() => toggleSelectExam(exam._id)}
                    className="w-5 h-5 mt-1 text-blue-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{exam.title}</h3>
                    {exam.category && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">Category:</span>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full">
                          {exam.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                  exam.isActive 
                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' 
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                }`}>
                  {exam.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">{exam.description}</p>

              {/* Statistics Grid - More Visual */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-bold text-gray-900">{exam.duration} min</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="text-sm font-bold text-gray-900">{exam.questions?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-500">Pass Score</p>
                    <p className="text-sm font-bold text-gray-900">{exam.passingScore}%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="text-sm font-bold text-gray-900">{exam.assignedStudents?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Attempts</p>
                    <p className="text-sm font-bold text-gray-900">{exam.allowedAttempts || 1}</p>
                  </div>
                </div>
              </div>

              {/* Feature Indicators */}
              <div className="flex items-center space-x-2 mb-5 pb-5 border-b border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Features:</span>
                <div className="flex items-center space-x-1.5">
                  {exam.showQuestionAnalysis && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="Question Analysis"></div>
                  )}
                  {exam.showCalculator && (
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="Calculator"></div>
                  )}
                  {exam.enableWebcam && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title="Webcam"></div>
                  )}
                  {!exam.showResultsToStudents && (
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" title="Results Hidden from Students"></div>
                  )}
                  {!exam.showQuestionAnalysis && !exam.showCalculator && !exam.enableWebcam && exam.showResultsToStudents && (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
              </div>

              {/* Action Buttons - More Interactive */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                <button
                  onClick={() => setViewingExam(exam)}
                  className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="View Details"
                >
                  <Eye className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => setEditingExam(exam)}
                  className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Edit Exam"
                >
                  <Edit2 className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => navigate(`/admin/exams/build/${exam._id}`)}
                  className="p-2.5 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Build Exam"
                >
                  <Settings className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => navigate(`/admin/exams/${exam._id}/question-papers`)}
                  className="p-2.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Question Papers"
                >
                  <FileText className="w-4 h-4 mx-auto" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 mb-2">
                <button
                  onClick={() => duplicateExam(exam)}
                  className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => openBatchModal(exam)}
                  className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Assign to Batch"
                >
                  <Users className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => toggleExamStatus(exam._id, exam.isActive)}
                  className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                    exam.isActive 
                      ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={exam.isActive ? 'Deactivate' : 'Activate'}
                >
                  {exam.isActive ? <EyeOff className="w-4 h-4 mx-auto" /> : <Check className="w-4 h-4 mx-auto" />}
                </button>
                <button
                  onClick={() => handleDeleteExam(exam._id)}
                  className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-16">
          {searchTerm || filterStatus !== 'all' ? (
            // No Search Results
            <div className="max-w-md mx-auto">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams found</h3>
              <p className="text-gray-600 mb-6">
                No exams match your current search and filter criteria.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            // No Exams Created
            <div className="max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exams created yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first exam with questions and settings.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Exam
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingExam && (
        <EditExamModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {viewingExam && (
        <ViewExamModal
          exam={viewingExam}
          onClose={() => setViewingExam(null)}
        />
      )}

      {/* Batch Assignment Modal */}
      {showBatchModal && selectedExamForBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assign to Batch</h2>
                <p className="text-sm text-gray-600 mt-1">Assign all students from a batch to this exam</p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border-l-4 border-purple-500 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{selectedExamForBatch.title}</h3>
                    <p className="text-sm text-gray-600">
                      Currently assigned: <strong>{selectedExamForBatch.assignedStudents?.length || 0}</strong> students
                    </p>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Batch *
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="">-- Select a batch --</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              {batches.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>No batches found. Create students with batch information first.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchAssignment}
                disabled={!selectedBatch || assigningBatch}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {assigningBatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Assign Batch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

// ViewExamModal Component
function ViewExamModal({ exam, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Exam Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
            <p className="text-gray-600">{exam.description}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-bold text-blue-600">{exam.duration} min</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-lg font-bold text-purple-600">{exam.questions?.length || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Pass Score</p>
              <p className="text-lg font-bold text-yellow-600">{exam.passingScore}%</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-lg font-bold text-green-600">{exam.assignedStudents?.length || 0}</p>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Allowed Attempts</p>
                <p className="text-lg font-bold text-orange-600">{exam.allowedAttempts || 1}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Features Enabled</h4>
            <div className="flex flex-wrap gap-2">
              {exam.showQuestionAnalysis && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Question Analysis
                </span>
              )}
              {exam.showCalculator && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Calculator
                </span>
              )}
              {exam.showReviewScreen && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Review Screen
                </span>
              )}
              {exam.enableWebcam && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  Webcam Monitoring
                </span>
              )}
              {exam.enableMicrophone && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Microphone Monitoring
                </span>
              )}
              {!exam.showResultsToStudents && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  Results Hidden from Students
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditExamModal({ exam, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: exam.title,
    description: exam.description,
    duration: exam.duration,
    passingScore: exam.passingScore,
    category: exam.category || '',
    allowedAttempts: exam.allowedAttempts || 1,
    negativeMarking: {
      enabled: exam.negativeMarking?.enabled || false,
      deductionValue: exam.negativeMarking?.deductionValue ?? 0.25,
    },
    // Advanced Features
    showCalculator: exam.showCalculator || false,
    showReviewScreen: exam.showReviewScreen || false,
    showQuestionAnalysis: exam.showQuestionAnalysis || false,
    showResultsToStudents: exam.showResultsToStudents !== undefined ? exam.showResultsToStudents : true,
    requirePhotoCapture: exam.requirePhotoCapture || false,
    photoCaptureInterval: exam.photoCaptureInterval || 300000,
    enableWebcam: exam.enableWebcam || false,
    enableMicrophone: exam.enableMicrophone || false,
    // Pre-Exam Settings
    requireWebcam: exam.requireWebcam !== undefined ? exam.requireWebcam : true,
    requireMicrophone: exam.requireMicrophone !== undefined ? exam.requireMicrophone : true,
    requireIdentityVerification: exam.requireIdentityVerification !== undefined ? exam.requireIdentityVerification : true,
    allowMobileDevices: exam.allowMobileDevices || false,
    instructions: exam.instructions || '',
    rules: exam.rules || [],
  });
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreExamSettings, setShowPreExamSettings] = useState(false);
   const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('📤 Sending exam update data:', {
        requireWebcam: formData.requireWebcam,
        requireMicrophone: formData.requireMicrophone,
        requireIdentityVerification: formData.requireIdentityVerification,
        allowMobileDevices: formData.allowMobileDevices
      });
      await api.put(`/admin/exams/${exam._id}`, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to update exam:', error);
      alert('Failed to update exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Exam</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., JavaScript, Mathematics, General"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Helps organize exams by subject or type</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%) *
              </label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Attempts *
            </label>
            <input
              type="number"
              value={formData.allowedAttempts}
              onChange={(e) => setFormData({ ...formData, allowedAttempts: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Number of times a student can attempt this exam</p>
          </div>

          {/* Negative Marking */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.negativeMarking?.enabled || false}
                onChange={(e) => setFormData({ ...formData, negativeMarking: { ...formData.negativeMarking, enabled: e.target.checked } })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <div>
                <span className="font-medium text-gray-900">Negative Marking</span>
                <p className="text-xs text-gray-600">Deduct marks for wrong answers</p>
              </div>
            </label>
            {formData.negativeMarking?.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deduction per wrong answer (fraction of question marks)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1"
                  value={formData.negativeMarking?.deductionValue ?? 0.25}
                  onChange={(e) => setFormData({ ...formData, negativeMarking: { ...formData.negativeMarking, deductionValue: parseFloat(e.target.value) } })}
                  className="w-32 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 0.25 deducts 25% of the question's marks for a wrong answer</p>
              </div>
            )}
          </div>

          {/* Advanced Features */}
          {/* Advanced Features */}
<div className="border-t border-gray-200 pt-6">
  <button
    type="button"
    onClick={() => setShowAdvanced(!showAdvanced)}
    className="flex items-center justify-between w-full text-left mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
  >
    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">🎯 Advanced Features</h3>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 group-hover:text-blue-600">
        {showAdvanced ? 'Hide' : 'Show'}
      </span>
      {showAdvanced ? (
        <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  </button>
  
  {showAdvanced && (
    <div className="space-y-4">
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.showCalculator}
          onChange={(e) => setFormData({ ...formData, showCalculator: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">🧮 Enable Calculator</span>
          <p className="text-xs text-gray-600">Show on-screen calculator during exam</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.showReviewScreen}
          onChange={(e) => setFormData({ ...formData, showReviewScreen: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📊 Enable Review Screen</span>
          <p className="text-xs text-gray-600">Let students review answers before final submission</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.showQuestionAnalysis}
          onChange={(e) => setFormData({ ...formData, showQuestionAnalysis: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">🎯 Show Question Analysis</span>
          <p className="text-xs text-gray-600">Show correct/wrong answers after exam submission</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.showResultsToStudents}
          onChange={(e) => setFormData({ ...formData, showResultsToStudents: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📊 Show Results to Students</span>
          <p className="text-xs text-gray-600">Allow students to view their exam results after submission</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.requirePhotoCapture}
          onChange={(e) => setFormData({ ...formData, requirePhotoCapture: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📸 Enable Photo Proctoring</span>
          <p className="text-xs text-gray-600">Capture student photos during exam</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.enableWebcam}
          onChange={(e) => setFormData({ ...formData, enableWebcam: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📹 Enable Webcam Monitoring</span>
          <p className="text-xs text-gray-600">Monitor webcam during exam (live proctoring)</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.enableMicrophone}
          onChange={(e) => setFormData({ ...formData, enableMicrophone: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">🎤 Enable Microphone Monitoring</span>
          <p className="text-xs text-gray-600">Monitor audio during exam (live proctoring)</p>
        </div>
      </label>
    </div>
  )}
</div>

{/* Pre-Exam Settings */}
<div className="border-t border-gray-200 pt-6">
  <button
    type="button"
    onClick={() => setShowPreExamSettings(!showPreExamSettings)}
    className="flex items-center justify-between w-full text-left mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
  >
    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">🔒 Pre-Exam Settings</h3>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 group-hover:text-green-600">
        {showPreExamSettings ? 'Hide' : 'Show'}
      </span>
      {showPreExamSettings ? (
        <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  </button>
  
  {showPreExamSettings && (
    <div className="space-y-4">
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.requireWebcam}
          onChange={(e) => setFormData({ ...formData, requireWebcam: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📹 Require Webcam</span>
          <p className="text-xs text-gray-600">Webcam must be enabled for pre-exam checks</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.requireMicrophone}
          onChange={(e) => setFormData({ ...formData, requireMicrophone: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">🎤 Require Microphone</span>
          <p className="text-xs text-gray-600">Microphone must be enabled for pre-exam checks</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.requireIdentityVerification}
          onChange={(e) => setFormData({ ...formData, requireIdentityVerification: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">🆔 Require Identity Verification</span>
          <p className="text-xs text-gray-600">Students must upload ID and take photo</p>
        </div>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.allowMobileDevices}
          onChange={(e) => setFormData({ ...formData, allowMobileDevices: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <span className="font-medium text-gray-900">📱 Allow Mobile Devices</span>
          <p className="text-xs text-gray-600">Allow students to take exam on mobile devices</p>
        </div>
      </label>
    </div>
  )}
</div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateExamModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 70,
    category: '',
    allowedAttempts: 3,
    negativeMarking: { enabled: false, deductionValue: 0.25 },
    // Advanced Features
    showCalculator: false,
    showReviewScreen: false,
    showQuestionAnalysis: false,
    showResultsToStudents: true,
    requirePhotoCapture: false,
    photoCaptureInterval: 300000,
    enableWebcam: false,
    enableMicrophone: false,
    // Pre-Exam Settings
    requireWebcam: true,
    requireMicrophone: true,
    requireIdentityVerification: true,
    allowMobileDevices: false,
    instructions: '',
    rules: [],
  });
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreExamSettings, setShowPreExamSettings] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('📤 Creating exam with data:', {
        requireWebcam: formData.requireWebcam,
        requireMicrophone: formData.requireMicrophone,
        requireIdentityVerification: formData.requireIdentityVerification,
        allowMobileDevices: formData.allowMobileDevices
      });
      const response = await api.post('/admin/exams', formData);
      console.log('✅ Exam created successfully:', response.data);
      onSuccess();
    } catch (error) {
      console.error('❌ Failed to create exam:', error);
      alert('Failed to create exam: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Exam</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., JavaScript Advanced"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Brief description of the exam"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., JavaScript, Mathematics, General"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Helps organize exams by subject or type</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%) *
              </label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Attempts *
            </label>
            <input
              type="number"
              value={formData.allowedAttempts}
              onChange={(e) => setFormData({ ...formData, allowedAttempts: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Number of times a student can attempt this exam</p>
          </div>

          {/* Negative Marking */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <label className="flex items-center space-x-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.negativeMarking?.enabled || false}
                onChange={(e) => setFormData({ ...formData, negativeMarking: { ...formData.negativeMarking, enabled: e.target.checked } })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <div>
                <span className="font-medium text-gray-900">Negative Marking</span>
                <p className="text-xs text-gray-600">Deduct marks for wrong answers</p>
              </div>
            </label>
            {formData.negativeMarking?.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deduction per wrong answer (fraction of question marks)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1"
                  value={formData.negativeMarking?.deductionValue ?? 0.25}
                  onChange={(e) => setFormData({ ...formData, negativeMarking: { ...formData.negativeMarking, deductionValue: parseFloat(e.target.value) } })}
                  className="w-32 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 0.25 deducts 25% of the question's marks for a wrong answer</p>
              </div>
            )}
          </div>

          {/* Advanced Features */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">🎯 Advanced Features</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 group-hover:text-blue-600">
                  {showAdvanced ? 'Hide' : 'Show'}
                </span>
                {showAdvanced ? (
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>
            
            {showAdvanced && (
              <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showCalculator}
                  onChange={(e) => setFormData({ ...formData, showCalculator: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🧮 Enable Calculator</span>
                  <p className="text-xs text-gray-600">Show on-screen calculator during exam</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showReviewScreen}
                  onChange={(e) => setFormData({ ...formData, showReviewScreen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📊 Enable Review Screen</span>
                  <p className="text-xs text-gray-600">Let students review answers before final submission</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showQuestionAnalysis}
                  onChange={(e) => setFormData({ ...formData, showQuestionAnalysis: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🎯 Show Question Analysis</span>
                  <p className="text-xs text-gray-600">Show correct/wrong answers after exam submission</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showResultsToStudents}
                  onChange={(e) => setFormData({ ...formData, showResultsToStudents: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📊 Show Results to Students</span>
                  <p className="text-xs text-gray-600">Allow students to view their exam results after submission</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requirePhotoCapture}
                  onChange={(e) => setFormData({ ...formData, requirePhotoCapture: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📸 Enable Photo Proctoring</span>
                  <p className="text-xs text-gray-600">Capture student photos during exam</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableWebcam}
                  onChange={(e) => setFormData({ ...formData, enableWebcam: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📹 Enable Webcam Monitoring</span>
                  <p className="text-xs text-gray-600">Monitor webcam during exam (live proctoring)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableMicrophone}
                  onChange={(e) => setFormData({ ...formData, enableMicrophone: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🎤 Enable Microphone Monitoring</span>
                  <p className="text-xs text-gray-600">Monitor audio during exam (live proctoring)</p>
                </div>
              </label>
              </div>
            )}
          </div>

          {/* Pre-Exam Settings */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowPreExamSettings(!showPreExamSettings)}
              className="flex items-center justify-between w-full text-left mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">🔒 Pre-Exam Settings</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 group-hover:text-green-600">
                  {showPreExamSettings ? 'Hide' : 'Show'}
                </span>
                {showPreExamSettings ? (
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>
            
            {showPreExamSettings && (
              <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireWebcam}
                  onChange={(e) => setFormData({ ...formData, requireWebcam: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📹 Require Webcam</span>
                  <p className="text-xs text-gray-600">Webcam must be enabled for pre-exam checks</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireMicrophone}
                  onChange={(e) => setFormData({ ...formData, requireMicrophone: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🎤 Require Microphone</span>
                  <p className="text-xs text-gray-600">Microphone must be enabled for pre-exam checks</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireIdentityVerification}
                  onChange={(e) => setFormData({ ...formData, requireIdentityVerification: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🆔 Require Identity Verification</span>
                  <p className="text-xs text-gray-600">Students must upload ID and take photo</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowMobileDevices}
                  onChange={(e) => setFormData({ ...formData, allowMobileDevices: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">📱 Allow Mobile Devices</span>
                  <p className="text-xs text-gray-600">Allow students to take exam on mobile devices</p>
                </div>
              </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {saving ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamManagement;
