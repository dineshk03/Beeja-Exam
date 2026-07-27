import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Ban, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes('deactivated') || errorMessage.toLowerCase().includes('inactive')) {
        setErrorType('inactive');
      } else {
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 40%, #1d4ed8 100%)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <img src="/beeja-logo.png" alt="Beeja Academy" className="w-20 h-20 rounded-2xl object-contain bg-white/10 backdrop-blur-sm border border-white/20 mx-auto mb-6 shadow-2xl p-2" />
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
            Beeja Academy
          </h1>
          <p className="text-blue-200/80 text-lg max-w-xs mx-auto leading-relaxed">
            Enterprise-grade examination management with advanced proctoring
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
            {[
              { label: 'Secure Exams', icon: '🔒' },
              { label: 'Live Proctoring', icon: '📹' },
              { label: 'Instant Results', icon: '⚡' },
              { label: 'Certificates', icon: '🏆' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center gap-2">
                <span>{f.icon}</span>
                <span className="text-blue-100 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src="/beeja-logo.png" alt="Beeja Academy" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg font-bold text-gray-800">Beeja Academy</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

          {error && errorType === 'inactive' && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="bg-red-500 p-1.5 rounded-lg flex-shrink-0">
                  <Ban className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-900 text-sm mb-1">Account Deactivated</p>
                  <p className="text-red-700 text-xs">{error} — contact your administrator.</p>
                </div>
              </div>
            </div>
          )}

          {error && errorType === 'general' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #0891b2)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
