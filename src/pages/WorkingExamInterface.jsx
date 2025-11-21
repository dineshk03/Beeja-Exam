import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, Flag, ChevronLeft, ChevronRight, 
  Grid3x3, CheckCircle, Calculator as CalcIcon, Camera 
} from 'lucide-react';

function WorkingExamInterface() {
  const { examId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes

  // Mock exam data
  const mockExam = {
    title: 'TCS iON Style Exam',
    duration: 60,
    allowCalculator: true,
    requirePhotoCapture: true,
    showReviewScreen: true,
    questions: [
      {
        _id: 'q1',
        question: 'What is the output of console.log(2 + 2)?',
        type: 'multiple-choice',
        options: ['3', '4', '22', 'undefined'],
        points: 2
      },
      {
        _id: 'q2',
        question: 'Which of the following are JavaScript data types?',
        type: 'multiple-answer',
        options: ['String', 'Number', 'Boolean', 'Character'],
        points: 3
      },
      {
        _id: 'q3',
        question: 'Write a function to reverse a string in JavaScript.',
        type: 'code-test',
        language: 'javascript',
        starterCode: 'function reverseString(str) {\n  // Your code here\n  return "";\n}',
        points: 5
      }
    ]
  };

  const currentQuestion = mockExam.questions[currentQuestionIndex];
  const totalQuestions = mockExam.questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: answer
    }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions(prev => {
      const isFlagged = prev.includes(currentQuestion._id);
      if (isFlagged) {
        return prev.filter(id => id !== currentQuestion._id);
      } else {
        return [...prev, currentQuestion._id];
      }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TCS iON Style Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                🚀 {mockExam.title}
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Calculator Button */}
              {mockExam.allowCalculator && (
                <button
                  onClick={() => setShowCalculator(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <CalcIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Calculator</span>
                </button>
              )}
              
              {/* Photo Capture Button */}
              {mockExam.requirePhotoCapture && (
                <button
                  onClick={() => alert('Photo capture would open here')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden md:inline">Photo</span>
                </button>
              )}
              
              {/* Timer */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
              
              {/* Navigator Button */}
              <button
                onClick={() => setShowNavigator(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Grid3x3 className="w-4 h-4" />
                <span>Navigator</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-600">
                  {currentQuestion.points} points
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>
            
            <button
              onClick={handleToggleFlag}
              className={`ml-4 p-2 rounded-lg transition-colors ${
                flaggedQuestions.includes(currentQuestion._id)
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={flaggedQuestions.includes(currentQuestion._id) ? 'Unflag' : 'Flag for review'}
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Question Content */}
          <div className="mb-8">
            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion._id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-sm font-medium mr-3 ${
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'multiple-answer' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const selectedAnswers = answers[currentQuestion._id] || [];
                  const isSelected = selectedAnswers.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const current = answers[currentQuestion._id] || [];
                        const newAnswers = isSelected 
                          ? current.filter(i => i !== index)
                          : [...current, index];
                        handleAnswerSelect(newAnswers);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${
                          isSelected
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className={`text-sm font-medium mr-3 ${
                          isSelected ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'code-test' && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Write your code</h4>
                    <span className="text-sm text-gray-600">Language: {currentQuestion.language}</span>
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <textarea
                      value={answers[currentQuestion._id] || currentQuestion.starterCode || ''}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write your code here..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Answered: {answeredCount} / {totalQuestions}
              </p>
              <p className="text-xs text-gray-500">
                Flagged: {flaggedQuestions.length}
              </p>
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <div className="flex space-x-3">
                {mockExam.showReviewScreen && (
                  <button
                    onClick={() => alert('Review screen would open here')}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>Review & Submit</span>
                  </button>
                )}
                <button
                  onClick={() => alert('Exam would be submitted here')}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Exam</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* TCS iON Status Bar */}
      <div className="bg-gray-100 border-t px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Status:</span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Answered: {answeredCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Flagged: {flaggedQuestions.length}</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Not Visited: {totalQuestions - Math.max(currentQuestionIndex + 1, answeredCount)}</span>
            </span>
          </div>
          <div className="text-gray-600">
            Enchanced Style Interface Active 🚀
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkingExamInterface;
