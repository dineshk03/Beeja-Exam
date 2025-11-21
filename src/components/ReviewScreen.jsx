import React from 'react';
import { CheckCircle, XCircle, Flag, AlertCircle, ArrowLeft, Send } from 'lucide-react';

function ReviewScreen({ exam, answers, flaggedQuestions, questionStatus, onBack, onSubmit, hasSections }) {
  const getQuestions = () => {
    if (hasSections) {
      return exam.sections.flatMap((section, sectionIndex) => 
        section.questions.map((q, qIndex) => ({
          ...q,
          sectionIndex,
          sectionName: section.name,
          questionIndex: qIndex,
        }))
      );
    }
    return exam.questions || [];
  };

  const questions = getQuestions();

  const getStatusInfo = (questionId) => {
    // Handle both Map and Object types for questionStatus
    const status = questionStatus?.get ? questionStatus.get(questionId) : questionStatus?.[questionId] || 'not-visited';
    const isFlagged = flaggedQuestions.includes(questionId);
    // Handle both Map and Object types for answers
    const hasAnswer = answers?.has ? answers.has(questionId) : (answers?.[questionId] !== undefined);

    let statusText = 'Not Visited';
    let statusColor = 'bg-gray-200 text-gray-700';
    let icon = AlertCircle;

    if (status === 'not-visited') {
      statusText = 'Not Visited';
      statusColor = 'bg-gray-200 text-gray-700';
      icon = AlertCircle;
    } else if (hasAnswer && isFlagged) {
      statusText = 'Answered & Marked';
      statusColor = 'bg-purple-100 text-purple-700 border-2 border-purple-400';
      icon = Flag;
    } else if (hasAnswer) {
      statusText = 'Answered';
      statusColor = 'bg-green-100 text-green-700';
      icon = CheckCircle;
    } else if (isFlagged) {
      statusText = 'Marked for Review';
      statusColor = 'bg-yellow-100 text-yellow-700';
      icon = Flag;
    } else {
      statusText = 'Not Answered';
      statusColor = 'bg-red-100 text-red-700';
      icon = XCircle;
    }

    return { statusText, statusColor, icon };
  };

  const stats = {
    answered: 0,
    notAnswered: 0,
    marked: 0,
    notVisited: 0,
  };

  questions.forEach((q) => {
    // Handle both Map and Object types
    const hasAnswer = answers?.has ? answers.has(q._id) : (answers?.[q._id] !== undefined);
    const isFlagged = flaggedQuestions.includes(q._id);
    const status = questionStatus?.get ? questionStatus.get(q._id) : questionStatus?.[q._id] || 'not-visited';

    if (status === 'not-visited') {
      stats.notVisited++;
    } else if (hasAnswer && isFlagged) {
      stats.answered++;
      stats.marked++;
    } else if (hasAnswer) {
      stats.answered++;
    } else if (isFlagged) {
      stats.marked++;
    } else {
      stats.notAnswered++;
    }
  });

  const groupedQuestions = hasSections
    ? exam.sections.map((section, sectionIndex) => ({
        sectionName: section.name,
        questions: questions.filter((q) => q.sectionIndex === sectionIndex),
      }))
    : [{ sectionName: 'All Questions', questions }];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Answers</h1>
          <p className="text-gray-600">
            Please review your answers before final submission. You can go back to change any answer.
          </p>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Answered</p>
                <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Answered</p>
                <p className="text-2xl font-bold text-red-600">{stats.notAnswered}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marked</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.marked}</p>
              </div>
              <Flag className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Visited</p>
                <p className="text-2xl font-bold text-gray-600">{stats.notVisited}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Warning if unanswered questions */}
        {(stats.notAnswered > 0 || stats.notVisited > 0) && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900">Incomplete Exam</h3>
                <p className="text-amber-700 text-sm">
                  You have {stats.notAnswered + stats.notVisited} unanswered question(s). 
                  We recommend answering all questions before submission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions Review */}
        {groupedQuestions.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-white rounded-lg shadow-md p-6 mb-6">
            {hasSections && (
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b">
                {group.sectionName}
              </h2>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {group.questions.map((question, index) => {
                const { statusText, statusColor, icon: Icon } = getStatusInfo(question._id);
                const globalIndex = questions.findIndex(q => q._id === question._id);

                return (
                  <div
                    key={question._id}
                    className={`p-4 rounded-lg border-2 ${statusColor} transition-all hover:shadow-lg cursor-default`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">Q{globalIndex + 1}</span>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium">{statusText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-500"></div>
              <span className="text-sm text-gray-700">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-500"></div>
              <span className="text-sm text-gray-700">Not Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-500"></div>
              <span className="text-sm text-gray-700">Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gray-200 border-2 border-gray-400"></div>
              <span className="text-sm text-gray-700">Not Visited</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Exam</span>
          </button>

          <button
            onClick={onSubmit}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Send className="w-5 h-5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewScreen;
