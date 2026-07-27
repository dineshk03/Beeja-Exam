import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Award, TrendingUp, Home, Eye, Calendar, Clock, FileText, Medal } from 'lucide-react';
import api from '../api/axios';

function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get result data from navigation state or sessionStorage
  useEffect(() => {
    console.log('=== Results Page Mounted ===');
    const stateResult = location.state?.result;
    const storedResult = sessionStorage.getItem('examResult');
    
    console.log('Results page - location.state:', location.state);
    console.log('Results page - stateResult:', stateResult);
    console.log('Results page - storedResult:', storedResult);
    
    if (stateResult) {
      console.log('✅ Using result from navigation state');
      setResultData(stateResult);
      setIsLoading(false);
      // Clear sessionStorage since we have the data
      sessionStorage.removeItem('examResult');
    } else if (storedResult) {
      console.log('✅ Using result from sessionStorage');
      try {
        const parsed = JSON.parse(storedResult);
        setResultData(parsed);
        setIsLoading(false);
        // Clear after use
        sessionStorage.removeItem('examResult');
      } catch (error) {
        console.error('❌ Failed to parse stored result:', error);
        setIsLoading(false);
      }
    } else {
      console.warn('⚠️ No result data found in either source');
      // Wait a bit before giving up, in case data is still loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Only redirect if we're done loading and still have no data
  useEffect(() => {
    if (!isLoading && !resultData) {
      console.warn('❌ No result data found anywhere, redirecting to dashboard in 2 seconds');
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, resultData, navigate]);

  if (!resultData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { score, totalPoints, percentage, passed, correctAnswers, totalQuestions } = resultData;
  
  // Validate required data
  if (typeof percentage === 'undefined' || typeof passed === 'undefined') {
    console.error('Invalid result data:', resultData);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">Unable to load exam results</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate grade/category based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', category: 'Outstanding', color: 'from-yellow-400 to-orange-500' };
    if (percentage >= 80) return { grade: 'A', category: 'Excellent', color: 'from-green-400 to-green-600' };
    if (percentage >= 70) return { grade: 'B+', category: 'Very Good', color: 'from-blue-400 to-cyan-600' };
    if (percentage >= 60) return { grade: 'B', category: 'Good', color: 'from-cyan-400 to-cyan-600' };
    if (percentage >= 50) return { grade: 'C', category: 'Average', color: 'from-purple-400 to-purple-600' };
    if (percentage >= 40) return { grade: 'D', category: 'Below Average', color: 'from-orange-400 to-orange-600' };
    return { grade: 'F', category: 'Fail', color: 'from-red-400 to-red-600' };
  };

  const gradeInfo = getGrade(percentage);


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Result Icon */}
        <div className="flex items-center justify-center mb-6">
          {passed ? (
            <div className="bg-green-100 p-6 rounded-full">
              <CheckCircle className="w-20 h-20 text-green-600" />
            </div>
          ) : (
            <div className="bg-red-100 p-6 rounded-full">
              <XCircle className="w-20 h-20 text-red-600" />
            </div>
          )}
        </div>

        {/* Result Message */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Congratulations!' : 'Not Passed'}
          </h1>
          <p className="text-gray-600 text-lg">
            {passed 
              ? 'You have successfully passed the exam!' 
              : 'Unfortunately, you did not pass this time. Keep practicing!'}
          </p>
        </div>

        {/* Grade and Category Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center space-x-8">
            {/* Grade Badge */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeInfo.color} shadow-xl`}>
                <div className="text-center">
                  <Medal className="w-8 h-8 text-white mx-auto mb-1" />
                  <div className="text-4xl font-bold text-white">{gradeInfo.grade}</div>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-600">Grade</p>
            </div>

            {/* Category */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg px-8 py-6 shadow-md">
                <Award className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{gradeInfo.category}</div>
                <p className="text-sm text-gray-600 mt-1">Performance Category</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-8 mb-6 text-white text-center">
          <div className="text-6xl font-bold mb-2">{percentage.toFixed(1)}%</div>
          <div className="text-lg opacity-90">Your Score</div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Correct Answers</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {correctAnswers} / {totalQuestions}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Points Earned</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {score} / {totalPoints}
            </div>
          </div>
        </div>

        {/* Performance Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Performance</span>
            <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                passed ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Performance Message */}
        <div className={`rounded-lg p-4 mb-6 ${
          percentage >= 90 ? 'bg-green-50 border border-green-200' :
          percentage >= 70 ? 'bg-blue-50 border border-blue-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start">
            <TrendingUp className={`w-5 h-5 mt-0.5 mr-3 ${
              percentage >= 90 ? 'text-green-600' :
              percentage >= 70 ? 'text-blue-600' :
              'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-semibold mb-1 ${
                percentage >= 90 ? 'text-green-900' :
                percentage >= 70 ? 'text-blue-900' :
                'text-yellow-900'
              }`}>
                {percentage >= 90 ? 'Excellent Performance!' :
                 percentage >= 70 ? 'Good Job!' :
                 'Keep Practicing'}
              </h3>
              <p className={`text-sm ${
                percentage >= 90 ? 'text-green-800' :
                percentage >= 70 ? 'text-blue-800' :
                'text-yellow-800'
              }`}>
                {percentage >= 90 ? 'You demonstrated exceptional knowledge in this subject.' :
                 percentage >= 70 ? 'You have a solid understanding of the material.' :
                 'Review the material and try again to improve your score.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;
