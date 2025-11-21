import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TestExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Test Page Working!</h1>
        <p className="text-gray-600 mb-4">Exam ID: {examId}</p>
        <p className="text-sm text-gray-500 mb-6">
          If you see this, the routing is working correctly.
          The issue is with the EnhancedTCSExamInterface component.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default TestExamPage;
