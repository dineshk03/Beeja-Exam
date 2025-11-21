import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Users, MapPin, Plus, Edit, Trash2, Settings,
  Search, Filter, BarChart2, CheckCircle, XCircle, AlertCircle,
  Copy, Eye, BookOpen, Award, TrendingUp, Activity, FileText,
  Layers, Target, Zap
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const Scheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const [formData, setFormData] = useState({
    examId: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    maxCandidates: 50,
    venue: 'Online',
    proctorSettings: {
      webcamRequired: true,
      screenRecording: false,
      idVerification: true,
      browserLockdown: false,
    },
  });

  useEffect(() => {
    fetchSchedules();
    fetchExams();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [searchTerm, filterStatus, filterDate, schedules]);

  const filterSchedules = () => {
    let filtered = [...schedules];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.scheduledDate).toISOString().split('T')[0];
        return scheduleDate === filterDate;
      });
    }

    setFilteredSchedules(filtered);
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/admin/schedules');
      setSchedules(response.data);
      setFilteredSchedules(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.put(`/admin/schedules/${editingSchedule._id}`, formData);
        alert('Schedule updated successfully!');
      } else {
        await api.post('/admin/schedules', formData);
        alert('Schedule created successfully!');
      }
      
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      examId: schedule.exam._id,
      scheduledDate: new Date(schedule.scheduledDate).toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maxCandidates: schedule.maxCandidates,
      venue: schedule.venue,
      proctorSettings: schedule.proctorSettings,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await api.delete(`/admin/schedules/${id}`);
      alert('Schedule deleted successfully!');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert(error.response?.data?.error || 'Failed to delete schedule');
    }
  };

  const handleDuplicate = (schedule) => {
    setEditingSchedule(null);
    setFormData({
      examId: schedule.exam._id,
      scheduledDate: '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maxCandidates: schedule.maxCandidates,
      venue: schedule.venue,
      proctorSettings: schedule.proctorSettings,
    });
    setShowModal(true);
  };

  const stats = useMemo(() => {
    // Filter out schedules with deleted exams
    const validSchedules = schedules.filter(s => s.exam);
    
    const total = validSchedules.length;
    const scheduled = validSchedules.filter(s => s.status === 'scheduled').length;
    const ongoing = validSchedules.filter(s => s.status === 'ongoing').length;
    const completed = validSchedules.filter(s => s.status === 'completed').length;
    const totalCapacity = validSchedules.reduce((sum, s) => sum + (s.maxCandidates || 0), 0);
    const totalRegistered = validSchedules.reduce((sum, s) => sum + (s.registeredCandidates?.length || 0), 0);
    return { total, scheduled, ongoing, completed, totalCapacity, totalRegistered };
  }, [schedules]);

  const resetForm = () => {
    setFormData({
      examId: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      maxCandidates: 50,
      venue: 'Online',
      proctorSettings: {
        webcamRequired: true,
        screenRecording: false,
        idVerification: true,
        browserLockdown: false,
      },
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.scheduled;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Exam Scheduling</h1>
            <p className="text-gray-600 mt-1">Schedule and manage exam sessions</p>
          </div>
          <button
            onClick={() => {
              setEditingSchedule(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Schedule</span>
          </button>
        </div>

        {/* Warning for orphaned schedules */}
        {schedules.length > 0 && schedules.filter(s => !s.exam).length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Orphaned Schedules Detected</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  {schedules.filter(s => !s.exam).length} schedule(s) reference deleted exams and won't be displayed.
                  These schedules should be cleaned up.
                </p>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete all schedules with deleted exams?')) {
                      try {
                        const orphanedIds = schedules.filter(s => !s.exam).map(s => s._id);
                        await Promise.all(orphanedIds.map(id => api.delete(`/admin/schedules/${id}`)));
                        alert('Orphaned schedules deleted successfully!');
                        fetchSchedules();
                      } catch (error) {
                        alert('Failed to delete orphaned schedules');
                      }
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  Clean Up Orphaned Schedules
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setHoveredCard('total')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setHoveredCard('scheduled')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 transition-all duration-300">{stats.scheduled}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer animate-pulse"
            onMouseEnter={() => setHoveredCard('ongoing')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ongoing</p>
                <p className="text-2xl font-bold text-green-600 transition-all duration-300">{stats.ongoing}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setHoveredCard('completed')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600 transition-all duration-300">{stats.completed}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setHoveredCard('capacity')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-2xl font-bold text-purple-600 transition-all duration-300">{stats.totalCapacity}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onMouseEnter={() => setHoveredCard('registered')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registered</p>
                <p className="text-2xl font-bold text-orange-600 transition-all duration-300">{stats.totalRegistered}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        {filteredSchedules.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-start space-x-3">
              <Activity className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Upcoming Schedules</p>
                    <p className="text-lg font-bold text-blue-600">
                      {filteredSchedules.filter(s => s.status === 'scheduled').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Average Capacity Utilization</p>
                    <p className="text-lg font-bold text-green-600">
                      {filteredSchedules.length > 0 
                        ? Math.round((filteredSchedules.reduce((sum, s) => sum + (s.registeredCandidates.length / s.maxCandidates), 0) / filteredSchedules.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Students Scheduled</p>
                    <p className="text-lg font-bold text-purple-600">
                      {filteredSchedules.reduce((sum, s) => sum + s.registeredCandidates.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by exam or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Filter by date"
            />
            {(searchTerm || filterStatus !== 'all' || filterDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterDate('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Schedules List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  {schedules.length === 0 
                    ? 'No schedules found. Create your first schedule to get started.'
                    : 'No schedules match your filters.'}
                </td>
              </tr>
            ) : (
              filteredSchedules.map((schedule) => {
                // Skip schedules with deleted exams
                if (!schedule.exam) return null;
                
                return (
                <React.Fragment key={schedule._id}>
                <tr 
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                  onClick={() => setExpandedRow(expandedRow === schedule._id ? null : schedule._id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`transform transition-transform duration-300 ${
                        expandedRow === schedule._id ? 'rotate-90' : ''
                      }`}>
                        <Zap className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{schedule.exam.title}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {schedule.exam.duration} min
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {schedule.exam.questions?.length || 0} questions
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <Target className="w-3 h-3 mr-1" />
                          {schedule.exam.passingScore}% pass
                        </span>
                      </div>
                      {schedule.exam.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full hover:bg-indigo-200 transition-colors">
                          {schedule.exam.category}
                        </span>
                      )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(schedule.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{schedule.venue}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {schedule.registeredCandidates.length} / {schedule.maxCandidates}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            (schedule.registeredCandidates.length / schedule.maxCandidates) >= 0.8 
                              ? 'bg-red-500' 
                              : (schedule.registeredCandidates.length / schedule.maxCandidates) >= 0.5 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(schedule.registeredCandidates.length / schedule.maxCandidates) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {schedule.maxCandidates - schedule.registeredCandidates.length} slots left
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadge(schedule.status)} transform transition-all duration-200 hover:scale-110 inline-flex items-center space-x-1`}>
                      {schedule.status === 'ongoing' && <Activity className="w-3 h-3 animate-pulse" />}
                      {schedule.status === 'scheduled' && <Clock className="w-3 h-3" />}
                      {schedule.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      <span className="capitalize">{schedule.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === schedule._id ? null : schedule._id);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110 transform"
                        title="Toggle Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(schedule);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 transform"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(schedule);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110 transform"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(schedule._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 transform"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Row Details */}
                {expandedRow === schedule._id && (
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
                    <td colSpan="6" className="px-6 py-4">
                      <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Exam Details */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-blue-600" />
                              Exam Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Title:</span>
                                <span className="font-medium">{schedule.exam.title}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{schedule.exam.duration} minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Questions:</span>
                                <span className="font-medium">{schedule.exam.questions?.length || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Passing Score:</span>
                                <span className="font-medium">{schedule.exam.passingScore}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium">{schedule.exam.category || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Proctoring Settings */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Settings className="w-4 h-4 mr-2 text-green-600" />
                              Proctoring Settings
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Webcam Required:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  schedule.proctorSettings.webcamRequired 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {schedule.proctorSettings.webcamRequired ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Screen Recording:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  schedule.proctorSettings.screenRecording 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {schedule.proctorSettings.screenRecording ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">ID Verification:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  schedule.proctorSettings.idVerification 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {schedule.proctorSettings.idVerification ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Browser Lockdown:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  schedule.proctorSettings.browserLockdown 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {schedule.proctorSettings.browserLockdown ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Registered Students Preview */}
                        {schedule.registeredCandidates.length > 0 && (
                          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Users className="w-4 h-4 mr-2 text-purple-600" />
                              Registered Students ({schedule.registeredCandidates.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {schedule.registeredCandidates.slice(0, 10).map((student, idx) => (
                                <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  Student {idx + 1}
                                </span>
                              ))}
                              {schedule.registeredCandidates.length > 10 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                  +{schedule.registeredCandidates.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Exam Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exam *
                </label>
                <select
                  value={formData.examId}
                  onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an exam</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title} ({exam.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Venue and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Candidates
                  </label>
                  <input
                    type="number"
                    value={formData.maxCandidates}
                    onChange={(e) => setFormData({ ...formData, maxCandidates: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Proctoring Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Settings className="w-4 h-4 inline mr-1" />
                  Proctoring Settings
                </label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.proctorSettings.webcamRequired}
                      onChange={(e) => setFormData({
                        ...formData,
                        proctorSettings: { ...formData.proctorSettings, webcamRequired: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Require Webcam</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.proctorSettings.screenRecording}
                      onChange={(e) => setFormData({
                        ...formData,
                        proctorSettings: { ...formData.proctorSettings, screenRecording: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable Screen Recording</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.proctorSettings.idVerification}
                      onChange={(e) => setFormData({
                        ...formData,
                        proctorSettings: { ...formData.proctorSettings, idVerification: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Require ID Verification</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.proctorSettings.browserLockdown}
                      onChange={(e) => setFormData({
                        ...formData,
                        proctorSettings: { ...formData.proctorSettings, browserLockdown: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Browser Lockdown Mode</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
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

export default Scheduling;
