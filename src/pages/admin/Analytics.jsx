import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  TrendingUp, Users, BookOpen, Award, Download, Calendar, 
  Filter, FileText, BarChart3, PieChart as PieChartIcon,
  Search, RefreshCw, FileSpreadsheet, FileDown, CheckCircle,
  AlertTriangle, Target, Clock, Zap, TrendingDown, Activity,
  Eye, EyeOff, Maximize2, Minimize2, Share2, XCircle
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const Analytics = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [examComparison, setExamComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedExam, setSelectedExam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exams, setExams] = useState([]);
  const [notification, setNotification] = useState(null);
  const [expandedChart, setExpandedChart] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  useEffect(() => {
    fetchAnalytics();
    fetchExams();
  }, [timeRange, dateRange, selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (selectedExam !== 'all') params.append('examId', selectedExam);
      params.append('groupBy', timeRange === 'week' ? 'day' : 'month');

      const [dashboardResponse, timelineResponse, performanceResponse, comparisonResponse] = await Promise.all([
        api.get(`/admin/analytics/dashboard?${params.toString()}`),
        api.get(`/admin/analytics/timeline?${params.toString()}`),
        api.get(`/admin/analytics/student-performance?${params.toString()}`),
        api.get(`/admin/analytics/exam-comparison?${params.toString()}`),
      ]);

      setDashboardData(dashboardResponse.data);
      setTimelineData(timelineResponse.data);
      setStudentPerformance(performanceResponse.data || []);
      setExamComparison(comparisonResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const exportToCSV = () => {
    if (!studentPerformance.length) {
      showNotification('No data available to export', 'error');
      return;
    }
    
    try {
      const headers = ['Student Name', 'Email', 'Exams Taken', 'Avg Score', 'Pass Rate', 'Total Time (min)'];
      const rows = studentPerformance.map(s => [
        s.studentName,
        s.studentEmail,
        s.examsTaken,
        s.avgScore.toFixed(1),
        s.passRate.toFixed(1) + '%',
        s.totalTime
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showNotification(`Exported ${studentPerformance.length} student records`, 'success');
    } catch (error) {
      showNotification('Failed to export CSV', 'error');
    }
  };

  const exportToJSON = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (selectedExam !== 'all') params.append('examId', selectedExam);
      
      const response = await api.get(`/admin/analytics/export?format=json&${params.toString()}`);
      
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-full-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showNotification('Full report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showNotification('Failed to export JSON report', 'error');
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return studentPerformance;
    return studentPerformance.filter(s => 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentPerformance, searchTerm]);

  if (loading || !dashboardData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading analytics data...</p>
        </div>
      </AdminLayout>
    );
  }

  const passFailData = dashboardData.passFailStats.map(stat => ({
    name: stat._id ? 'Passed' : 'Failed',
    value: stat.count,
  }));

  const questionTypeData = dashboardData.questionTypeStats.map(stat => ({
    name: stat._id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: stat.count,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 animate-slide-in-right ${
            notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
                <span className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </span>
                Reports &amp; Analytics
              </h1>
              <p className="text-gray-500 text-sm ml-11">Comprehensive exam and student performance analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchAnalytics()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all text-sm font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <FileDown className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Exams</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>{exam.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 font-medium">Total Exams</p>
              <p className="text-4xl font-bold text-white mt-2">{dashboardData.overview.totalExams}</p>
              <p className="text-xs text-blue-100 mt-1">All exams in system</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 font-medium">Total Students</p>
              <p className="text-4xl font-bold text-white mt-2">{dashboardData.overview.totalStudents}</p>
              <p className="text-xs text-green-100 mt-1">Registered students</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-cyan-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100 font-medium">Total Sessions</p>
              <p className="text-4xl font-bold text-white mt-2">{dashboardData.overview.totalSessions}</p>
              <p className="text-xs text-purple-100 mt-1">All exam attempts</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100 font-medium">Pass Rate</p>
              <p className="text-4xl font-bold text-white mt-2">
                {passFailData.length > 0 
                  ? ((passFailData.find(d => d.name === 'Passed')?.value || 0) / 
                     passFailData.reduce((sum, d) => sum + d.value, 0) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-yellow-100 mt-1">
                {dashboardData.overview.totalSessions > 0 
                  ? `${passFailData.find(d => d.name === 'Passed')?.value || 0} of ${dashboardData.overview.totalSessions} passed`
                  : 'No completed exams yet'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pass/Fail Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Passed' ? '#10B981' : '#EF4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exam Comparison Chart */}
        {examComparison.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Performance Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="examTitle" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" name="Avg Score" fill="#3B82F6" />
                <Bar dataKey="passRate" name="Pass Rate %" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Timeline Chart */}
        {timelineData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Activity Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="passed" name="Passed" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Student Performance Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Student Performance</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exams Taken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No student data available
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr 
                      key={index} 
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowStudentDetail(true);
                      }}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-sm text-gray-500">{student.studentEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{student.examsTaken}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          student.avgScore >= 70 ? 'text-green-600' : 
                          student.avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.avgScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          student.passRate >= 70 ? 'text-green-600' : 
                          student.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.passRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{student.totalTime} min</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          student.passRate >= 70 ? 'bg-green-100 text-green-800' : 
                          student.passRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.passRate >= 70 ? 'Excellent' : student.passRate >= 50 ? 'Average' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Detail Modal */}
        {showStudentDetail && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowStudentDetail(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStudent.studentName}</h2>
                      <p className="text-blue-100">{selectedStudent.studentEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStudentDetail(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Performance Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Performance Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-xl text-white">
                      <p className="text-sm opacity-90">Exams Taken</p>
                      <p className="text-3xl font-bold mt-1">{selectedStudent.examsTaken}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl text-white">
                      <p className="text-sm opacity-90">Avg Score</p>
                      <p className="text-3xl font-bold mt-1">{selectedStudent.avgScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-cyan-600 p-4 rounded-xl text-white">
                      <p className="text-sm opacity-90">Pass Rate</p>
                      <p className="text-3xl font-bold mt-1">{selectedStudent.passRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-xl text-white">
                      <p className="text-sm opacity-90">Total Time</p>
                      <p className="text-3xl font-bold mt-1">{selectedStudent.totalTime}</p>
                      <p className="text-xs opacity-75">minutes</p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-600" />
                    Detailed Metrics
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Average Score</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              selectedStudent.avgScore >= 70 ? 'bg-green-600' : 
                              selectedStudent.avgScore >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${selectedStudent.avgScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-12 text-right">{selectedStudent.avgScore.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Pass Rate</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              selectedStudent.passRate >= 70 ? 'bg-green-600' : 
                              selectedStudent.passRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${selectedStudent.passRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-12 text-right">{selectedStudent.passRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-48 bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-12 text-right">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Status & Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className={`w-5 h-5 ${
                          selectedStudent.passRate >= 70 ? 'text-green-600' : 
                          selectedStudent.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                        <span className="font-semibold text-gray-900">Overall Status</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        selectedStudent.passRate >= 70 ? 'text-green-600' : 
                        selectedStudent.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {selectedStudent.passRate >= 70 ? 'Excellent Performance' : 
                         selectedStudent.passRate >= 50 ? 'Average Performance' : 'Needs Improvement'}
                      </p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Time Management</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {(selectedStudent.totalTime / selectedStudent.examsTaken).toFixed(1)} min/exam
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Average time per exam</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowStudentDetail(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to Reports page
                      navigate('/admin/reports');
                      showNotification('Opening Reports page...', 'success');
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Full Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;
