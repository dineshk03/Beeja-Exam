import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Filter, Calendar, Users, BookOpen,
  TrendingUp, Award, Clock, Target, BarChart3, PieChart,
  FileSpreadsheet, FileDown, Printer, Mail, Share2,
  CheckCircle, AlertTriangle, RefreshCw, Eye, Search,
  ChevronDown, ChevronUp, Zap, Activity, Shield, XCircle
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduledReports, setShowScheduledReports] = useState(false);
  const [showReportHistory, setShowReportHistory] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);

  const reportTypes = [
    {
      id: 'student_wise',
      name: 'Student-Wise Report',
      description: 'Individual student performance across all exams',
      icon: Users,
      color: 'blue',
      fields: ['Student Name', 'Email', 'Batch', 'Exams Taken', 'Passed', 'Failed', 'Avg Score', 'Grade']
    },
    {
      id: 'batch_wise',
      name: 'Batch-Wise Report',
      description: 'Performance analysis by batch',
      icon: Users,
      color: 'purple',
      fields: ['Batch Name', 'Total Students', 'Exams Taken', 'Avg Score', 'Pass Rate', 'Top Performer']
    },
    {
      id: 'exam_wise',
      name: 'Exam-Wise Report',
      description: 'Detailed statistics for each exam',
      icon: BookOpen,
      color: 'green',
      fields: ['Exam Title', 'Total Attempts', 'Passed', 'Failed', 'Avg Score', 'Highest Score', 'Lowest Score']
    },
    {
      id: 'pass_fail',
      name: 'Pass/Fail Report',
      description: 'Students who passed or failed exams',
      icon: Target,
      color: 'red',
      fields: ['Student Name', 'Exam', 'Score', 'Status', 'Grade', 'Date']
    },
    {
      id: 'student_performance',
      name: 'Student Performance Report',
      description: 'Detailed analysis of individual student performance',
      icon: Users,
      color: 'blue',
      fields: ['Student Name', 'Email', 'Exams Taken', 'Avg Score', 'Pass Rate', 'Total Time']
    },
    {
      id: 'exam_summary',
      name: 'Exam Summary Report',
      description: 'Overview of exam statistics and results',
      icon: BookOpen,
      color: 'green',
      fields: ['Exam Title', 'Total Attempts', 'Avg Score', 'Pass Rate', 'Duration']
    },
    {
      id: 'batch_analysis',
      name: 'Batch Analysis Report',
      description: 'Performance comparison across batches',
      icon: Target,
      color: 'purple',
      fields: ['Batch Name', 'Students', 'Avg Score', 'Pass Rate', 'Completion Rate']
    },
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Student attendance and participation tracking',
      icon: CheckCircle,
      color: 'orange',
      fields: ['Student', 'Scheduled Exams', 'Attended', 'Missed', 'Attendance %']
    },
    {
      id: 'proctoring',
      name: 'Proctoring Report',
      description: 'Security incidents and proctoring alerts',
      icon: Shield,
      color: 'red',
      fields: ['Student', 'Exam', 'Incidents', 'Severity', 'Status']
    },
    {
      id: 'time_analysis',
      name: 'Time Analysis Report',
      description: 'Time spent analysis and efficiency metrics',
      icon: Clock,
      color: 'indigo',
      fields: ['Student', 'Total Time', 'Avg Time/Exam', 'Efficiency Score']
    },
    {
      id: 'question_analysis',
      name: 'Question Analysis Report',
      description: 'Question difficulty and performance analysis',
      icon: BarChart3,
      color: 'pink',
      fields: ['Question', 'Attempts', 'Correct %', 'Avg Time', 'Difficulty']
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'Complete system analytics and insights',
      icon: FileText,
      color: 'gray',
      fields: ['All metrics and detailed analysis']
    }
  ];

  useEffect(() => {
    fetchExams();
    fetchBatches();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      console.log('Fetched exams:', response.data);
      setExams(response.data || []);
      if (!response.data || response.data.length === 0) {
        console.warn('No exams found in the system');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
      showNotification('Failed to load exams', 'error');
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      console.log('✅ Fetched batches for reports:', response.data);
      setBatches(response.data || []);
      if (!response.data || response.data.length === 0) {
        console.warn('No batches found in the system');
      }
    } catch (error) {
      console.error('Error fetching batches from /batches:', error);
      // Fallback to admin endpoint
      try {
        const fallbackResponse = await api.get('/admin/batches');
        const batchObjects = fallbackResponse.data.map(batchName => ({
          _id: batchName,
          name: batchName
        }));
        setBatches(batchObjects);
      } catch (fallbackError) {
        console.error('Error fetching batches from fallback:', fallbackError);
        setBatches([]);
        showNotification('Failed to load batches', 'error');
      }
    }
  };

  const generateReport = async (reportType, format = 'csv') => {
    setGeneratingReport(reportType);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (selectedExam !== 'all') params.append('examId', selectedExam);
      if (selectedBatch !== 'all') params.append('batchId', selectedBatch);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await api.get(`/admin/reports/${reportType}?${params.toString()}`);
      console.log('Report data:', response.data);

      if (format === 'preview') {
        if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
          showNotification('No data available for this report. Try creating some exam sessions first.', 'error');
        } else {
          setPreviewData({
            type: reportType,
            data: response.data
          });
          setShowPreview(true);
          showNotification('Report data loaded successfully', 'success');
        }
      } else if (format === 'csv') {
        // Use backend CSV export for proper escaping
        const exportUrl = `/api/admin/reports/${reportType}/export?${params.toString()}`;
        const token = localStorage.getItem('auth-token');
        const csvRes = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const csvBlob = await csvRes.blob();
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification('CSV report exported successfully', 'success');
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showNotification('JSON report exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification(error.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
      setGeneratingReport(null);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await api.get('/admin/scheduled-reports');
      setScheduledReports(response.data);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      showNotification('Failed to load scheduled reports', 'error');
    }
  };

  const fetchReportHistory = async () => {
    try {
      const response = await api.get('/admin/report-history');
      setReportHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching report history:', error);
      showNotification('Failed to load report history', 'error');
    }
  };

  const scheduleReport = async (reportType) => {
    showNotification('Report scheduling feature coming soon!', 'success');
  };

  const emailReport = async (reportType) => {
    showNotification('Email report feature coming soon!', 'success');
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-cyan-600',
      green: 'from-green-500 to-emerald-600',
      purple: 'from-purple-500 to-cyan-600',
      orange: 'from-orange-500 to-red-600',
      red: 'from-red-500 to-pink-600',
      indigo: 'from-cyan-500 to-purple-600',
      pink: 'from-pink-500 to-rose-600',
      gray: 'from-gray-600 to-gray-700'
    };
    return colors[color] || colors.blue;
  };

  const filteredReportTypes = selectedReportType === 'all' 
    ? reportTypes 
    : reportTypes.filter(r => r.id === selectedReportType);

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
                <span className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </span>
                Report Management
              </h1>
              <p className="text-gray-500 text-sm ml-11">Generate, export, and manage comprehensive reports</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Info Banner */}
        {(!exams || exams.length === 0 || !batches || batches.length === 0) && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Getting Started</h3>
                <p className="text-sm text-blue-800 mt-1">
                  {!exams || exams.length === 0 ? 'No exams found. Create some exams first. ' : ''}
                  {!batches || batches.length === 0 ? 'No batches found. Create some batches first. ' : ''}
                  Reports require completed exam sessions to generate data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters & Options</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Report Types</option>
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Exams</option>
                {Array.isArray(exams) && exams.map(exam => (
                  <option key={exam._id} value={exam._id}>{exam.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {Array.isArray(batches) && batches.map(batch => (
                  <option key={batch._id} value={batch._id}>{batch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setSelectedExam('all');
                  setSelectedBatch('all');
                  setSelectedStatus('all');
                  setSelectedReportType('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReportTypes.map((report) => {
            const Icon = report.icon;
            const isExpanded = expandedReport === report.id;
            const isGenerating = generatingReport === report.id;

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className={`bg-gradient-to-br ${getColorClasses(report.color)} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Icon className="w-8 h-8" />
                    </div>
                    <button
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{report.name}</h3>
                  <p className="text-sm opacity-90">{report.description}</p>
                </div>

                <div className="p-4">
                  {isExpanded && (
                    <div className="mb-4 animate-fade-in">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Included Fields:</h4>
                      <div className="flex flex-wrap gap-1">
                        {report.fields.map((field, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => generateReport(report.id, 'preview')}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>View Report</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => generateReport(report.id, 'csv')}
                        disabled={isGenerating}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => generateReport(report.id, 'json')}
                        disabled={isGenerating}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>JSON</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => emailReport(report.id)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </button>
                        <button
                          onClick={() => scheduleReport(report.id)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Schedule</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => generateReport('comprehensive', 'preview')}
              className="flex items-center justify-center space-x-3 px-6 py-4 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Zap className="w-6 h-6" />
              <span className="font-semibold">Generate All Reports</span>
            </button>
            <button
              onClick={() => {
                fetchScheduledReports();
                setShowScheduledReports(true);
              }}
              className="flex items-center justify-center space-x-3 px-6 py-4 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Calendar className="w-6 h-6" />
              <span className="font-semibold">View Scheduled Reports</span>
            </button>
            <button
              onClick={() => {
                fetchReportHistory();
                setShowReportHistory(true);
              }}
              className="flex items-center justify-center space-x-3 px-6 py-4 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Activity className="w-6 h-6" />
              <span className="font-semibold">Report History</span>
            </button>
          </div>
        </div>

        {/* Report Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-white" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {reportTypes.find(r => r.id === previewData.type)?.name || 'Report Preview'}
                      </h2>
                      <p className="text-purple-100 text-sm">
                        Generated on {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {Array.isArray(previewData.data) && previewData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(previewData.data[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).map((value, vidx) => (
                              <td key={vidx} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {typeof value === 'object' ? JSON.stringify(value) : value?.toString() || 'N/A'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No data available for this report</p>
                    <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or date range</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Array.isArray(previewData.data) && (
                    <span className="font-medium">{previewData.data.length} records found</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      generateReport(previewData.type, 'csv');
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      generateReport(previewData.type, 'json');
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Reports Modal */}
        {showScheduledReports && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowScheduledReports(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-white" />
                    <h2 className="text-2xl font-bold text-white">Scheduled Reports</h2>
                  </div>
                  <button onClick={() => setShowScheduledReports(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {scheduledReports.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No scheduled reports yet</p>
                    <p className="text-sm text-gray-500 mt-2">Create automated reports to run on a schedule</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledReports.map((report) => (
                      <div key={report._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{report.name}</h3>
                            <p className="text-sm text-gray-600">{report.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Frequency: {report.frequency}</span>
                              <span>Next Run: {report.nextRun ? new Date(report.nextRun).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {report.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button onClick={() => setShowScheduledReports(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report History Modal */}
        {showReportHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-8 h-8 text-white" />
                    <h2 className="text-2xl font-bold text-white">Report History</h2>
                  </div>
                  <button onClick={() => setShowReportHistory(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {reportHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No report history yet</p>
                    <p className="text-sm text-gray-500 mt-2">Generated reports will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Report Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Format</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Records</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Generated By</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportHistory.map((entry) => (
                          <tr key={entry._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{entry.reportType.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 uppercase">{entry.format}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{entry.recordCount || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{entry.generatedBy?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{new Date(entry.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                                entry.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button onClick={() => setShowReportHistory(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportManagement;
