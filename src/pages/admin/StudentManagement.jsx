import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Eye, Ban, CheckCircle, Calendar, BookOpen,
  Upload, Plus, UserPlus, BarChart2, TrendingUp, Award,
  Filter, CheckSquare, Square, Trash2, Edit, Sparkles,
  RefreshCw, Mail, UserCheck, Activity, Target, Download
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [filterBatch, setFilterBatch] = useState('all'); // all, or specific batch
  const [batches, setBatches] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, exams
  const [selectedStudents, setSelectedStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [searchTerm, filterStatus, filterBatch, sortBy, students]);

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(s => !s.isActive);
    }

    // Batch filter
    if (filterBatch !== 'all') {
      filtered = filtered.filter(s => s.batch === filterBatch);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'exams':
          return (b.assignedExams?.length || 0) - (a.assignedExams?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      // Extract batch names for filtering
      const batchNames = response.data.map(batch => batch.name);
      setBatches(batchNames);
      console.log('✅ Fetched batches for student management:', batchNames);
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

  const toggleStudentStatus = async (studentId, currentStatus) => {
    try {
      await api.put(`/admin/students/${studentId}/status`, {
        isActive: !currentStatus,
      });
      fetchStudents();
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('Failed to update student status');
    }
  };

  const viewStudentDetails = (studentId) => {
    navigate(`/admin/students/${studentId}`);
  };

  const toggleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(selectedStudents.map(id =>
        api.put(`/admin/students/${id}/status`, { isActive: true })
      ));
      setSelectedStudents([]);
      fetchStudents();
      alert('Students activated successfully!');
    } catch (error) {
      console.error('Failed to activate students:', error);
      alert('Failed to activate some students');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(selectedStudents.map(id =>
        api.put(`/admin/students/${id}/status`, { isActive: false })
      ));
      setSelectedStudents([]);
      fetchStudents();
      alert('Students deactivated successfully!');
    } catch (error) {
      console.error('Failed to deactivate students:', error);
      alert('Failed to deactivate some students');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
      return;
    }

    try {
      await Promise.all(selectedStudents.map(id =>
        api.delete(`/admin/students/${id}`)
      ));
      setSelectedStudents([]);
      fetchStudents();
      alert('Students deleted successfully!');
    } catch (error) {
      console.error('Failed to delete students:', error);
      alert('Failed to delete some students');
    }
  };

  const getStudentStats = () => {
    const total = students.length;
    const active = students.filter(s => s.isActive).length;
    const inactive = students.filter(s => !s.isActive).length;
    const totalExams = students.reduce((sum, s) => sum + (s.assignedExams?.length || 0), 0);
    const avgExams = total > 0 ? (totalExams / total).toFixed(1) : 0;
    return { total, active, inactive, totalExams, avgExams };
  };

  const stats = getStudentStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading students...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </span>
              Student Management
            </h1>
            <p className="text-gray-500 text-sm ml-11">Manage student accounts and exam assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStudents()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => navigate('/admin/students/bulk-import')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </button>
            <button
              onClick={() => navigate('/admin/students/create')}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm opacity-90">Total Students</p>
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.active}</span>
            </div>
            <p className="text-sm opacity-90">Active Students</p>
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width: `${(stats.active/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <div className="flex items-center justify-between mb-2">
              <Ban className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.inactive}</span>
            </div>
            <p className="text-sm opacity-90">Inactive Students</p>
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width: `${(stats.inactive/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer animate-fade-in-up" style={{animationDelay: '300ms'}}>
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalExams}</span>
            </div>
            <p className="text-sm opacity-90">Total Exams Assigned</p>
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:scale-105 transition-transform cursor-pointer animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <div className="flex items-center justify-between mb-2">
              <BarChart2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.avgExams}</span>
            </div>
            <p className="text-sm opacity-90">Avg Exams/Student</p>
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Search & Filters</span>
            </h3>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterBatch('all');
                setSortBy('newest');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="exams">Most Exams</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {selectedStudents.length} student(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkActivate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-50">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e40af)' }}>
                <th className="px-5 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-blue-400 border-blue-300 rounded"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Student</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Assigned Exams</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Batch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Joined Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No students found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr 
                    key={student._id} 
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group animate-fade-in-up ${
                      selectedStudents.includes(student._id) ? 'bg-blue-50' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleSelectStudent(student._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${
                          student.isActive ? 'bg-gradient-to-br from-blue-400 to-cyan-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{student.name}</div>
                          <div className="text-xs text-gray-500">ID: {student._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{student.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{student.assignedExams?.length || 0}</div>
                          <div className="text-xs text-gray-500">exams</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.batch ? (
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {student.batch}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No batch</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 inline-flex items-center space-x-1 text-xs font-semibold rounded-full ${
                          student.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewStudentDetails(student._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/students/edit/${student._id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStudentStatus(student._id, student.isActive)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${
                            student.isActive 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={student.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {student.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  Showing {filteredStudents.length} of {students.length} students
                </span>
              </div>
              {filteredStudents.length !== students.length && (
                <span className="text-sm text-gray-500">
                  ({students.length - filteredStudents.length} filtered out)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Active: <strong>{stats.active}</strong></span>
              </div>
              <div className="flex items-center space-x-1">
                <Ban className="w-4 h-4 text-red-500" />
                <span>Inactive: <strong>{stats.inactive}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default StudentManagement;
