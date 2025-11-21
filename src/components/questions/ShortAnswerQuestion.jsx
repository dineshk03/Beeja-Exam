import React from 'react';

function ShortAnswerQuestion({ question, answer, onAnswerChange }) {
  return (
    <div>
      <textarea
        value={answer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        rows="4"
        placeholder="Type your answer here..."
      />
      {question.caseSensitive && (
        <p className="text-sm text-yellow-600 mt-2">
          ⚠️ This answer is case-sensitive
        </p>
      )}
    </div>
  );
}

export default ShortAnswerQuestion;
