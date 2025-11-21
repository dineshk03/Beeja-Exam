import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

function SectionTimer({ duration, startTime, onTimeUp, sectionName }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (!startTime || !duration) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = start + (duration * 60 * 1000);
      const remaining = Math.max(0, end - now);

      if (remaining === 0) {
        onTimeUp();
      }

      return remaining;
    };

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Set warning at 5 minutes
      setIsWarning(remaining > 0 && remaining <= 5 * 60 * 1000);
      // Set critical at 1 minute
      setIsCritical(remaining > 0 && remaining <= 1 * 60 * 1000);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  if (timeRemaining === null) {
    return <div className="text-gray-600">Loading timer...</div>;
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalMs = duration * 60 * 1000;
    return ((totalMs - timeRemaining) / totalMs) * 100;
  };

  return (
    <div className={`transition-all ${
      isCritical 
        ? 'bg-red-100 border-red-500' 
        : isWarning 
        ? 'bg-yellow-100 border-yellow-500' 
        : 'bg-blue-50 border-blue-300'
    } border-2 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${
            isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'
          }`} />
          <span className="text-sm font-semibold text-gray-700">
            {sectionName ? `${sectionName} -` : ''} Time Remaining
          </span>
        </div>
        {(isWarning || isCritical) && (
          <AlertTriangle className={`w-5 h-5 ${
            isCritical ? 'text-red-600 animate-pulse' : 'text-yellow-600'
          }`} />
        )}
      </div>

      <div className={`text-3xl font-bold ${
        isCritical 
          ? 'text-red-700' 
          : isWarning 
          ? 'text-yellow-700' 
          : 'text-blue-700'
      }`}>
        {formatTime(timeRemaining)}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            isCritical 
              ? 'bg-red-600' 
              : isWarning 
              ? 'bg-yellow-500' 
              : 'bg-blue-600'
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {isCritical && (
        <div className="mt-2 text-xs text-red-700 font-semibold animate-pulse">
          ⚠️ Less than 1 minute remaining!
        </div>
      )}
      {isWarning && !isCritical && (
        <div className="mt-2 text-xs text-yellow-700 font-semibold">
          ⏰ Less than 5 minutes remaining
        </div>
      )}
    </div>
  );
}

export default SectionTimer;
