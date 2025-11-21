import React, { useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, RotateCcw, Shuffle } from 'lucide-react';
import notificationManager from '../../utils/notificationManager';

function MatchFollowingQuestion({ question, answers, onAnswerSelect }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredTarget, setHoveredTarget] = useState(null);
  const [showConnections, setShowConnections] = useState(true);
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [dragAttempted, setDragAttempted] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Validate question data
  if (!question || !question.leftItems || !question.rightItems) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <h3 className="text-red-800 font-bold mb-2">⚠️ Question Data Error</h3>
        <p className="text-red-700">This drag & drop question is missing required data.</p>
        <div className="mt-4 p-3 bg-white rounded text-sm">
          <p className="font-mono text-gray-700">Question data: {JSON.stringify(question, null, 2)}</p>
        </div>
      </div>
    );
  }

  // Ensure arrays exist
  const leftItems = question.leftItems || [];
  const rightItems = question.rightItems || [];

  if (leftItems.length === 0 || rightItems.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <h3 className="text-yellow-800 font-bold mb-2">⚠️ Empty Question</h3>
        <p className="text-yellow-700">This question has no items to match.</p>
        <p className="text-sm text-yellow-600 mt-2">
          Left items: {leftItems.length} | Right items: {rightItems.length}
        </p>
      </div>
    );
  }

  const handleMatchChange = (leftIndex, rightIndex) => {
    const newAnswers = { ...(answers || {}) };
    if (rightIndex === null || rightIndex === undefined || rightIndex === '') {
      delete newAnswers[leftIndex];
    } else {
      newAnswers[leftIndex] = parseInt(rightIndex);
    }
    onAnswerSelect(newAnswers);
  };

  const handleDragStart = (e, leftIndex) => {
    console.log('🚀 DRAG START! Question index:', leftIndex);
    setDraggedItem(leftIndex);
    setDragAttempted(true);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leftIndex.toString());
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
    e.target.style.transform = 'scale(1.05)';
    
    // Show immediate feedback
    console.log('✅ Drag started successfully for question:', leftIndex + 1);
  };

  const handleDragEnd = (e) => {
    console.log('🏁 DRAG END');
    e.target.style.opacity = '1';
    e.target.style.transform = 'scale(1)';
    // Don't reset draggedItem here - let the drop handler do it
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, rightIndex) => {
    e.preventDefault();
    setHoveredTarget(rightIndex);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only clear hover if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setHoveredTarget(null);
    }
  };

  const handleDrop = (e, rightIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 DROP EVENT TRIGGERED!');
    console.log('Dropping on rightIndex:', rightIndex);
    console.log('Current draggedItem state:', draggedItem);
    
    // Always use the state-based draggedItem as it's more reliable
    if (draggedItem !== null && draggedItem !== undefined) {
      console.log('✅ Creating match:', draggedItem, '→', rightIndex);
      handleMatchChange(draggedItem, rightIndex);
      
      // Show success feedback with modern notification
      notificationManager.success(
        'Perfect Match! 🎯',
        `Question ${draggedItem + 1} → Answer ${String.fromCharCode(65 + rightIndex)}`,
        { autoCloseDelay: 2500 }
      );
    } else {
      console.log('❌ No dragged item found');
      notificationManager.warning(
        'Oops! Try Again 🤔',
        'Drag operation failed. Please try dragging again.',
        { autoCloseDelay: 3000 }
      );
    }
    
    setDraggedItem(null);
    setHoveredTarget(null);
  };

  const clearAllMatches = () => {
    onAnswerSelect({});
  };

  const handleQuestionClick = (leftIndex) => {
    if (selectedQuestion === leftIndex) {
      setSelectedQuestion(null); // Deselect if clicking same question
    } else {
      setSelectedQuestion(leftIndex);
      console.log('📝 Question selected:', leftIndex + 1);
    }
  };

  const handleAnswerClick = (rightIndex) => {
    if (selectedQuestion !== null) {
      handleMatchChange(selectedQuestion, rightIndex);
      notificationManager.success(
        'Excellent Choice! ✨',
        `Question ${selectedQuestion + 1} → Answer ${String.fromCharCode(65 + rightIndex)}`,
        { autoCloseDelay: 2500 }
      );
      setSelectedQuestion(null);
      console.log('✅ Click match created:', selectedQuestion, '→', rightIndex);
    } else {
      notificationManager.info(
        'Select a Question First 👆',
        'Click on a question in Column A, then click its matching answer in Column B.',
        { autoCloseDelay: 4000 }
      );
    }
  };

  const getMatchedCount = () => {
    return Object.keys(answers || {}).length;
  };

  const isRightItemUsed = (rightIndex) => {
    return Object.values(answers || {}).includes(rightIndex);
  };

  const getConnectionColor = (leftIndex) => {
    const rightIndex = answers?.[leftIndex];
    if (rightIndex !== undefined) {
      return 'text-blue-500';
    }
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-gray-700">
              Matched: {getMatchedCount()}/{question.leftItems.length}
            </span>
          </div>
          <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
              style={{ width: `${(getMatchedCount() / question.leftItems.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDropdowns(!showDropdowns)}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            📋 {showDropdowns ? 'Hide' : 'Show'} Dropdowns
          </button>
          <button
            onClick={() => setShowConnections(!showConnections)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {showConnections ? 'Hide' : 'Show'} Connections
          </button>
          <button
            onClick={clearAllMatches}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          🎯 <strong>Instructions:</strong> Match each question in Column A with its correct answer in Column B
        </p>
        <p className="text-blue-700 text-sm mt-2">
          🖱️ <strong>Method 1 - Drag & Drop:</strong> Click and drag questions from Column A to their answers in Column B
        </p>
        <p className="text-blue-700 text-sm mt-1">
          👆 <strong>Method 2 - Click to Match:</strong> Click a question in Column A, then click its answer in Column B
        </p>
        {showDropdowns && (
          <p className="text-blue-700 text-sm mt-1">
            📋 <strong>Alternative:</strong> Use dropdown menus if drag & drop doesn't work on your device
          </p>
        )}
        <p className="text-blue-700 text-sm mt-2">
          ❌ <strong>Remove matches:</strong> Click the red X button • 🔄 <strong>Reset all:</strong> Use "Clear All" button
        </p>
      </div>

      {/* Main Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column A - Questions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <h4 className="text-lg font-bold text-gray-900">Column A - Questions</h4>
            <span className="text-sm text-gray-500">(Drag from here)</span>
          </div>
          <div className="space-y-3">
            {question.leftItems.map((item, leftIndex) => {
              const isMatched = answers?.[leftIndex] !== undefined;
              const matchedRightIndex = answers?.[leftIndex];
              
              return (
                <div
                  key={leftIndex}
                  draggable
                  onDragStart={(e) => handleDragStart(e, leftIndex)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleQuestionClick(leftIndex)}
                  className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedQuestion === leftIndex
                      ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                      : draggedItem === leftIndex
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : isMatched
                      ? 'border-green-400 bg-green-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                  }`}
                  title="Drag to Column B or click to select, then click an answer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                        {leftIndex + 1}
                      </span>
                      <span className="text-gray-900 font-medium">{item}</span>
                    </div>
                    
                    {isMatched && (
                      <div className="flex items-center space-x-2">
                        {showConnections && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {String.fromCharCode(65 + matchedRightIndex)}
                            </span>
                          </div>
                        )}
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown for selection - only show when enabled */}
                  {showDropdowns && (
                    <div className="mt-3">
                      <select
                        value={answers?.[leftIndex] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            handleMatchChange(leftIndex, null);
                          } else {
                            handleMatchChange(leftIndex, parseInt(value));
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-blue-400 transition-colors"
                      >
                        <option value="">Select match...</option>
                        {question.rightItems.map((rightItem, rightIndex) => (
                          <option 
                            key={rightIndex} 
                            value={rightIndex}
                            disabled={isRightItemUsed(rightIndex) && answers?.[leftIndex] !== rightIndex}
                          >
                            {String.fromCharCode(65 + rightIndex)}. {rightItem}
                            {isRightItemUsed(rightIndex) && answers?.[leftIndex] !== rightIndex ? ' (Already used)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Help text when dropdowns are hidden */}
                  {!showDropdowns && !isMatched && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-500 italic">
                        👆 Drag this question to its answer in Column B
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column B - Answers */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-lg font-bold text-gray-900">Column B - Answers</h4>
            <span className="text-sm text-gray-500">(Drop here)</span>
          </div>
          <div className="space-y-3">
            {question.rightItems.map((item, rightIndex) => {
              const isUsed = isRightItemUsed(rightIndex);
              const isHovered = hoveredTarget === rightIndex;
              
              return (
                <div
                  key={rightIndex}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, rightIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, rightIndex)}
                  onClick={() => handleAnswerClick(rightIndex)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isHovered
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                      : isUsed
                      ? 'border-green-400 bg-green-50 shadow-md'
                      : selectedQuestion !== null
                      ? 'border-purple-300 bg-purple-25 hover:border-purple-500 hover:bg-purple-100'
                      : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  title={selectedQuestion !== null ? 'Click to match with selected question' : 'Select a question first'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                        {String.fromCharCode(65 + rightIndex)}
                      </span>
                      <span className="text-gray-900 font-medium">{item}</span>
                    </div>
                    
                    {isUsed && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <button
                          onClick={() => {
                            // Find and remove the match
                            const leftIndex = Object.keys(answers || {}).find(
                              key => answers[key] === rightIndex
                            );
                            if (leftIndex !== undefined) {
                              handleMatchChange(parseInt(leftIndex), null);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove match"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isHovered && (
                    <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-lg bg-purple-100 bg-opacity-50 flex items-center justify-center">
                      <span className="text-purple-700 font-semibold">Drop here!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {getMatchedCount() > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Question-Answer Matches</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(answers || {}).map(([leftIndex, rightIndex]) => (
              <div key={leftIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-700">
                    {parseInt(leftIndex) + 1}. {question.leftItems[parseInt(leftIndex)]}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-purple-700">
                    {String.fromCharCode(65 + rightIndex)}. {question.rightItems[rightIndex]}
                  </span>
                </div>
                <button
                  onClick={() => handleMatchChange(parseInt(leftIndex), null)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Remove this match"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {getMatchedCount() === question.leftItems.length && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold text-lg">🎉 All items matched! Great job!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchFollowingQuestion;
