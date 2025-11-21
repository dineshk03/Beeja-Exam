// LiveExamResult.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Award, Clock, Calendar,
  Download, Home, TrendingUp, Target, FileText, Medal, AlertCircle,
  BarChart3, PieChart, Eye, EyeOff, Share2, Printer,
  Timer, User, BookOpen, Star, Trophy, Zap
} from 'lucide-react';

function LiveExamResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const storedResult = localStorage.getItem('lastExamResult');
    console.log('🔍 Checking localStorage for exam result:', !!storedResult);

    if (storedResult) {
      try {
        const examResult = JSON.parse(storedResult);
        
        // Check if admin allows students to see results
        const showResults = examResult.exam?.showResultsToStudents;
        console.log('📊 Admin showResultsToStudents setting:', showResults);
        
        if (showResults === false) {
          console.log('🚫 Results hidden by admin, redirecting to dashboard');
          // Show completion message and redirect
          const completionModal = document.createElement('div');
          completionModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          completionModal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Results Not Available</h3>
              <div class="text-left text-gray-600 mb-6 space-y-2">
                <p class="font-medium text-gray-800">ℹ️ Your exam has been submitted successfully</p>
                <p>🔍 Results are being reviewed by the administrator</p>
                <p>📧 Results will be communicated to you separately</p>
                <p class="text-sm text-gray-500 mt-3 pt-2 border-t">You cannot view results for this exam at this time.</p>
              </div>
              <button onclick="this.parentElement.parentElement.remove(); window.location.href='/dashboard'" 
                      class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </button>
            </div>
          `;
          document.body.appendChild(completionModal);
          return;
        }
        
        setResult(examResult);
        setLoading(false);

        const scorePercentage = examResult.percentage ?? (((examResult.score || 0) / (examResult.totalQuestions || 1)) * 100);
        if (scorePercentage >= 50) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } catch (error) {
        console.error('Error parsing exam result:', error);
        setLoading(false);
      }
    } else {
      console.log('❌ No exam result found in localStorage');
      // Redirect to dashboard if no exam result is found
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

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

  // defensive defaults
  const totalQuestions = result.totalQuestions || (result.exam?.questions?.length || 0);
  const scorePercentage = result.percentage ?? (((result.score || 0) / (totalQuestions || 1)) * 100);
  const isPassed = scorePercentage >= 50;
  const correctAnswers = result.score || 0;
  
  // Calculate answered questions more accurately from actual answers
  const answeredQuestions = result.answeredQuestions ?? (result.answers ? 
    Object.keys(result.answers).filter(key => {
      const answer = result.answers[key];
      return answer !== null && answer !== undefined && answer !== '';
    }).length : 0);
  
  // Calculate incorrect answers more accurately
  // Method 1: If we have explicit counts from backend
  let incorrectAnswers = result.incorrectAnswers;
  
  // Method 2: If we have question details from backend
  if (!incorrectAnswers && result.questionDetails) {
    incorrectAnswers = result.questionDetails.filter(q => 
      q.studentAnswer !== null && q.studentAnswer !== undefined && !q.isCorrect
    ).length;
  }
  
  // Method 3: Calculate from answered questions - correct answers
  if (incorrectAnswers === undefined || incorrectAnswers === null) {
    incorrectAnswers = Math.max(0, answeredQuestions - correctAnswers);
  }
  
  // Calculate unanswered questions
  const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);
  
  // Validation: ensure the numbers add up correctly
  const calculatedTotal = correctAnswers + incorrectAnswers + unansweredQuestions;
  if (calculatedTotal !== totalQuestions && totalQuestions > 0) {
    console.warn('⚠️ Question count mismatch:', {
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      calculatedTotal,
      totalQuestions
    });
  }
  
  console.log('📊 Result calculations:', {
    totalQuestions,
    correctAnswers,
    answeredQuestions,
    incorrectAnswers,
    unansweredQuestions,
    resultData: result
  });

  const accuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;
  const completionRate = (answeredQuestions / (totalQuestions || 1)) * 100;

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade(scorePercentage);

  return (
    <>
      {/* Enhanced Print Styles */}
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            
            .print-container {
              background: white !important;
              min-height: 100vh !important;
              padding: 40px 30px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            
            .print-header {
              text-align: center;
              border-bottom: 4px double #2563eb;
              padding: 25px 0;
              margin-bottom: 40px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 8px 8px 0 0;
              position: relative;
            }
            
            .print-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
            }
            
            .print-logo {
              font-size: 36px !important;
              font-weight: bold;
              color: #2563eb !important;
              margin-bottom: 8px;
              text-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
              letter-spacing: 1px;
            }
            
            .print-title {
              font-size: 22px !important;
              color: #374151 !important;
              margin: 0;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            
            .print-subtitle {
              font-size: 14px !important;
              color: #6b7280 !important;
              margin-top: 8px;
              font-style: italic;
            }
            
            .print-result-banner {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
              color: white !important;
              padding: 40px 30px !important;
              text-align: center;
              border-radius: 16px !important;
              margin: 30px 0 40px 0 !important;
              box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4) !important;
              border: 3px solid rgba(255, 255, 255, 0.2) !important;
              position: relative;
              overflow: hidden;
            }
            
            .print-result-banner::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
            }
            
            .print-result-banner.failed {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
              box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4) !important;
              border: 3px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            @keyframes shimmer {
              0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .print-score {
              font-size: 48px !important;
              font-weight: bold;
              margin: 10px 0 !important;
            }
            
            .print-grade {
              font-size: 24px !important;
              font-weight: bold;
              background: rgba(255, 255, 255, 0.2) !important;
              padding: 8px 16px !important;
              border-radius: 20px !important;
              display: inline-block;
              margin: 10px 0 !important;
            }
            
            .print-stats-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 20px !important;
              margin: 30px 0 !important;
            }
            
            .print-stat-card {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
              border: 2px solid #e2e8f0 !important;
              border-radius: 12px !important;
              padding: 25px 20px !important;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
              position: relative;
            }
            
            .print-stat-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
              border-radius: 12px 12px 0 0;
            }
            
            .print-stat-number {
              font-size: 32px !important;
              font-weight: bold;
              color: #2563eb !important;
              margin-bottom: 5px !important;
            }
            
            .print-stat-label {
              font-size: 14px !important;
              color: #64748b !important;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .print-info-section {
              margin: 30px 0 !important;
              padding: 25px !important;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
              border-radius: 12px !important;
              border: 2px solid #e2e8f0 !important;
              border-left: 6px solid #2563eb !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
              position: relative;
            }
            
            .print-info-section h3 {
              color: #2563eb !important;
              font-size: 18px !important;
              font-weight: 700 !important;
              margin-bottom: 15px !important;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .print-info-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 15px !important;
              margin-top: 15px !important;
            }
            
            .print-info-item {
              display: flex !important;
              justify-content: space-between !important;
              padding: 8px 0 !important;
              border-bottom: 1px solid #e2e8f0 !important;
            }
            
            .print-info-label {
              font-weight: 600 !important;
              color: #374151 !important;
            }
            
            .print-info-value {
              color: #6b7280 !important;
            }
            
            .print-footer {
              margin-top: 50px !important;
              padding: 25px 20px !important;
              border-top: 3px double #2563eb !important;
              text-align: center;
              color: #6b7280 !important;
              font-size: 11px !important;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
              border-radius: 0 0 8px 8px;
              position: relative;
            }
            
            .print-footer::before {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
            }
            
            .print-footer p {
              margin: 3px 0 !important;
              line-height: 1.4;
            }
            
            .print-footer .highlight {
              color: #2563eb !important;
              font-weight: 600;
            }
            
            .print-certificate-border {
              border: 4px solid #2563eb !important;
              border-radius: 16px !important;
              padding: 25px !important;
              margin: 25px 0 !important;
              position: relative;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
              box-shadow: 0 4px 15px rgba(37, 99, 235, 0.1) !important;
            }
            
            .print-certificate-border::before {
              content: '';
              position: absolute;
              top: 8px;
              left: 8px;
              right: 8px;
              bottom: 8px;
              border: 2px dashed #93c5fd !important;
              border-radius: 12px !important;
            }
            
            .print-certificate-border::after {
              content: '';
              position: absolute;
              top: 15px;
              left: 15px;
              right: 15px;
              bottom: 15px;
              border: 1px solid #dbeafe !important;
              border-radius: 8px !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            .print-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 140px !important;
              color: rgba(37, 99, 235, 0.04) !important;
              font-weight: 900;
              z-index: -1;
              pointer-events: none;
              font-family: 'Arial Black', Arial, sans-serif;
              letter-spacing: 8px;
              text-shadow: 0 0 20px rgba(37, 99, 235, 0.02);
            }
            
            .print-decorative-corners {
              position: absolute;
              width: 30px;
              height: 30px;
              border: 3px solid #2563eb;
            }
            
            .print-decorative-corners.top-left {
              top: 15px;
              left: 15px;
              border-right: none;
              border-bottom: none;
            }
            
            .print-decorative-corners.top-right {
              top: 15px;
              right: 15px;
              border-left: none;
              border-bottom: none;
            }
            
            .print-decorative-corners.bottom-left {
              bottom: 15px;
              left: 15px;
              border-right: none;
              border-top: none;
            }
            
            .print-decorative-corners.bottom-right {
              bottom: 15px;
              right: 15px;
              border-left: none;
              border-top: none;
            }
          }
          
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}
      </style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 relative print-container">
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <Trophy className="w-32 h-32 text-yellow-500" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
        </div>
      )}

        {/* Print Header - Only visible when printing */}
        <div className="print-only print-header">
          <div className="print-decorative-corners top-left"></div>
          <div className="print-decorative-corners top-right"></div>
          <div className="print-logo">🎓 Exam Portal</div>
          <h1 className="print-title">Official Exam Result Certificate</h1>
          <p className="print-subtitle">Academic Performance Report</p>
          <div className="print-decorative-corners bottom-left"></div>
          <div className="print-decorative-corners bottom-right"></div>
        </div>

        {/* Print Watermark - Only visible when printing */}
        <div className="print-only print-watermark">OFFICIAL</div>

        <div className="max-w-6xl mx-auto px-4">
        <div className={`rounded-2xl shadow-2xl overflow-hidden mb-8 print-certificate-border ${isPassed ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 print-result-banner' : 'bg-gradient-to-r from-red-500 via-red-600 to-rose-600 print-result-banner failed'}`}>
          <div className="p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                {isPassed ? (
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-4xl font-bold">Congratulations! 🎉</h1>
                      <p className="text-xl text-white/90">You have successfully passed the exam</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <XCircle className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-4xl font-bold">Not Passed</h1>
                      <p className="text-xl text-white/90">Keep practicing, you'll get there!</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2 print-score">{Math.round(scorePercentage)}%</div>
                  <div className="text-white/80">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold print-grade ${gradeInfo.bg} ${gradeInfo.color}`}>
                    {gradeInfo.grade}
                  </div>
                  <div className="text-white/80 mt-2">Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{correctAnswers}/{totalQuestions}</div>
                  <div className="text-white/80">Correct Answers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'questions', label: 'Question Analysis', icon: FileText },
                { id: 'insights', label: 'Insights', icon: Target }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-stats-grid">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 print-stat-card">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600 print-stat-number">{correctAnswers}</div>
                        <div className="text-sm text-green-600 print-stat-label">Correct</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 print-stat-card">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600 print-stat-number">{incorrectAnswers}</div>
                        <div className="text-sm text-red-600 print-stat-label">Incorrect</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 print-stat-card">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-8 h-8 text-gray-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-600 print-stat-number">{unansweredQuestions}</div>
                        <div className="text-sm text-gray-600 print-stat-label">Unanswered</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 print-stat-card">
                    <div className="flex items-center space-x-3">
                      <Timer className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600 print-stat-number">{result.duration || 'N/A'}</div>
                        <div className="text-sm text-blue-600 print-stat-label">Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 print-info-grid">
                  <div className="bg-gray-50 p-6 rounded-xl print-info-section">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Student Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Name:</span>
                        <span className="font-medium print-info-value">{result.studentName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Email:</span>
                        <span className="font-medium print-info-value">{result.studentEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Session ID:</span>
                        <span className="font-mono text-sm print-info-value">{result.sessionId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl print-info-section">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                      Exam Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Title:</span>
                        <span className="font-medium print-info-value">{result.examTitle}</span>
                      </div>
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Duration:</span>
                        <span className="font-medium print-info-value">{result.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between print-info-item">
                        <span className="text-gray-600 print-info-label">Date:</span>
                        <span className="font-medium print-info-value">{result.submissionTime ? new Date(result.submissionTime).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{Math.round(accuracy)}%</div>
                    <div className="text-blue-700 font-medium">Accuracy Rate</div>
                    <div className="text-sm text-blue-600 mt-1">Correct answers / Attempted</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">{Math.round(completionRate)}%</div>
                    <div className="text-green-700 font-medium">Completion Rate</div>
                    <div className="text-sm text-green-600 mt-1">Questions attempted</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className={`text-3xl font-bold mb-2 ${gradeInfo.color}`}>{gradeInfo.grade}</div>
                    <div className="text-purple-700 font-medium">Final Grade</div>
                    <div className="text-sm text-purple-600 mt-1">Based on performance</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Score</span>
                      <span className="text-sm text-gray-500">{Math.round(scorePercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${isPassed ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(scorePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Accuracy</span>
                      <span className="text-sm text-gray-500">{Math.round(accuracy)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(accuracy, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Completion</span>
                      <span className="text-sm text-gray-500">{Math.round(completionRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Question Analysis</h3>
                  <button
                    onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {showQuestionDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showQuestionDetails ? 'Hide Details' : 'Show Details'}</span>
                  </button>
                </div>

                {result.exam?.showQuestionAnalysis ? (
                  <div className="space-y-4">
                    {(result.exam?.questions || []).map((question, index) => {
                      const qId = question?._id ?? index;
                      const studentAnswer = result.answers?.[question?._id] ?? result.answers?.[index];
                      const correctAnswer = question?.correctAnswer;
                      const hasAnswer = studentAnswer !== null && studentAnswer !== undefined && studentAnswer !== '';
                      const isCorrect = hasAnswer && (studentAnswer === correctAnswer);

                      return (
                        <div key={qId} className={`p-4 rounded-lg border-2 ${
                          !hasAnswer ? 'border-gray-300 bg-gray-50' :
                            isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                                {!hasAnswer ? (
                                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">Unanswered</span>
                                ) : isCorrect ? (
                                  <span className="px-2 py-1 bg-green-200 text-green-700 text-xs rounded-full">Correct</span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-200 text-red-700 text-xs rounded-full">Incorrect</span>
                                )}
                              </div>

                              {showQuestionDetails && (
                                <div className="space-y-2">
                                  <p className="text-gray-800">{question?.question || question?.text || `Question ${index + 1}`}</p>
                                  {hasAnswer && (
                                    <div className="text-sm">
                                      <p className="text-gray-600">Your answer: <span className="font-medium">{String(studentAnswer)}</span></p>
                                      {!isCorrect && (
                                        <p className="text-green-600">Correct answer: <span className="font-medium">{String(correctAnswer)}</span></p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-4">
                              {!hasAnswer ? (
                                <AlertCircle className="w-6 h-6 text-gray-500" />
                              ) : isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Question Analysis Not Available</h3>
                    <p className="text-gray-600">The instructor has not enabled detailed question analysis for this exam.</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'insights' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Performance Insights</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-3">Strengths</h4>
                    <ul className="space-y-2 text-blue-800">
                      {accuracy >= 80 && <li>• Excellent accuracy rate</li>}
                      {completionRate >= 90 && <li>• Great completion rate</li>}
                      {isPassed && <li>• Successfully met passing criteria</li>}
                      {scorePercentage >= 75 && <li>• Strong overall performance</li>}
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-orange-900 mb-3">Areas for Improvement</h4>
                    <ul className="space-y-2 text-orange-800">
                      {accuracy < 70 && <li>• Focus on accuracy over speed</li>}
                      {completionRate < 80 && <li>• Work on time management</li>}
                      {unansweredQuestions > 0 && <li>• Attempt all questions</li>}
                      {!isPassed && <li>• Review fundamental concepts</li>}
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-3">Recommendations</h4>
                  <div className="text-purple-800 space-y-2">
                    {scorePercentage >= 80 ? (
                      <p>🎉 Excellent work! You're ready for more advanced topics.</p>
                    ) : scorePercentage >= 60 ? (
                      <p>📚 Good foundation! Review the topics you missed and practice similar questions.</p>
                    ) : (
                      <p>📖 Consider reviewing the course material and taking practice tests before retrying.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Footer - Only visible when printing */}
        <div className="print-only print-footer">
          <p>This is an <span className="highlight">official exam result certificate</span> generated by Exam Portal.</p>
          <p>Document ID: <span className="highlight">{result.sessionId}</span> | Generated on: <span className="highlight">{new Date().toLocaleDateString()}</span> at <span className="highlight">{new Date().toLocaleTimeString()}</span></p>
          <p>This certificate is digitally verified and authenticated.</p>
          <p>© {new Date().getFullYear()} <span className="highlight">Exam Portal</span>. All rights reserved. | Unauthorized reproduction is prohibited.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center no-print">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={downloadMarksheet}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download Result</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span>Print Result</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Exam Result',
                  text: `I scored ${Math.round(scorePercentage)}% in ${result.examTitle || 'the exam'}!`,
                });
              }
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share Result</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default LiveExamResult;
