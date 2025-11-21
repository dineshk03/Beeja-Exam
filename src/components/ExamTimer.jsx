import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

function ExamTimer({ duration, startTime, onTimeUp }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWarning, setIsWarning] = useState(false);

  // Calculate initial time remaining based on start time
  useEffect(() => {
    if (startTime) {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000); // seconds elapsed
      const totalTime = duration * 60; // total duration in seconds
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        onTimeUp();
      }
    } else {
      // Fallback if no start time provided
      setTimeRemaining(duration * 60);
    }
  }, [duration, startTime, onTimeUp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        
        // Show warning when 5 minutes remaining
        if (prev <= 300 && !isWarning) {
          setIsWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp, isWarning]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
      isWarning ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
    }`}>
      {isWarning ? (
        <AlertTriangle className="w-5 h-5 animate-pulse" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      <span className="font-mono font-bold text-lg">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export default ExamTimer;
