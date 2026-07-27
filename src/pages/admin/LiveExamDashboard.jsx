import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Users, Clock, AlertTriangle, RefreshCw,
  StopCircle, Eye, CheckCircle, Wifi, WifiOff, Search
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function formatTime(seconds) {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function LiveExamDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [terminating, setTerminating] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/admin/live-sessions');
      setSessions(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  // Tick remaining time locally every second
  useEffect(() => {
    const tick = setInterval(() => {
      setSessions(prev =>
        prev.map(s => ({
          ...s,
          timeRemainingSeconds: Math.max(0, s.timeRemainingSeconds - 1),
          elapsedSeconds: s.elapsedSeconds + 1
        }))
      );
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleTerminate = async (sessionId) => {
    if (!window.confirm('Terminate this student\'s exam session? This cannot be undone.')) return;
    setTerminating(sessionId);
    try {
      await api.post(`/admin/sessions/${sessionId}/terminate`);
      showNotification('Session terminated successfully');
      fetchSessions();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to terminate session', 'error');
    } finally {
      setTerminating(null);
    }
  };

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    return (
      s.student?.name?.toLowerCase().includes(q) ||
      s.student?.email?.toLowerCase().includes(q) ||
      s.exam?.title?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: sessions.length,
    flagged: sessions.filter(s => s.flagged).length,
    lowTime: sessions.filter(s => s.timeRemainingSeconds < 300).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100">
                <Activity className="w-5 h-5 text-green-600" />
              </span>
              Live Exam Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-11">Real-time view of all active exam sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                autoRefresh
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={fetchSessions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            <Users className="w-7 h-7 opacity-80 mb-2" />
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-blue-100 text-sm font-medium mt-1">Active Students</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
            <AlertTriangle className="w-7 h-7 opacity-80 mb-2" />
            <p className="text-3xl font-bold">{stats.flagged}</p>
            <p className="text-orange-100 text-sm font-medium mt-1">Flagged Sessions</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-500/20">
            <Clock className="w-7 h-7 opacity-80 mb-2" />
            <p className="text-3xl font-bold">{stats.lowTime}</p>
            <p className="text-red-100 text-sm font-medium mt-1">Low Time (&lt;5 min)</p>
          </div>
        </div>

        {/* Search + last refresh */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or exam…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors shadow-sm"
            />
          </div>
          {lastRefresh && (
            <p className="text-xs text-gray-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-blue-300" />
              </div>
              <p className="text-gray-600 font-semibold">
                {sessions.length === 0 ? 'No active exam sessions right now' : 'No sessions match your search'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {sessions.length === 0 ? 'Sessions will appear here when students start exams' : 'Try a different search term'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e40af)' }}>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Exam</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Elapsed</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(session => {
                    const pct = session.progressPercent || 0;
                    const remaining = session.timeRemainingSeconds;
                    const isLowTime = remaining < 300 && remaining > 0;
                    const isExpired = remaining <= 0;
                    return (
                      <tr key={session._id} className={`transition-colors ${session.flagged ? 'bg-red-50/60' : 'hover:bg-blue-50/30'}`}>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-gray-900">{session.student?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{session.student?.email}</div>
                          {session.student?.batch && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">{session.student.batch}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900">{session.exam?.title || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{session.totalQuestions} questions</div>
                        </td>
                        <td className="px-4 py-3.5 w-44">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-9 text-right font-medium">{pct}%</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{session.answeredCount}/{session.totalQuestions} answered</div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 font-mono text-sm">
                          {formatElapsed(session.elapsedSeconds)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`font-mono text-sm font-bold ${
                            isExpired ? 'text-gray-400' :
                            isLowTime ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {isExpired ? 'Expired' : formatTime(remaining)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {session.flagged ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              <Activity className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/admin/student-answers?session=${session._id}`}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View answers"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleTerminate(session._id)}
                              disabled={terminating === session._id}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                              title="Terminate session"
                            >
                              <StopCircle className="w-4 h-4" />
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
        </div>
      </div>
    </AdminLayout>
  );
}
