import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, Ban } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'inactive' or 'general'
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
      
      // Check if it's an inactive account error
      if (errorMessage.toLowerCase().includes('deactivated') || 
          errorMessage.toLowerCase().includes('inactive')) {
        setErrorType('inactive');
      } else {
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to access your exams</p>

        {error && errorType === 'inactive' && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 mb-6">
            <div className="flex items-start">
              <div className="bg-red-500 p-2 rounded-lg">
                <Ban className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-2">Account Deactivated</h3>
                <p className="text-red-800 mb-3">
                  Your account has been deactivated by an administrator and you cannot access the system at this time.
                </p>
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700 font-semibold mb-2">What you can do:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Contact your instructor or administrator</li>
                    <li>• Request account reactivation</li>
                    <li>• Check if there are any pending issues</li>
                  </ul>
                </div>
                <p className="text-xs text-red-700">
                  If you believe this is an error, please contact support immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && errorType === 'general' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
