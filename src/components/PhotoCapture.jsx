import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, RefreshCw, AlertCircle } from 'lucide-react';

function PhotoCapture({ onCapture, onClose, isInitialCapture = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
      if (!isInitialCapture) {
        onClose();
      }
    }
  };

  // handleClose removed - photo capture is mandatory during exams

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">
                  {isInitialCapture ? 'Identity Verification' : 'Proctoring Photo'}
                </h2>
                <p className="text-sm text-blue-100">
                  {isInitialCapture
                    ? 'Please capture your photo to verify your identity'
                    : 'Periodic photo capture for exam monitoring'}
                </p>
              </div>
            </div>
            {/* Close button removed - photo capture is mandatory for exam integrity */}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Camera Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={startCamera}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Preview or Captured Image */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p>Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Instructions */}
              {!capturedImage && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Position your face in the center of the frame</li>
                    <li>• Ensure good lighting and clear visibility</li>
                    <li>• Look directly at the camera</li>
                    <li>• Remove sunglasses or face coverings</li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4">
                {!capturedImage ? (
                  <button
                    onClick={capturePhoto}
                    disabled={!isCameraReady}
                    className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Photo</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                    <button
                      onClick={confirmPhoto}
                      className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <Check className="w-5 h-5" />
                      <span>Confirm</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isInitialCapture && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              This photo will be used to verify your identity during the exam.
              Please ensure it clearly shows your face.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoCapture;
