import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Award, Clock, Calendar, 
  Download, Home, TrendingUp, Target, FileText, Medal
} from 'lucide-react';
import api from '../api/axios';

function ExamResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/results/${sessionId}`);
      setResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching result:', error);
      setLoading(false);
    }
  };

  const downloadMarksheet = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Result Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fix data mapping - handle different API response structures
  const scorePercentage = result.percentage || ((result.score || 0) / (result.totalMarks || result.totalQuestions || 1)) * 100;
  const isPassed = result.passed !== undefined ? result.passed : (scorePercentage >= (result.exam?.passingScore || 70));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Exam Result</h1>
                <p className="text-blue-100 mt-2">{result.exam?.title || result.examTitle || 'Exam'}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{scorePercentage.toFixed(1)}%</div>
                <div className={`text-sm font-medium ${isPassed ? 'text-green-200' : 'text-red-200'}`}>
                  {isPassed ? 'PASSED' : 'FAILED'}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Pass/Fail Status */}
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              isPassed 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {isPassed ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-3" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {isPassed ? 'Congratulations! You have passed the exam.' : 'Unfortunately, you did not pass this exam.'}
                  </h3>
                  <p className="text-sm opacity-75">
                    {isPassed 
                      ? 'You have successfully met the passing criteria.' 
                      : 'Please review the material and try again.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Student & Exam Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Student Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{result.studentName || result.student?.name || 'Student'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{result.studentEmail || result.student?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Exam Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{result.exam?.duration || result.duration || 'N/A'} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(result.submittedAt || result.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Score Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.score || result.correctAnswers || 0}</div>
                  <div className="text-sm text-gray-600">Score Obtained</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.totalMarks || result.totalQuestions || 0}</div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{scorePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {isPassed ? 'PASS' : 'FAIL'}
                  </div>
                  <div className="text-sm text-gray-600">Result</div>
                </div>
              </div>
            </div>

            {/* Question Analysis */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Question Analysis
              </h3>
              
              {(() => {
                // Debug: Check what's in the exam data
                console.log('🔍 DEBUG - Full result object:', result);
                console.log('🔍 DEBUG - Exam object:', result.exam);
                console.log('🔍 DEBUG - showQuestionAnalysis value:', result.exam?.showQuestionAnalysis);
                console.log('🔍 DEBUG - Has questions:', !!result.exam?.questions);
                console.log('🔍 DEBUG - Has answers:', !!result.answers);
                
                const shouldShow = result.exam && result.exam.questions && result.answers && result.exam.showQuestionAnalysis === true;
                console.log('🔍 DEBUG - Should show analysis:', shouldShow);
                
                return shouldShow;
              })() ? (
                <div className="space-y-4">
                  {result.exam.questions.map((question, index) => {
                    const studentAnswer = result.answers[question._id];
                    const correctAnswer = question.correctAnswer;
                    const isCorrect = studentAnswer === correctAnswer;
                    
                    return (
                      <div key={index} className={`border-2 rounded-lg p-4 ${
                        isCorrect 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Question {index + 1}
                              </h4>
                              <span className={`text-sm font-medium ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isCorrect ? '+1' : '0'} marks
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-800 font-medium mb-2">
                            {question.question}
                          </p>
                          
                          {question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => {
                                const isStudentChoice = studentAnswer === optionIndex;
                                const isCorrectChoice = correctAnswer === optionIndex;
                                
                                return (
                                  <div key={optionIndex} className={`p-2 rounded border ${
                                    isCorrectChoice 
                                      ? 'border-green-300 bg-green-100' 
                                      : isStudentChoice 
                                      ? 'border-red-300 bg-red-100' 
                                      : 'border-gray-200 bg-white'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-700">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <span className="text-gray-800">{option}</span>
                                      {isCorrectChoice && (
                                        <span className="text-green-600 font-medium text-sm">
                                          ✅ Correct Answer
                                        </span>
                                      )}
                                      {isStudentChoice && !isCorrectChoice && (
                                        <span className="text-red-600 font-medium text-sm">
                                          ❌ Your Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-1">💡 Explanation:</div>
                            <div className="text-blue-800 text-sm">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                        
                        {!isCorrect && !question.explanation && (
                          <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                            <div className="text-sm font-medium text-orange-700 mb-1">💡 Note:</div>
                            <div className="text-orange-800 text-sm">
                              Review this question to understand the correct answer better.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : result.exam && result.exam.questions && result.answers ? (
                <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-800 font-medium">Question Analysis Disabled</p>
                  <p className="text-sm text-blue-600">The instructor has not enabled detailed question analysis for this exam</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Question analysis not available</p>
                  <p className="text-sm text-gray-500">No exam data found</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              
              <button
                onClick={() => navigate('/my-results')}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View All Results</span>
              </button>
              
              <button
                onClick={downloadMarksheet}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Result</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamResult;