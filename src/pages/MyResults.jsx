import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Award, TrendingUp, Home, Eye,
  Calendar, Clock, FileText, Search, BookOpen, ChevronRight
} from 'lucide-react';
import api from '../api/axios';

function MyResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/results/my-results');
      setResults(response.data.results || []);
      setStats(response.data.stats || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result =>
    result.exam?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#eff6ff' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm">Loading results…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#eff6ff' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #1d4ed8 100%)' }} className="shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none">My Results</h1>
                <p className="text-blue-300 text-xs mt-0.5">Your exam history &amp; marksheets</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
              <FileText className="w-7 h-7 opacity-80 mb-2" />
              <p className="text-3xl font-bold">{stats.totalExams}</p>
              <p className="text-blue-100 text-sm font-medium mt-1">Total Exams</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/20">
              <CheckCircle className="w-7 h-7 opacity-80 mb-2" />
              <p className="text-3xl font-bold">{stats.passed}</p>
              <p className="text-green-100 text-sm font-medium mt-1">Passed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
              <TrendingUp className="w-7 h-7 opacity-80 mb-2" />
              <p className="text-3xl font-bold">{stats.avgScore.toFixed(1)}%</p>
              <p className="text-purple-100 text-sm font-medium mt-1">Avg. Score</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
              <Award className="w-7 h-7 opacity-80 mb-2" />
              <p className="text-3xl font-bold">
                {stats.totalExams > 0 ? ((stats.passed / stats.totalExams) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-amber-100 text-sm font-medium mt-1">Success Rate</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search exams…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e40af)' }}>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Exam</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-blue-300" />
                      </div>
                      <p className="text-gray-700 font-semibold mb-1">No results found</p>
                      <p className="text-gray-400 text-sm">Complete an exam to see your results here</p>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => {
                    const percentage = result.percentage || 0;
                    const grade =
                      percentage >= 90 ? 'A+' :
                      percentage >= 80 ? 'A' :
                      percentage >= 70 ? 'B+' :
                      percentage >= 60 ? 'B' :
                      percentage >= 50 ? 'C' :
                      percentage >= 40 ? 'D' : 'F';

                    return (
                      <tr key={result._id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {result.exam?.title || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {result.totalQuestions} questions · {result.exam?.duration} min
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(result.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
                            {percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {result.correctAnswers}/{result.totalQuestions} correct
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${
                            result.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white text-sm font-bold shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/result/${result._id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:shadow-md"
                              style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Marksheet
                            </button>
                            {result.passed && (
                              <button
                                onClick={() => navigate(`/result/${result._id}?certificate=true`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                <Award className="w-3.5 h-3.5" />
                                Certificate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {results.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Showing {filteredResults.length} of {results.length} results
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyResults;
