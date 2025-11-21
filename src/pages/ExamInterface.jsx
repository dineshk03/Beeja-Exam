import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, Flag, ChevronLeft, ChevronRight, 
  Grid3x3, AlertTriangle, CheckCircle, Calculator as CalcIcon, Camera 
} from 'lucide-react';
import api from '../api/axios';
import { useExamStore } from '../store/examStore';
import ExamTimer from '../components/ExamTimer';
import QuestionNavigator from '../components/QuestionNavigator';
import SubmitConfirmation from '../components/SubmitConfirmation';
import MultipleChoiceQuestion from '../components/questions/MultipleChoiceQuestion';
import MultipleAnswerQuestion from '../components/questions/MultipleAnswerQuestion';
import ShortAnswerQuestion from '../components/questions/ShortAnswerQuestion';
import MatchFollowingQuestion from '../components/questions/MatchFollowingQuestion';
import CodeTestQuestion from '../components/questions/CodeTestQuestion';
import InstructionsPage from '../components/InstructionsPage';
import Calculator from '../components/Calculator';
import ReviewScreen from '../components/ReviewScreen';
import PhotoCapture from '../components/PhotoCapture';
// import SectionTimer from '../components/SectionTimer'; // Temporarily disabled

function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const {
    currentExam,
    sessionId,
    sessionStartTime,
    answers,
    flaggedQuestions,
    currentQuestionIndex,
    questionStatus,
    visitedQuestions,
    showInstructions,
    showReviewScreen,
    initialPhotoTaken,
    currentSection,
    setAnswer,
    toggleFlag,
    setCurrentQuestionIndex,
    visitQuestion,
    setShowInstructions,
    setShowReviewScreen,
    addPhotoCapture,
    setInitialPhotoTaken,
    resetExam,
  } = useExamStore();

  const [showNavigator, setShowNavigator] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  useEffect(() => {
    if (!currentExam || !sessionId) {
      navigate('/dashboard');
    }
  }, [currentExam, sessionId, navigate]);

  // Set up automatic photo capture intervals
  useEffect(() => {
    if (currentExam?.requirePhotoCapture && currentExam?.photoCaptureInterval && initialPhotoTaken) {
      const interval = setInterval(() => {
        setShowPhotoCapture(true);
      }, currentExam.photoCaptureInterval);

      return () => clearInterval(interval);
    }
  }, [currentExam, initialPhotoTaken]);

  if (!currentExam) {
    return null;
  }

  // Show instructions page first
  if (showInstructions) {
    return (
      <InstructionsPage
        exam={currentExam}
        onStart={() => setShowInstructions(false)}
      />
    );
  }

  // Show review screen before final submission
  if (showReviewScreen) {
    return (
      <ReviewScreen
        exam={currentExam}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        questionStatus={questionStatus}
        onBack={() => setShowReviewScreen(false)}
        onSubmit={handleSubmit}
        hasSections={currentExam.hasSections}
      />
    );
  }

  const currentQuestion = currentExam.questions[currentQuestionIndex];
  const totalQuestions = currentExam.questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.length;

  const handleAnswerSelect = async (optionIndex) => {
    setAnswer(currentQuestion._id, optionIndex);
    
    try {
      await api.post(`/exams/session/${sessionId}/answer`, {
        questionId: currentQuestion._id,
        answer: optionIndex,
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleCodeAnswerChange = async (codeValue) => {
    setAnswer(currentQuestion._id, codeValue);
    
    try {
      await api.post(`/exams/session/${sessionId}/answer`, {
        questionId: currentQuestion._id,
        answer: codeValue,
      });
      console.log('Code answer saved successfully:', codeValue?.length, 'characters');
    } catch (error) {
      console.error('Failed to save code answer:', error);
    }
  };

  const handleToggleFlag = () => {
    toggleFlag(currentQuestion._id);
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/exams/session/${sessionId}/submit`);
      navigate('/exam/result');
    } catch (error) {
      console.error('Failed to submit exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentExam.title}
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentExam.allowCalculator && (
                <button
                  onClick={() => setShowCalculator(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <CalcIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Calculator</span>
                </button>
              )}
              
              {currentExam.requirePhotoCapture && (
                <button
                  onClick={() => setShowPhotoCapture(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden md:inline">Photo</span>
                </button>
              )}
              
              <ExamTimer 
                duration={currentExam.duration}
                startTime={sessionStartTime}
                onTimeUp={handleTimeUp}
              />
              
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

          {/* Question Content - Dynamic based on type */}
          <div className="mb-8">
            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'single-choice') && (
              <MultipleChoiceQuestion
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion._id]}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion.type === 'multiple-answer' && (
              <MultipleAnswerQuestion
                question={currentQuestion}
                selectedAnswers={answers[currentQuestion._id] || []}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion.type === 'short-answer' && (
              <ShortAnswerQuestion
                question={currentQuestion}
                answer={answers[currentQuestion._id]}
                onAnswerChange={handleCodeAnswerChange}
              />
            )}

            {currentQuestion.type === 'match-following' && (
              <MatchFollowingQuestion
                question={currentQuestion}
                answers={answers[currentQuestion._id]}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion.type === 'code-test' && (
              <CodeTestQuestion
                question={currentQuestion}
                answer={answers[currentQuestion._id]}
                onAnswerChange={handleCodeAnswerChange}
              />
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
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <div className="flex space-x-3">
                {currentExam.showReviewScreen && (
                  <button
                    onClick={() => setShowReviewScreen(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>Review & Submit</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{currentExam.showReviewScreen ? 'Direct Submit' : 'Submit Exam'}</span>
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

      {/* Question Navigator Modal */}
      {showNavigator && (
        <QuestionNavigator
          questions={currentExam.questions}
          currentIndex={currentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onQuestionSelect={setCurrentQuestionIndex}
          onClose={() => setShowNavigator(false)}
        />
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={(photoData) => {
            addPhotoCapture(photoData);
            setShowPhotoCapture(false);
            if (!initialPhotoTaken) {
              setInitialPhotoTaken(true);
            }
          }}
          onClose={() => setShowPhotoCapture(false)}
          isInitialCapture={!initialPhotoTaken}
        />
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <SubmitConfirmation
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

export default ExamInterface;
