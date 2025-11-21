import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, FileQuestion, BarChart3, 
  Plus, LogOut, Settings, Calendar, Camera, TrendingUp,
  CheckCircle, XCircle, Clock, Award, Activity, Eye,
  UserCheck, AlertCircle, Target, Zap, ArrowUp, ArrowDown,
  Minus, RefreshCw, Bell, Sparkles, TrendingDown
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import AdminLayout from '../../components/admin/AdminLayout';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stats) {
      setAnimateStats(true);
    }
  }, [stats]);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const [statsRes, examsRes, sessionsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/exams'),
        api.get('/admin/sessions/recent')
      ]);
      setStats(statsRes.data);
      setRecentExams(examsRes.data.slice(0, 5));
      setRecentSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (!trend || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getTrendColor = (trend) => {
    if (!trend || trend === 0) return 'text-gray-500';
    return trend > 0 ? 'text-green-500' : 'text-red-500';
  };

  const statCards = [
    {
      title: 'Total Exams',
      value: stats?.totalExams || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/exams',
      trend: stats?.examsTrend || 0,
      subtitle: 'All exams in system'
    },
    {
      title: 'Active Exams',
      value: stats?.activeExams || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/exams',
      trend: stats?.activeExamsTrend || 0,
      subtitle: 'Currently active'
    },
    {
      title: 'Total Questions',
      value: stats?.totalQuestions || 0,
      icon: FileQuestion,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/admin/questions',
      trend: stats?.questionsTrend || 0,
      subtitle: 'Question bank size'
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/admin/students',
      trend: stats?.studentsTrend || 0,
      subtitle: 'Registered students'
    },
    {
      title: 'Total Sessions',
      value: stats?.totalSessions || 0,
      icon: Activity,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/admin/analytics',
      trend: stats?.sessionsTrend || 0,
      subtitle: 'All exam attempts'
    },
    {
      title: 'Completed',
      value: stats?.completedSessions || 0,
      icon: Award,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      link: '/admin/analytics',
      trend: stats?.completedTrend || 0,
      subtitle: 'Finished exams'
    },
    {
      title: 'Average Score',
      value: stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%',
      icon: Target,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
      link: '/admin/analytics',
      trend: stats?.scoreTrend || 0,
      subtitle: 'Overall performance'
    },
    {
      title: 'Pass Rate',
      value: stats?.passRate ? `${stats.passRate.toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      link: '/admin/analytics',
      trend: stats?.passRateTrend || 0,
      subtitle: 'Success percentage'
    },
  ];

  const quickActions = [
    {
      title: 'Create New Exam',
      description: 'Set up a new examination',
      icon: BookOpen,
      color: 'bg-blue-500',
      action: () => navigate('/admin/exams'),
    },
    {
      title: 'Add Question',
      description: 'Add questions to question bank',
      icon: Plus,
      color: 'bg-green-500',
      action: () => navigate('/admin/questions/create'),
    },
    {
      title: 'Question Bank',
      description: 'Manage all questions',
      icon: FileQuestion,
      color: 'bg-purple-500',
      action: () => navigate('/admin/questions'),
    },
    {
      title: 'Schedule Exam',
      description: 'Create exam schedules and time slots',
      icon: Calendar,
      color: 'bg-indigo-500',
      action: () => navigate('/admin/scheduling'),
    },
    {
      title: 'Proctoring Monitor',
      description: 'Monitor live exam sessions',
      icon: Camera,
      color: 'bg-red-500',
      action: () => navigate('/admin/proctoring'),
    },
    {
      title: 'Analytics & Reports',
      description: 'View comprehensive analytics',
      icon: TrendingUp,
      color: 'bg-yellow-500',
      action: () => navigate('/admin/analytics'),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-gray-600 mt-2">Manage exams, questions, and monitor system performance</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                onClick={() => navigate(stat.link)}
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-300 hover:scale-105 group ${
                  animateStats ? 'animate-fade-in-up' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  {stat.trend !== undefined && (
                    <div className={`flex items-center space-x-1 ${getTrendColor(stat.trend)}`}>
                      {getTrendIcon(stat.trend)}
                      <span className="text-xs font-semibold">
                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
                <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.color} rounded-full transition-all duration-1000`}
                    style={{ width: animateStats ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Question Types Breakdown */}
            <div className="lg:col-span-2">
              {stats?.questionsByType && (
                <div className="bg-white rounded-xl shadow-md p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Questions by Type</h2>
                    <button 
                      onClick={() => navigate('/admin/questions')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.questionsByType['multiple-choice'] || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Multiple Choice</div>
                      <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{width: stats.totalQuestions > 0 ? `${((stats.questionsByType['multiple-choice'] || 0) / stats.totalQuestions * 100)}%` : '0%'}}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                      <div className="text-3xl font-bold text-green-600">
                        {stats.questionsByType['single-choice'] || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Single Choice</div>
                      <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 rounded-full"
                          style={{width: stats.totalQuestions > 0 ? `${((stats.questionsByType['single-choice'] || 0) / stats.totalQuestions * 100)}%` : '0%'}}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.questionsByType['short-answer'] || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Short Answer</div>
                      <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full"
                          style={{width: stats.totalQuestions > 0 ? `${((stats.questionsByType['short-answer'] || 0) / stats.totalQuestions * 100)}%` : '0%'}}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                      <div className="text-3xl font-bold text-yellow-600">
                        {stats.questionsByType['match-following'] || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Match Following</div>
                      <div className="mt-2 h-2 bg-yellow-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-600 rounded-full"
                          style={{width: stats.totalQuestions > 0 ? `${((stats.questionsByType['match-following'] || 0) / stats.totalQuestions * 100)}%` : '0%'}}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                      <div className="text-3xl font-bold text-red-600">
                        {stats.questionsByType['code-test'] || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Code Test</div>
                      <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-600 rounded-full"
                          style={{width: stats.totalQuestions > 0 ? `${((stats.questionsByType['code-test'] || 0) / stats.totalQuestions * 100)}%` : '0%'}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active Students</span>
                    <span className="text-sm font-semibold text-gray-900">{stats?.activeStudents || 0}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Ongoing Exams</span>
                    <span className="text-sm font-semibold text-gray-900">{stats?.ongoingExams || 0}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{width: '45%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Pass Rate</span>
                    <span className="text-sm font-semibold text-gray-900">{stats?.passRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{width: `${stats?.passRate || 0}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg. Score</span>
                    <span className="text-sm font-semibold text-gray-900">{stats?.averageScore?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{width: `${stats?.averageScore || 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Exams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Exams */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-gray-900">Recent Exams</h2>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {recentExams.length}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/admin/exams')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 hover:underline"
                >
                  <span>View All</span>
                  <ArrowUp className="w-3 h-3 rotate-90" />
                </button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-blue">
                {recentExams.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No exams created yet</p>
                    <button
                      onClick={() => navigate('/admin/exams')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first exam
                    </button>
                  </div>
                ) : (
                  recentExams.map((exam, index) => (
                    <div 
                      key={exam._id}
                      onClick={() => navigate(`/admin/exams/build/${exam._id}`)}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-300 cursor-pointer group animate-slide-in-right"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                          exam.isActive ? 'bg-green-100 group-hover:bg-green-200' : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <BookOpen className={`w-5 h-5 ${
                            exam.isActive ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FileQuestion className="w-3 h-3" />
                              <span>{exam.questions?.length || 0} questions</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{exam.duration} min</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                          exam.isActive 
                            ? 'bg-green-100 text-green-700 group-hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                        }`}>
                          {exam.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    {recentSessions.length}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 hover:underline"
                >
                  <span>View All</span>
                  <ArrowUp className="w-3 h-3 rotate-90" />
                </button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-purple">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Activity will appear here once students start taking exams</p>
                  </div>
                ) : (
                  recentSessions.map((session, index) => {
                    const timeAgo = session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Just now';
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-300 group animate-slide-in-right"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                            session.status === 'submitted' ? 'bg-green-100 group-hover:bg-green-200' : 
                            session.status === 'in-progress' ? 'bg-blue-100 group-hover:bg-blue-200 animate-pulse' : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            {session.status === 'submitted' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : session.status === 'in-progress' ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {session.student?.name || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.exam?.title || 'Exam'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {timeAgo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.percentage !== undefined && (
                            <div className="text-right">
                              <span className={`text-lg font-bold ${
                                session.percentage >= (session.exam?.passingScore || 60) 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {session.percentage.toFixed(0)}%
                              </span>
                              {session.percentage >= (session.exam?.passingScore || 60) ? (
                                <p className="text-xs text-green-600 font-medium">Passed</p>
                              ) : (
                                <p className="text-xs text-red-600 font-medium">Failed</p>
                              )}
                            </div>
                          )}
                          {session.status === 'in-progress' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full animate-pulse">
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <Zap className="w-5 h-5 text-yellow-500 animate-bounce-subtle" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex items-start p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-300 text-left group bg-white animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${action.color} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform shadow-md`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-blue-600 rotate-45 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
