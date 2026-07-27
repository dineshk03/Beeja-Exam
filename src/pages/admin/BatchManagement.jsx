import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Edit, Trash2, Search, Calendar, BookOpen,
  CheckCircle, XCircle, AlertCircle, Save, X, Sparkles,
  RefreshCw, TrendingUp, Award, Target, Layers
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function BatchManagement() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    filterBatches();
  }, [searchTerm, batches]);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      setBatches(response.data);
      setFilteredBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const filterBatches = () => {
    if (!searchTerm) {
      setFilteredBatches(batches);
      return;
    }

    const filtered = batches.filter(batch =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBatches(filtered);
  };

  const handleDelete = async (id, batchName) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) {
      return;
    }

    try {
      await api.delete(`/batches/${id}`);
      setSuccess('Batch deleted successfully');
      fetchBatches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete batch');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStats = () => {
    const total = batches.length;
    const active = batches.filter(b => b.isActive).length;
    const totalStudents = batches.reduce((sum, b) => sum + (b.studentCount || 0), 0);
    const avgStudents = total > 0 ? (totalStudents / total).toFixed(1) : 0;

    return { total, active, totalStudents, avgStudents };
  };

  const stats = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </span>
              Batch Management
            </h1>
            <p className="text-gray-500 text-sm ml-11">Create and manage student batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchBatches()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <Plus className="w-4 h-4" />
              Create Batch
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm opacity-90">Total Batches</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.active}</span>
            </div>
            <p className="text-sm opacity-90">Active Batches</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalStudents}</span>
            </div>
            <p className="text-sm opacity-90">Total Students</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.avgStudents}</span>
            </div>
            <p className="text-sm opacity-90">Avg Students/Batch</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search batches by name, description, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No batches found' : 'No batches created yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Create your first batch to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create First Batch
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch, index) => (
              <div
                key={batch._id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{batch.name}</h3>
                    {batch.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{batch.description}</p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    batch.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {batch.year && (
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Year</p>
                        <p className="text-sm font-bold text-gray-900">{batch.year}</p>
                      </div>
                    </div>
                  )}
                  {batch.department && (
                    <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-bold text-gray-900">{batch.department}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg col-span-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-sm font-bold text-gray-900">{batch.studentCount || 0} students</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditingBatch(batch)}
                    className="flex-1 p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                    title="Edit Batch"
                  >
                    <Edit className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch._id, batch.name)}
                    className="flex-1 p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingBatch) && (
          <BatchModal
            batch={editingBatch}
            onClose={() => {
              setShowCreateModal(false);
              setEditingBatch(null);
            }}
            onSuccess={() => {
              fetchBatches();
              setShowCreateModal(false);
              setEditingBatch(null);
              setSuccess(editingBatch ? 'Batch updated successfully' : 'Batch created successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Batch Modal Component
function BatchModal({ batch, onClose, onSuccess }) {
  const isEdit = !!batch;
  const [formData, setFormData] = useState({
    name: batch?.name || '',
    description: batch?.description || '',
    year: batch?.year || '',
    department: batch?.department || '',
    startDate: batch?.startDate ? batch.startDate.split('T')[0] : '',
    endDate: batch?.endDate ? batch.endDate.split('T')[0] : '',
    isActive: batch?.isActive !== undefined ? batch.isActive : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await api.put(`/batches/${batch._id}`, formData);
      } else {
        await api.post('/batches', formData);
      }
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} batch`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Batch' : 'Create New Batch'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Batch Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 2024-A, Morning Batch"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Brief description of this batch"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label className="text-sm font-medium text-gray-900">
              Active Batch
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Batch' : 'Create Batch'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchManagement;
