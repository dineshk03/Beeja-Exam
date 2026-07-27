import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, Filter, FileQuestion,
  Copy, BookOpen, Target, BarChart2, TrendingUp,
  CheckSquare, Square, Award, Tag, Clock, Upload,
  Eye, RefreshCw, Sparkles, AlertCircle, CheckCircle2,
  XCircle, Zap, ArrowUpDown
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [exams, setExams] = useState([]);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
    fetchExams();
  }, []);

  useEffect(() => {
    filterAndSortQuestions();
  }, [searchTerm, filterType, filterCategory, filterDifficulty, sortBy, questions]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/admin/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  };

  const filterAndSortQuestions = () => {
    let filtered = [...questions];

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(q => q.category === filterCategory);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'points':
          return (b.points || 0) - (a.points || 0);
        case 'difficulty':
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
        default:
          return 0;
      }
    });

    setFilteredQuestions(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const duplicateQuestion = async (question) => {
    try {
      const duplicatedData = {
        ...question,
        question: `${question.question} (Copy)`,
      };
      delete duplicatedData._id;
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;
      await api.post('/admin/questions', duplicatedData);
      fetchQuestions();
      alert('Question duplicated successfully!');
    } catch (error) {
      console.error('Failed to duplicate question:', error);
      alert('Failed to duplicate question');
    }
  };

  const toggleSelectQuestion = (questionId) => {
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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) {
      return;
    }

    try {
      await Promise.all(selectedQuestions.map(id => api.delete(`/admin/questions/${id}`)));
      setSelectedQuestions([]);
      fetchQuestions();
      alert('Questions deleted successfully!');
    } catch (error) {
      console.error('Failed to delete questions:', error);
      alert('Failed to delete some questions');
    }
  };

  const handleAssignToExam = async (examId) => {
    try {
      await Promise.all(selectedQuestions.map(questionId =>
        api.post(`/admin/exams/${examId}/questions/${questionId}`)
      ));
      setSelectedQuestions([]);
      setShowAssignModal(false);
      alert('Questions assigned to exam successfully!');
    } catch (error) {
      console.error('Failed to assign questions:', error);
      alert('Failed to assign some questions');
    }
  };

  const getQuestionStats = () => {
    const total = questions.length;
    const byType = {
      'multiple-choice': questions.filter(q => q.type === 'multiple-choice').length,
      'single-choice': questions.filter(q => q.type === 'single-choice').length,
      'short-answer': questions.filter(q => q.type === 'short-answer').length,
      'match-following': questions.filter(q => q.type === 'match-following').length,
      'code-test': questions.filter(q => q.type === 'code-test').length,
    };
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const avgPoints = total > 0 ? (totalPoints / total).toFixed(1) : 0;
    const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    return { total, byType, totalPoints, avgPoints, categories };
  };

  const stats = getQuestionStats();

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'single-choice': 'Single Choice',
      'multiple-answer': 'Multiple Answer',
      'short-answer': 'Short Answer',
      'match-following': 'Match Following',
      'code-test': 'Code Test',
      'hotspot': 'Hotspot',
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
      'hotspot': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      hard: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return badges[difficulty] || badges.easy;
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-cyan-600" />
              </span>
              Question Bank
            </h1>
            <p className="text-gray-500 text-sm ml-11">Manage all your exam questions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQuestions()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => navigate('/admin/questions/bulk-import')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </button>
            <button
              onClick={() => navigate('/admin/questions/create')}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <FileQuestion className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm opacity-90">Total Questions</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.byType['multiple-choice']}</span>
            </div>
            <p className="text-sm opacity-90">Multiple Choice</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.avgPoints}</span>
            </div>
            <p className="text-sm opacity-90">Avg Points</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <Tag className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.categories.length}</span>
            </div>
            <p className="text-sm opacity-90">Categories</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.totalPoints}</span>
            </div>
            <p className="text-sm opacity-90">Total Points</p>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters & Search</span>
            </h3>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterDifficulty('all');
                setSortBy('newest');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">All Types</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="single-choice">Single Choice</option>
              <option value="multiple-answer">Multiple Answer</option>
              <option value="short-answer">Short Answer</option>
              <option value="match-following">Match Following</option>
              <option value="code-test">Code Test</option>
              <option value="hotspot">Hotspot</option>
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="points">Highest Points</option>
              <option value="difficulty">By Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-6">
            {questions.length === 0
              ? 'Start building your question bank by adding your first question'
              : 'No questions match your search criteria'}
          </p>
          {questions.length === 0 && (
            <button
              onClick={() => navigate('/admin/questions/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Question
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuestions.map((question, index) => {
                const diffBadge = getDifficultyBadge(question.difficulty);
                const DiffIcon = diffBadge.icon;
                return (
                  <tr 
                    key={question._id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {question.question}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getQuestionTypeBadge(question.type)}`}>
                        {getQuestionTypeLabel(question.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center space-x-1 w-fit ${diffBadge.color}`}>
                        <DiffIcon className="w-3 h-3" />
                        <span className="capitalize">{question.difficulty || 'medium'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Tag className="w-3 h-3" />
                        <span>{question.category || 'General'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm font-semibold text-gray-900">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span>{question.points}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => duplicateQuestion(question)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all hover:scale-110"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/questions/edit/${question._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FileQuestion className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                Showing {filteredQuestions.length} of {questions.length} questions
              </span>
            </div>
            {filteredQuestions.length !== questions.length && (
              <span className="text-sm text-gray-500">
                ({questions.length - filteredQuestions.length} filtered out)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4 text-yellow-500" />
              <span>Total Points: <strong>{stats.totalPoints}</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <Tag className="w-4 h-4 text-orange-500" />
              <span>Categories: <strong>{stats.categories.length}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default QuestionBank;
