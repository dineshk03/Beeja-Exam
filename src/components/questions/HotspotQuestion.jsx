import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Target } from 'lucide-react';

function HotspotQuestion({ question, onAnswer, showCorrect, userAnswer }) {
  const [selectedHotspots, setSelectedHotspots] = useState([]);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (userAnswer) {
      setSelectedHotspots(userAnswer);
    }
  }, [userAnswer]);

  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current) {
        setImageDimensions({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleImageClick = (e) => {
    if (showCorrect) return; // Don't allow clicks when showing correct answer

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is within any hotspot
    const clickedHotspotIndex = question.hotspots.findIndex(hotspot => {
      return (
        x >= hotspot.x &&
        x <= hotspot.x + hotspot.width &&
        y >= hotspot.y &&
        y <= hotspot.y + hotspot.height
      );
    });

    if (clickedHotspotIndex !== -1) {
      let newSelected;
      if (selectedHotspots.includes(clickedHotspotIndex)) {
        // Deselect if already selected
        newSelected = selectedHotspots.filter(i => i !== clickedHotspotIndex);
      } else {
        // Select if not already selected (respect max selections)
        if (question.maxHotspotSelections && selectedHotspots.length >= question.maxHotspotSelections) {
          // Replace the first selection
          newSelected = [...selectedHotspots.slice(1), clickedHotspotIndex];
        } else {
          newSelected = [...selectedHotspots, clickedHotspotIndex];
        }
      }
      setSelectedHotspots(newSelected);
      onAnswer(newSelected);
    }
  };

  const isHotspotCorrect = (index) => {
    if (!showCorrect) return null;
    return selectedHotspots.includes(index);
  };

  const isHotspotSelected = (index) => {
    return selectedHotspots.includes(index);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
        <p className="text-sm text-blue-900">
          <Target className="w-4 h-4 inline mr-1" />
          Click on the image to select the correct area(s).
          {question.maxHotspotSelections && (
            <span className="font-semibold ml-1">
              (Select up to {question.maxHotspotSelections} area{question.maxHotspotSelections > 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>

      <div className="relative inline-block border-4 border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <img
          ref={imageRef}
          src={question.imageUrl}
          alt="Hotspot Question"
          className="max-w-full h-auto cursor-crosshair"
          onClick={handleImageClick}
          onLoad={() => {
            if (imageRef.current) {
              setImageDimensions({
                width: imageRef.current.offsetWidth,
                height: imageRef.current.offsetHeight,
              });
            }
          }}
        />

        {/* Render hotspots */}
        {question.hotspots.map((hotspot, index) => {
          const isSelected = isHotspotSelected(index);
          const isCorrect = isHotspotCorrect(index);

          return (
            <div
              key={index}
              className={`absolute border-2 transition-all ${
                showCorrect
                  ? isCorrect
                    ? 'bg-green-400 bg-opacity-30 border-green-600'
                    : 'bg-red-400 bg-opacity-30 border-red-600'
                  : isSelected
                  ? 'bg-blue-400 bg-opacity-40 border-blue-600 border-4'
                  : 'bg-transparent border-transparent hover:bg-blue-200 hover:bg-opacity-20'
              }`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
                pointerEvents: 'none',
              }}
            >
              {isSelected && !showCorrect && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {selectedHotspots.indexOf(index) + 1}
                </div>
              )}
              {showCorrect && (
                <div className="absolute top-1 right-1">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 bg-white rounded-full" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 bg-white rounded-full" />
                  )}
                </div>
              )}
              {hotspot.label && showCorrect && (
                <div className="absolute bottom-1 left-1 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-semibold">
                  {hotspot.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Selections:</h4>
        {selectedHotspots.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No areas selected yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedHotspots.map((hotspotIndex, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  showCorrect
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Area {idx + 1}
                {question.hotspots[hotspotIndex]?.label && `: ${question.hotspots[hotspotIndex].label}`}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCorrect && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900 font-medium mb-2">Correct Answer:</p>
          <p className="text-sm text-blue-800">
            All {question.hotspots.length} hotspot area{question.hotspots.length > 1 ? 's' : ''} should be selected.
            {question.hotspots.some(h => h.label) && (
              <span className="block mt-2">
                {question.hotspots.map((h, i) => h.label && (
                  <span key={i} className="block">• {h.label}</span>
                ))}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default HotspotQuestion;
