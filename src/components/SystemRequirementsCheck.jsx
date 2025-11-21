import React, { useState, useEffect } from 'react';
import { Camera, Mic, Wifi, Monitor, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

function SystemRequirementsCheck({ enableWebcam = false, enableMicrophone = false }) {
  const [webcamStatus, setWebcamStatus] = useState({ status: 'checking', message: 'Checking...' });
  const [micStatus, setMicStatus] = useState({ status: 'checking', message: 'Checking...' });
  const [internetStatus, setInternetStatus] = useState({ status: 'checking', message: 'Checking...' });
  const [browserStatus, setBrowserStatus] = useState({ status: 'checking', message: 'Checking...' });

  // Debug: Log what we received
  console.log('SystemRequirementsCheck props:', { enableWebcam, enableMicrophone });

  useEffect(() => {
    checkSystemRequirements();
  }, [enableWebcam, enableMicrophone]);

  const checkSystemRequirements = async () => {
    console.log('🔍 Checking system requirements...');
    console.log('  enableWebcam:', enableWebcam, typeof enableWebcam);
    console.log('  enableMicrophone:', enableMicrophone, typeof enableMicrophone);
    
    // Check Browser Compatibility
    checkBrowserCompatibility();
    
    // Check Internet Connection
    checkInternetConnection();
    
    // Check Webcam (if required)
    // Treat undefined/null/false as "not required"
    if (enableWebcam === true) {
      console.log('✅ Webcam IS required, checking...');
      await checkWebcam();
    } else {
      console.log('❌ Webcam NOT required (value:', enableWebcam, ')');
      setWebcamStatus({ status: 'disabled', message: 'Not required for this exam' });
    }
    
    // Check Microphone (if required)
    // Treat undefined/null/false as "not required"
    if (enableMicrophone === true) {
      console.log('✅ Microphone IS required, checking...');
      await checkMicrophone();
    } else {
      console.log('❌ Microphone NOT required (value:', enableMicrophone, ')');
      setMicStatus({ status: 'disabled', message: 'Not required for this exam' });
    }
  };

  const checkWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Check if we actually got video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        setWebcamStatus({ 
          status: 'success', 
          message: 'Webcam detected and working',
          device: videoTracks[0].label || 'Default Camera'
        });
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      } else {
        setWebcamStatus({ status: 'error', message: 'No video tracks found' });
      }
    } catch (error) {
      let errorMessage = 'Webcam not accessible';
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'Webcam not found - Please connect a webcam';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Webcam access denied - Please allow camera access';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Webcam is being used by another application';
      } else {
        errorMessage = `${error.message || 'Requested device not found'}`;
      }
      
      setWebcamStatus({ status: 'error', message: errorMessage });
    }
  };

  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check if we actually got audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        setMicStatus({ 
          status: 'success', 
          message: 'Microphone detected and working',
          device: audioTracks[0].label || 'Default Microphone'
        });
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      } else {
        setMicStatus({ status: 'error', message: 'No audio tracks found' });
      }
    } catch (error) {
      let errorMessage = 'Microphone not accessible';
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'Microphone not found - Please connect a microphone';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied - Please allow microphone access';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application';
      } else {
        errorMessage = `${error.message || 'Requested device not found'}`;
      }
      
      setMicStatus({ status: 'error', message: errorMessage });
    }
  };

  const checkInternetConnection = () => {
    if (navigator.onLine) {
      // Check latency with a simple fetch
      const startTime = Date.now();
      fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
        .then(() => {
          const latency = Date.now() - startTime;
          let quality = 'Good';
          if (latency > 1000) quality = 'Poor';
          else if (latency > 500) quality = 'Fair';
          
          setInternetStatus({ 
            status: 'success', 
            message: `Latency: ${latency}ms - ${quality}` 
          });
        })
        .catch(() => {
          setInternetStatus({ 
            status: 'warning', 
            message: 'Connected but unstable' 
          });
        });
    } else {
      setInternetStatus({ status: 'error', message: 'No internet connection' });
    }
  };

  const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let compatible = true;

    if (userAgent.indexOf('Chrome') > -1) {
      browser = 'Chrome - Compatible';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browser = 'Firefox - Compatible';
    } else if (userAgent.indexOf('Safari') > -1) {
      browser = 'Safari - Compatible';
    } else if (userAgent.indexOf('Edge') > -1) {
      browser = 'Edge - Compatible';
    } else {
      browser = 'Unknown Browser';
      compatible = false;
    }

    // Check for required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      compatible = false;
      browser = 'Browser does not support media devices';
    }

    setBrowserStatus({ 
      status: compatible ? 'success' : 'warning', 
      message: browser 
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'disabled':
        return <CheckCircle2 className="w-6 h-6 text-gray-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'disabled':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const allRequirementsOk = () => {
    // Check if all REQUIRED systems are working
    const webcamOk = !enableWebcam || webcamStatus.status === 'success';
    const micOk = !enableMicrophone || micStatus.status === 'success';
    const internetOk = internetStatus.status === 'success' || internetStatus.status === 'warning';
    const browserOk = browserStatus.status === 'success';

    return webcamOk && micOk && internetOk && browserOk;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">System Requirements</h3>
      
      <div className="space-y-4">
        {/* Webcam */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Camera className="w-6 h-6 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Webcam</h4>
              <p className={`text-sm ${getStatusColor(webcamStatus.status)}`}>
                {webcamStatus.message}
              </p>
              {webcamStatus.device && (
                <p className="text-xs text-gray-500 mt-1">{webcamStatus.device}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(webcamStatus.status)}
          </div>
        </div>

        {/* Microphone */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Mic className="w-6 h-6 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Microphone</h4>
              <p className={`text-sm ${getStatusColor(micStatus.status)}`}>
                {micStatus.message}
              </p>
              {micStatus.device && (
                <p className="text-xs text-gray-500 mt-1">{micStatus.device}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(micStatus.status)}
          </div>
        </div>

        {/* Internet Connection */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Wifi className="w-6 h-6 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Internet Connection</h4>
              <p className={`text-sm ${getStatusColor(internetStatus.status)}`}>
                {internetStatus.message}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(internetStatus.status)}
          </div>
        </div>

        {/* Browser Compatibility */}
        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Monitor className="w-6 h-6 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Browser Compatibility</h4>
              <p className={`text-sm ${getStatusColor(browserStatus.status)}`}>
                {browserStatus.message}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(browserStatus.status)}
          </div>
        </div>
      </div>

      {/* Overall Status */}
      {!allRequirementsOk() && (enableWebcam === true || enableMicrophone === true) && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800 font-medium">
              Please fix the required system check issues above before starting the exam
            </p>
          </div>
        </div>
      )}

      {allRequirementsOk() && (
        <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm text-green-800 font-medium">
              All system requirements met. You're ready to start!
            </p>
          </div>
        </div>
      )}
      
      {/* Info message when nothing is required */}
      {(enableWebcam !== true && enableMicrophone !== true) && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800 font-medium">
              No webcam or microphone required for this exam. You can proceed!
            </p>
          </div>
        </div>
      )}

      {/* Retry Button */}
      <button
        onClick={checkSystemRequirements}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Recheck System Requirements
      </button>
    </div>
  );
}

export default SystemRequirementsCheck;
