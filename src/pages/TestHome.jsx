import React from 'react';

function TestHome() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🚀 System Test</h1>
        <p className="text-gray-700 mb-4">If you can see this page, the React app is working!</p>
        <div className="space-y-2 text-left">
          <p>✅ React is loading</p>
          <p>✅ Routing is working</p>
          <p>✅ Tailwind CSS is working</p>
          <p>✅ Components are rendering</p>
        </div>
        <div className="mt-6">
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default TestHome;
