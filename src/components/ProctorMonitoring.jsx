import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertTriangle, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';

const ProctorMonitoring = ({ sessionId, isActive }) => {
  const { token } = useAuthStore();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const snapshotIntervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startMonitoring();
      setupEventListeners();
    }

    return () => {
      stopMonitoring();
      removeEventListeners();
    };
  }, [isActive]);

  const startMonitoring = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Take periodic snapshots
      snapshotIntervalRef.current = setInterval(() => {
        captureSnapshot();
      }, 60000); // Every minute

      logEvent('webcam_started', 'low', 'Webcam monitoring started');
    } catch (error) {
      logEvent('webcam_error', 'high', 'Failed to access webcam: ' + error.message);
    }
  };

  const stopMonitoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(blob => {
        // In production, upload to server
        logEvent('webcam_snapshot', 'low', 'Periodic snapshot captured');
      }, 'image/jpeg', 0.7);
    }
  };

  const setupEventListeners = () => {
    // Tab switch detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window blur detection
    window.addEventListener('blur', handleWindowBlur);
    
    // Copy/Paste detection
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    
    // Right click detection
    document.addEventListener('contextmenu', handleRightClick);
    
    // Fullscreen exit detection
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  };

  const removeEventListeners = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('paste', handlePaste);
    document.removeEventListener('contextmenu', handleRightClick);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      logEvent('tab_switch', 'high', 'User switched to another tab');
    }
  };

  const handleWindowBlur = () => {
    logEvent('window_blur', 'medium', 'Window lost focus');
  };

  const handleCopy = (e) => {
    logEvent('copy_attempt', 'medium', 'Copy action detected');
  };

  const handlePaste = (e) => {
    logEvent('paste_attempt', 'medium', 'Paste action detected');
  };

  const handleRightClick = (e) => {
    logEvent('right_click', 'low', 'Right click detected');
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      logEvent('fullscreen_exit', 'high', 'Exited fullscreen mode');
    }
  };

  const logEvent = async (eventType, severity, description) => {
    try {
      await axios.post(
        `${API_BASE_URL}/sessions/${sessionId}/proctor-log`,
        {
          eventType,
          severity,
          description,
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error logging proctor event:', error);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border-2 border-blue-500">
        <div className="flex items-center space-x-2 mb-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">Proctoring Active</span>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
        </div>
        <div className="relative bg-black rounded overflow-hidden" style={{ width: '160px', height: '120px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!faceDetected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Your session is being monitored
        </p>
      </div>
    </div>
  );
};

export default ProctorMonitoring;
