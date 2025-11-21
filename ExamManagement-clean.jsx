import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Users, BookOpen, Clock, 
  Award, Settings, Eye, EyeOff, X, Check, AlertCircle,
  Calendar, Target, FileText, Camera, Video, Mic
} from 'lucide-react';
import api from '../../api/axios';

function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch exams');
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchExams();
  };

  const handleEditSuccess = () => {
    setEditingExam(null);
    fetchExams();
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await api.delete(`/admin/exams/${examId}`);
        fetchExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
        setError('Failed to delete exam');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingExam(exam)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteExam(exam._id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{exam.description}</p>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{exam.duration} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{exam.passingScore}% passing score</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{exam.questions?.length || 0} questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{exam.assignedStudents?.length || 0} students assigned</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  exam.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {exam.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center space-x-2">
                  {exam.showQuestionAnalysis && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" title="Question Analysis Enabled"></div>
                  )}
                  {exam.showCalculator && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Calculator Enabled"></div>
                  )}
                  {exam.enableWebcam && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Webcam Monitoring"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    // Advanced Features
    showCalculator: exam.showCalculator || false,
    showReviewScreen: exam.showReviewScreen || false,
    showQuestionAnalysis: exam.showQuestionAnalysis || false,
    requirePhotoCapture: exam.requirePhotoCapture || false,
    photoCaptureInterval: exam.photoCaptureInterval || 300000,
    enableWebcam: exam.enableWebcam || false,
    enableMicrophone: exam.enableMicrophone || false,
    instructions: exam.instructions || '',
    rules: exam.rules || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
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

          {/* Advanced Features */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Features</h3>
            
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
                  <p className="text-xs text-gray-600">Require webcam to be on during exam</p>
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
                  <p className="text-xs text-gray-600">Require microphone to be on during exam</p>
                </div>
              </label>
            </div>
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
    // Advanced Features
    showCalculator: false,
    showReviewScreen: false,
    showQuestionAnalysis: false,
    requirePhotoCapture: false,
    photoCaptureInterval: 300000,
    enableWebcam: false,
    enableMicrophone: false,
    instructions: '',
    rules: [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
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

          {/* Advanced Features */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Features</h3>
            
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
                  <p className="text-xs text-gray-600">Require webcam to be on during exam</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableMicrophone}
                  onChange={(e) => setFormData({ ...formData, enableMicrophone: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:radio-2 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">🎤 Enable Microphone Monitoring</span>
                  <p className="text-xs text-gray-600">Require microphone to be on during exam</p>
                </div>
              </label>
            </div>
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
