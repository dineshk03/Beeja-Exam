import React from 'react';

function MultipleChoiceQuestion({ question, selectedAnswer, onAnswerSelect }) {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === index;
        
        return (
          <button
            key={index}
            onClick={() => onAnswerSelect(index)}
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
  );
}

export default MultipleChoiceQuestion;
