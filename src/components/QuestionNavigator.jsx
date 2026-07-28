import React from 'react';
import { X, Flag, CheckCircle, Circle, AlertCircle } from 'lucide-react';

function QuestionNavigator({ 
  questions, 
  answers, 
  flaggedQuestions, 
  currentIndex, 
  onSelect, 
  onClose,
  onSubmit,
  questionStatus = {} // Enhanced status tracking
}) {
  const getQuestionStatus = (questionId, index) => {
    const status = questionStatus[questionId] || 'not-visited';
    const isAnswered = answers[questionId] !== undefined;
    const isFlagged = flaggedQuestions.includes(questionId);
    const isCurrent = index === currentIndex;

    return { status, isAnswered, isFlagged, isCurrent };
  };

  // Safety check for questions
  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Question Navigator</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">No questions available in this exam.</p>
            <p className="text-sm text-gray-500 mt-2">Please contact your instructor.</p>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: questions.length,
    answered: 0,
    notAnswered: 0,
    marked: 0,
    notVisited: 0,
  };

  questions.forEach(q => {
    const hasAnswer = answers[q._id] !== undefined;
    const isFlagged = flaggedQuestions.includes(q._id);
    // questionStatus is only reliable when the caller actually tracks
    // per-question visits (visitQuestion); some exam screens never call
    // it, so fall back to the answer/flag state, which is always accurate.
    const visited = questionStatus[q._id] !== undefined || hasAnswer || isFlagged;

    if (hasAnswer && isFlagged) {
      stats.answered++;
      stats.marked++;
    } else if (hasAnswer) {
      stats.answered++;
    } else if (isFlagged) {
      stats.marked++;
      stats.notAnswered++;
    } else if (visited) {
      stats.notAnswered++;
    } else {
      stats.notVisited++;
    }
  });

  const answeredCount = stats.answered;
  const unansweredCount = stats.notAnswered + stats.notVisited;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Question Navigator</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center bg-white p-3 rounded-lg border-2 border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
            <div className="text-xs text-gray-600">Answered</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg border-2 border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.notAnswered}</div>
            <div className="text-xs text-gray-600">Not Answered</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.marked}</div>
            <div className="text-xs text-gray-600">Marked</div>
          </div>
          <div className="text-center bg-white p-3 rounded-lg border-2 border-gray-300">
            <div className="text-2xl font-bold text-gray-500">{stats.notVisited}</div>
            <div className="text-xs text-gray-600">Not Visited</div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {questions.map((question, index) => {
              const { status, isAnswered, isFlagged, isCurrent } = getQuestionStatus(question._id, index);

              // Enhanced color coding
              let bgColor = 'bg-white border-2 border-gray-300 text-gray-700'; // not-visited
              
              if (isCurrent) {
                bgColor = 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 border-blue-600';
              } else if (status === 'answered-marked' || (isAnswered && isFlagged)) {
                bgColor = 'bg-purple-100 border-2 border-purple-500 text-purple-800 hover:bg-purple-200';
              } else if (status === 'answered' || isAnswered) {
                bgColor = 'bg-green-100 border-2 border-green-500 text-green-800 hover:bg-green-200';
              } else if (status === 'marked' || isFlagged) {
                bgColor = 'bg-yellow-100 border-2 border-yellow-500 text-yellow-800 hover:bg-yellow-200';
              } else if (status === 'not-answered') {
                bgColor = 'bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100';
              }

              return (
                <button
                  key={question._id}
                  onClick={() => onSelect(index)}
                  className={`relative aspect-square rounded-lg font-semibold text-sm transition-all ${bgColor}`}
                >
                  {index + 1}
                  {isFlagged && (
                    <Flag className="w-3 h-3 absolute top-0.5 right-0.5" fill="currentColor" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded-lg"></div>
              <span className="text-sm text-gray-700">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-50 border-2 border-red-300 rounded-lg"></div>
              <span className="text-sm text-gray-700">Not Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-500 rounded-lg"></div>
              <span className="text-sm text-gray-700">Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 border-2 border-purple-500 rounded-lg"></div>
              <span className="text-sm text-gray-700">Answered & Marked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-lg"></div>
              <span className="text-sm text-gray-700">Not Visited</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="text-sm text-gray-700">Current Question</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            
            {unansweredCount > 0 && (
              <div className="text-sm text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">
                {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
              </div>
            )}

            <button
              onClick={onSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionNavigator;
