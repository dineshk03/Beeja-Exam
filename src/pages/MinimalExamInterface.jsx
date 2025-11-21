import React from 'react';
import { useParams } from 'react-router-dom';

function MinimalExamInterface() {
  const { examId } = useParams();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Minimal Exam Interface
          </h1>
          <p className="text-gray-600 mb-4">
            Exam ID: {examId}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Test Question
            </h2>
            <p className="text-blue-800 mb-4">
              What is 2 + 2?
            </p>
            <div className="space-y-2">
              <button className="block w-full text-left p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
                A. 3
              </button>
              <button className="block w-full text-left p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
                B. 4
              </button>
              <button className="block w-full text-left p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
                C. 5
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Previous
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MinimalExamInterface;
