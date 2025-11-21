import React from 'react';
import { useNavigate } from 'react-router-dom';

function MinimalDashboard() {
  const navigate = useNavigate();

  const handleStartExam = () => {
    navigate('/exam/test-exam/start');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Minimal Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            This is a minimal dashboard for testing
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Test Exam
            </h2>
            <p className="text-blue-800 mb-4">
              A simple test exam to verify functionality
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                <p>Duration: 60 minutes</p>
                <p>Questions: 10</p>
              </div>
              <button
                onClick={handleStartExam}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Start Exam
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MinimalDashboard;
