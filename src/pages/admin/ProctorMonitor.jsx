import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, AlertTriangle, Eye, Users, Clock, Activity, 
  Search, Filter, Download, Flag, XCircle, Image as ImageIcon,
  Video, Monitor, RefreshCw, AlertOctagon, CheckCircle, Ban,
  Wifi, WifiOff, TrendingUp, Shield, Zap, FileText, BarChart3
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const ProctorMonitor = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showScreenshot, setShowScreenshot] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchMonitorData();
    
    const interval = autoRefresh ? setInterval(fetchMonitorData, 10000) : null; // Refresh every 10 seconds
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchMonitorData = async () => {
    try {
      setError(null);
      const response = await api.get('/admin/proctor-monitor');
      setSessions(response.data || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching monitor data:', error);
      setError(error.response?.data?.message || 'Failed to fetch proctoring data');
      setSessions([]);
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSessionLogs = async (sessionId) => {
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        api.get(`/admin/sessions/${sessionId}/proctor-logs`),
        api.get(`/admin/sessions/${sessionId}/proctor-stats`),
      ]);
      
      setLogs(logsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching session logs:', error);
    }
  };

  const handleFlagStudent = async (sessionId) => {
    if (!window.confirm('Flag this student for review?')) return;
    try {
      await api.post(`/admin/sessions/${sessionId}/flag`);
      showNotification('Student flagged successfully for review', 'success');
      fetchMonitorData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to flag student', 'error');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('⚠️ Terminate this exam session? This action cannot be undone.')) return;
    try {
      await api.post(`/admin/sessions/${sessionId}/terminate`);
      showNotification('Session terminated successfully', 'success');
      fetchMonitorData();
      setSelectedSession(null);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to terminate session', 'error');
    }
  };

  const exportLogs = () => {
    if (!selectedSession) return;
    
    try {
      // Convert logs to CSV format
      const headers = ['Timestamp', 'Event Type', 'Severity', 'Description'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          new Date(log.timestamp).toLocaleString(),
          log.eventType.replace(/_/g, ' '),
          log.severity,
          (log.description || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proctor-logs-${selectedSession?.student?.name || 'student'}-${Date.now()}.csv`;
      link.click();
      showNotification(`Exported ${logs.length} log entries`, 'success');
    } catch (error) {
      showNotification('Failed to export logs', 'error');
    }
  };

  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    
    let filtered = [...sessions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s?.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s?.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s?.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus === 'alerts') {
      filtered = filtered.filter(s => (s.recentAlerts || 0) > 0);
    } else if (filterStatus === 'flagged') {
      filtered = filtered.filter(s => s.flagged === true);
    }

    return filtered;
  }, [sessions, searchTerm, filterStatus]);

  const filteredLogs = useMemo(() => {
    if (filterSeverity === 'all') return logs;
    return logs.filter(log => log.severity === filterSeverity);
  }, [logs, filterSeverity]);

  // Count only valid sessions (with student and exam data)
  const validSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter(s => s?.student && s?.exam);
  }, [sessions]);

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    fetchSessionLogs(session.session);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'face_not_detected':
      case 'multiple_faces':
        return <Camera className="w-4 h-4" />;
      case 'tab_switch':
      case 'window_blur':
        return <Eye className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error Loading Proctoring Data</h3>
                <p className="text-sm text-red-800 mt-1">{error}</p>
                <button
                  onClick={fetchMonitorData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </span>
              Proctoring Monitor
            </h1>
            <div className="flex items-center gap-3 ml-11">
              <p className="text-gray-500 text-sm">Real-time monitoring of ongoing exams</p>
              <div className="flex items-center gap-1.5">
                {autoRefresh ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium">Paused</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">Auto-refresh (10s)</span>
            </label>
            <button
              onClick={fetchMonitorData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 font-medium">Active Sessions</p>
              <p className="text-3xl font-bold text-white mt-2">{validSessions.length}</p>
              <p className="text-xs text-blue-100 mt-1">Currently monitored</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100 font-medium">High Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">
                {validSessions.reduce((sum, s) => sum + (s?.recentAlerts || 0), 0)}
              </p>
              <p className="text-xs text-orange-100 mt-1">Requires attention</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 font-medium">Flagged Students</p>
              <p className="text-3xl font-bold text-white mt-2">
                {validSessions.filter(s => s?.flagged).length}
              </p>
              <p className="text-xs text-green-100 mt-1">Under review</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Flag className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-cyan-600 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100 font-medium">Total Events</p>
              <p className="text-3xl font-bold text-white mt-2">
                {validSessions.reduce((sum, s) => sum + (s?.alerts?.length || 0), 0)}
              </p>
              <p className="text-xs text-purple-100 mt-1">All incidents</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 font-medium">Last Update</p>
              <p className="text-lg font-bold text-white mt-2">
                {lastUpdate.toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, email, or exam..."
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
            <option value="all">All Sessions</option>
            <option value="alerts">With Alerts</option>
            <option value="flagged">Flagged</option>
          </select>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Active Exam Sessions</h2>
            <span className="text-sm text-gray-600">{filteredSessions.length} sessions</span>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="flex flex-col items-center space-y-3">
                  <Monitor className="w-16 h-16 text-gray-300" />
                  <p className="font-medium">{validSessions.length === 0 ? 'No active exam sessions' : 'No sessions match your filters'}</p>
                  <p className="text-xs text-gray-400">Sessions will appear here when students start their exams</p>
                </div>
              </div>
            ) : (
              filteredSessions.map((session) => {
                // Skip sessions with missing data
                if (!session?.student || !session?.exam) return null;
                
                return (
                <div
                  key={session.session}
                  onClick={() => handleSessionClick(session)}
                  className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                    selectedSession?.session === session.session 
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-600 shadow-md' 
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="font-semibold text-gray-900">{session.student?.name || 'Unknown Student'}</p>
                        {session.flagged && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center space-x-1">
                            <Flag className="w-3 h-3" />
                            <span>Flagged</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{session.exam?.title || 'Unknown Exam'}</span>
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}</span>
                        </p>
                        {session.startTime && (
                          <p className="text-xs text-blue-600 font-medium">
                            {Math.floor((new Date() - new Date(session.startTime)) / 60000)} min ago
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {(session.recentAlerts || 0) > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full animate-pulse">
                            {session.recentAlerts} alerts
                          </span>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Session Details & Logs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedSession ? 'Session Details' : 'Select a session'}
            </h2>
            {selectedSession && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportLogs}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  title="Export Logs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => handleFlagStudent(selectedSession.session)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  title="Flag Student"
                >
                  <Flag className="w-4 h-4" />
                  <span>Flag</span>
                </button>
                <button
                  onClick={() => handleTerminateSession(selectedSession.session)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  title="Terminate Session"
                >
                  <Ban className="w-4 h-4" />
                  <span>Terminate</span>
                </button>
              </div>
            )}
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {!selectedSession ? (
              <div className="text-center text-gray-500 py-12">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Select a session to view details and logs</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Session Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedSession?.student?.name || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {selectedSession?.student?.email || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Exam:</span> {selectedSession?.exam?.title || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                {stats && stats.severityStats && Array.isArray(stats.severityStats) && stats.severityStats.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Event Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {stats.severityStats.map((stat) => (
                        <div key={stat._id} className={`p-3 rounded-lg border ${getSeverityColor(stat._id)}`}>
                          <p className="text-xs font-medium uppercase">{stat._id}</p>
                          <p className="text-2xl font-bold">{stat.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Logs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Recent Events</h3>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Severity</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    {filteredLogs.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {logs.length === 0 ? 'No events logged yet' : 'No events match this severity'}
                      </p>
                    ) : (
                      filteredLogs.slice(0, 20).map((log, index) => (
                        <div
                          key={log._id}
                          className={`p-3 rounded-lg border ${getSeverityColor(log.severity)} transform transition-all duration-200 hover:scale-102 hover:shadow-md`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              log.severity === 'critical' ? 'bg-red-200' :
                              log.severity === 'high' ? 'bg-orange-200' :
                              log.severity === 'medium' ? 'bg-yellow-200' :
                              'bg-blue-200'
                            }`}>
                              {getEventIcon(log.eventType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold capitalize">
                                  {log.eventType.replace(/_/g, ' ')}
                                </p>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                                  log.severity === 'critical' ? 'bg-red-600 text-white' :
                                  log.severity === 'high' ? 'bg-orange-600 text-white' :
                                  log.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                  'bg-blue-600 text-white'
                                }`}>
                                  {log.severity}
                                </span>
                              </div>
                              {log.description && (
                                <p className="text-xs text-gray-700 mt-1">{log.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default ProctorMonitor;
