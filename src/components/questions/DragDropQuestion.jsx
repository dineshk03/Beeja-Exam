import React, { useState, useEffect } from 'react';
import { GripVertical, CheckCircle2, XCircle } from 'lucide-react';

function DragDropQuestion({ question, onAnswer, showCorrect, userAnswer }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [droppedItems, setDroppedItems] = useState({});
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    // Initialize available items
    setAvailableItems(question.draggableItems.map((item, index) => ({ item, index })));
    
    // Restore user answer if exists
    if (userAnswer) {
      setDroppedItems(userAnswer);
      const usedIndices = Object.values(userAnswer).flat();
      setAvailableItems(
        question.draggableItems
          .map((item, index) => ({ item, index }))
          .filter(({ index }) => !usedIndices.includes(index))
      );
    }
  }, [question, userAnswer]);

  const handleDragStart = (e, itemData) => {
    setDraggedItem(itemData);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, zoneIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newDroppedItems = { ...droppedItems };
    if (!newDroppedItems[zoneIndex]) {
      newDroppedItems[zoneIndex] = [];
    }
    
    // Add item to zone
    newDroppedItems[zoneIndex].push(draggedItem.index);
    
    // Remove from available items
    setAvailableItems(prev => prev.filter(item => item.index !== draggedItem.index));
    setDroppedItems(newDroppedItems);
    setDraggedItem(null);

    // Send answer to parent
    onAnswer(newDroppedItems);
  };

  const handleRemoveFromZone = (zoneIndex, itemIndex) => {
    const newDroppedItems = { ...droppedItems };
    const removedItemIndex = newDroppedItems[zoneIndex][itemIndex];
    newDroppedItems[zoneIndex].splice(itemIndex, 1);
    
    if (newDroppedItems[zoneIndex].length === 0) {
      delete newDroppedItems[zoneIndex];
    }
    
    setDroppedItems(newDroppedItems);
    
    // Add back to available items
    setAvailableItems(prev => [...prev, { 
      item: question.draggableItems[removedItemIndex], 
      index: removedItemIndex 
    }].sort((a, b) => a.index - b.index));

    // Send answer to parent
    onAnswer(newDroppedItems);
  };

  const isCorrectZone = (zoneIndex) => {
    if (!showCorrect) return null;
    const zone = question.dropZones[zoneIndex];
    const droppedInZone = droppedItems[zoneIndex] || [];
    
    // Check if all correct items are in the zone and no incorrect items
    const allCorrectPresent = zone.correctItems.every(item => droppedInZone.includes(item));
    const noIncorrectPresent = droppedInZone.every(item => zone.correctItems.includes(item));
    
    return allCorrectPresent && noIncorrectPresent;
  };

  return (
    <div className="space-y-6">
      {/* Available Items */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
          <GripVertical className="w-4 h-4" />
          <span>Drag items from here:</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableItems.length === 0 ? (
            <p className="text-sm text-gray-400 italic">All items have been placed</p>
          ) : (
            availableItems.map(({ item, index }) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, { item, index })}
                className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{item}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Drop items into the correct zones:</h4>
        {question.dropZones.map((zone, zoneIndex) => {
          const isCorrect = isCorrectZone(zoneIndex);
          return (
            <div
              key={zoneIndex}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, zoneIndex)}
              className={`min-h-[100px] p-4 rounded-lg border-2 border-dashed transition-all ${
                showCorrect
                  ? isCorrect
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                  : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-900">{zone.label}</h5>
                {showCorrect && (
                  isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(droppedItems[zoneIndex] || []).map((itemIndex, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-2 rounded-lg shadow-sm ${
                      showCorrect
                        ? zone.correctItems.includes(itemIndex)
                          ? 'bg-green-100 border-2 border-green-400'
                          : 'bg-red-100 border-2 border-red-400'
                        : 'bg-blue-100 border-2 border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {question.draggableItems[itemIndex]}
                      </span>
                      {!showCorrect && (
                        <button
                          onClick={() => handleRemoveFromZone(zoneIndex, idx)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!droppedItems[zoneIndex] || droppedItems[zoneIndex].length === 0) && (
                  <p className="text-sm text-gray-400 italic">Drop items here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCorrect && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900 font-medium">Correct Answer:</p>
          {question.dropZones.map((zone, idx) => (
            <div key={idx} className="mt-2">
              <span className="text-sm font-semibold text-blue-900">{zone.label}:</span>
              <span className="text-sm text-blue-800 ml-2">
                {zone.correctItems.map(i => question.draggableItems[i]).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DragDropQuestion;
