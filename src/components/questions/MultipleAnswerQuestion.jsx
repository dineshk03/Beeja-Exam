import React from 'react';

function MultipleAnswerQuestion({ question, selectedAnswers = [], onAnswerSelect }) {
  const handleToggle = (index) => {
    const newAnswers = selectedAnswers.includes(index)
      ? selectedAnswers.filter(i => i !== index)
      : [...selectedAnswers, index];
    onAnswerSelect(newAnswers);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4 italic">
        Select all that apply
      </p>
      {question.options.map((option, index) => {
        const isSelected = selectedAnswers.includes(index);
        
        return (
          <button
            key={index}
            onClick={() => handleToggle(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium mr-3 ${
                isSelected ? 'text-indigo-700' : 'text-gray-700'
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
  );
}

export default MultipleAnswerQuestion;
