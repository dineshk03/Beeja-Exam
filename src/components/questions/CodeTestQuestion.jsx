import React from 'react';
import Editor from '@monaco-editor/react';

function CodeTestQuestion({ question, answer, onAnswerChange }) {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">Write your code</h4>
          <span className="text-sm text-gray-600">Language: {question.language}</span>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <Editor
            height="400px"
            language={question.language || 'javascript'}
            value={answer || question.starterCode || ''}
            onChange={(value) => onAnswerChange(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {question.testCases && question.testCases.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Test Cases</h4>
          <div className="space-y-2">
            {question.testCases.map((testCase, index) => (
              <div key={index} className="bg-white p-3 rounded border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Input:</span>
                    <code className="ml-2 text-gray-900">{testCase.input}</code>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expected Output:</span>
                    <code className="ml-2 text-gray-900">{testCase.expectedOutput}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeTestQuestion;
