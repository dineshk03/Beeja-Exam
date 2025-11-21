import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Mic, Monitor, Wifi, CheckCircle, XCircle, AlertTriangle, Upload, RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

const PreExamChecks = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [checks, setChecks] = useState({
    webcam: { status: 'pending', message: '' },
    microphone: { status: 'pending', message: '' },
    internet: { status: 'pending', message: '' },
    browser: { status: 'pending', message: '' },
    identity: { status: 'pending', message: '' },
  });

  const [identityVerification, setIdentityVerification] = useState({
    documentImage: null,
    faceImage: null,
    documentType: 'id_card',
  });

  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examSettings, setExamSettings] = useState(null);
  const [isRetesting, setIsRetesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  useEffect(() => {
    fetchExamSettings();
    performSystemChecks();
    getDeviceInfo();
  }, []);

  useEffect(() => {
    // Only check required components based on exam settings
    const requiredChecks = ['browser', 'internet'];
    if (examSettings?.requireWebcam) requiredChecks.push('webcam');
    if (examSettings?.requireMicrophone) requiredChecks.push('microphone');
    if (examSettings?.requireIdentityVerification) requiredChecks.push('identity');

    const passed = requiredChecks.every(check => checks[check]?.status === 'passed');
    setAllChecksPassed(passed);
  }, [checks, examSettings]);

  const fetchExamSettings = async () => {
    try {
      const response = await api.get(`/exams/${examId}`);
      setExamSettings(response.data);
      console.log('📋 Exam proctoring settings:', {
        requireWebcam: response.data.requireWebcam,
        requireMicrophone: response.data.requireMicrophone,
        requireIdentityVerification: response.data.requireIdentityVerification,
        allowMobileDevices: response.data.allowMobileDevices
      });
    } catch (error) {
      console.error('Failed to fetch exam settings:', error);
    }
  };

  const getDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    setDeviceInfo(info);
  };

  const performSystemChecks = async () => {
    setIsRetesting(true);
    
    // Reset all checks to pending
    setChecks({
      webcam: { status: 'pending', message: 'Checking...' },
      microphone: { status: 'pending', message: 'Checking...' },
      internet: { status: 'pending', message: 'Checking...' },
      browser: { status: 'pending', message: 'Checking...' },
      identity: { status: 'pending', message: 'Waiting for verification...' },
    });

    // Check browser compatibility
    await new Promise(resolve => setTimeout(resolve, 500)); // Add delay for better UX
    checkBrowser();
    
    // Check internet connection
    await new Promise(resolve => setTimeout(resolve, 300));
    await checkInternet();
    
    // Check webcam (only if required)
    if (!examSettings || examSettings.requireWebcam) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await checkWebcam();
    } else {
      setChecks(prev => ({
        ...prev,
        webcam: { status: 'skipped', message: 'Not required for this exam' }
      }));
    }
    
    // Check microphone (only if required)
    if (!examSettings || examSettings.requireMicrophone) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await checkMicrophone();
    } else {
      setChecks(prev => ({
        ...prev,
        microphone: { status: 'skipped', message: 'Not required for this exam' }
      }));
    }

    setIsRetesting(false);
  };

  const checkBrowser = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let compatible = true;

    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
    } else {
      compatible = false;
    }

    setChecks(prev => ({
      ...prev,
      browser: {
        status: compatible ? 'passed' : 'failed',
        message: compatible ? `${browserName} - Compatible` : 'Unsupported browser',
      },
    }));
  };

  const checkInternet = async () => {
    try {
      const startTime = Date.now();
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
      const latency = Date.now() - startTime;

      setChecks(prev => ({
        ...prev,
        internet: {
          status: latency < 1000 ? 'passed' : 'warning',
          message: `Latency: ${latency}ms - ${latency < 1000 ? 'Good' : 'Slow connection'}`,
        },
      }));
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        internet: {
          status: 'failed',
          message: 'No internet connection',
        },
      }));
    }
  };

  const checkWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setChecks(prev => ({
        ...prev,
        webcam: {
          status: 'passed',
          message: 'Webcam detected and working',
        },
      }));
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        webcam: {
          status: 'failed',
          message: 'Webcam not accessible - ' + error.message,
        },
      }));
    }
  };

  const checkMicrophone = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.getTracks().forEach(track => track.stop());

      setChecks(prev => ({
        ...prev,
        microphone: {
          status: 'passed',
          message: 'Microphone detected and working',
        },
      }));
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        microphone: {
          status: 'failed',
          message: 'Microphone not accessible - ' + error.message,
        },
      }));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(blob => {
        setIdentityVerification(prev => ({
          ...prev,
          faceImage: blob,
        }));
        
        setChecks(prev => ({
          ...prev,
          identity: {
            status: 'passed',
            message: 'Face photo captured',
          },
        }));
      }, 'image/jpeg');
    }
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdentityVerification(prev => ({
        ...prev,
        documentImage: file,
      }));
    }
  };

  const submitVerification = async () => {
    setIsSubmitting(true);
    try {
      // Submit system check
      await axios.post(
        'http://localhost:5000/api/verification/system-check',
        {
          checkType: 'pre_exam',
          systemInfo: {
            browser: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            userAgent: navigator.userAgent,
          },
          checks: {
            webcam: {
              available: checks.webcam.status === 'passed',
              working: checks.webcam.status === 'passed',
              permission: 'granted',
            },
            microphone: {
              available: checks.microphone.status === 'passed',
              working: checks.microphone.status === 'passed',
              permission: 'granted',
            },
            internet: {
              stable: checks.internet.status === 'passed',
            },
            browser: {
              compatible: checks.browser.status === 'passed',
            },
          },
          overallStatus: allChecksPassed ? 'passed' : 'passed_with_warnings',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Submit identity verification only if required
      if (examSettings?.requireIdentityVerification) {
        console.log('🔄 Processing identity verification images...');
        
        try {
          // Convert images to base64 for submission
          const documentBase64 = await fileToBase64(identityVerification.documentImage);
          const faceBase64 = await blobToBase64(identityVerification.faceImage);

          console.log('✅ Images processed successfully, submitting to server...');

          await axios.post(
            'http://localhost:5000/api/verification/identity',
            {
              verificationType: identityVerification.documentType,
              documentImageUrl: documentBase64,
              faceImageUrl: faceBase64,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (imageError) {
          console.error('❌ Error processing images:', imageError);
          throw new Error(`Image processing failed: ${imageError.message}`);
        }
      }

      // Navigate to exam lobby
      navigate(`/exam/${examId}/lobby`);
    } catch (error) {
      console.error('Error submitting verification:', error);
      if (error.response?.status === 413) {
        alert('Image files are too large. Please try taking smaller photos or use a different device.');
      } else if (error.message?.includes('Image processing failed')) {
        alert(`Image processing error: ${error.message}\n\nPlease try:\n1. Taking a new photo\n2. Uploading a different ID document\n3. Refreshing the page`);
      } else if (error.message?.includes('Invalid file type')) {
        alert('Invalid file type. Please upload a valid image file (JPG, PNG, etc.)');
      } else {
        alert(`Failed to submit verification: ${error.message || 'Unknown error'}\n\nPlease try again or contact support.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      // Validate input
      if (!file || (!(file instanceof File) && !(file instanceof Blob))) {
        console.error('Invalid file type for compression:', file);
        reject(new Error('Invalid file type'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      try {
        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error('Failed to create object URL:', error);
        reject(error);
      }
    });
  };

  const fileToBase64 = async (file) => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Compress image first to reduce payload size
      const compressedFile = await compressImage(file);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    } catch (error) {
      console.error('Error in fileToBase64:', error);
      throw error;
    }
  };

  const blobToBase64 = async (blob) => {
    try {
      // Validate blob
      if (!blob) {
        throw new Error('No blob provided');
      }
      
      // Compress blob first
      const compressedBlob = await compressImage(blob);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    } catch (error) {
      console.error('Error in blobToBase64:', error);
      throw error;
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'skipped':
        return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-600">—</span>
        </div>;
      case 'pending':
        return <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />;
      default:
        return <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'skipped': return 'bg-gray-50 border-gray-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Exam System Checks</h1>
          <p className="text-gray-600 mb-8">
            Please complete all system checks and identity verification before starting your exam.
          </p>

          {/* System Checks */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">System Requirements</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={performSystemChecks}
                  disabled={isRetesting}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetesting ? 'animate-spin' : ''}`} />
                  <span>Retest</span>
                </button>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Advanced</span>
                </button>
              </div>
            </div>
            
            {/* Webcam Check */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${getStatusColor(checks.webcam.status)}`}>
              <div className="flex items-center space-x-3">
                <Camera className="w-6 h-6 text-gray-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">Webcam</p>
                    {!examSettings?.requireWebcam && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Optional</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{checks.webcam.message}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {checks.webcam.status === 'failed' && (
                  <button
                    onClick={checkWebcam}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                )}
                {getStatusIcon(checks.webcam.status)}
              </div>
            </div>

            {/* Microphone Check */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${getStatusColor(checks.microphone.status)}`}>
              <div className="flex items-center space-x-3">
                <Mic className="w-6 h-6 text-gray-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">Microphone</p>
                    {!examSettings?.requireMicrophone && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Optional</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{checks.microphone.message}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {checks.microphone.status === 'failed' && (
                  <button
                    onClick={checkMicrophone}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                )}
                {getStatusIcon(checks.microphone.status)}
              </div>
            </div>

            {/* Internet Check */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${getStatusColor(checks.internet.status)}`}>
              <div className="flex items-center space-x-3">
                <Wifi className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Internet Connection</p>
                  <p className="text-sm text-gray-600">{checks.internet.message}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {checks.internet.status === 'failed' && (
                  <button
                    onClick={checkInternet}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Retry
                  </button>
                )}
                {getStatusIcon(checks.internet.status)}
              </div>
            </div>

            {/* Browser Check */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${getStatusColor(checks.browser.status)}`}>
              <div className="flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Browser Compatibility</p>
                  <p className="text-sm text-gray-600">{checks.browser.message}</p>
                </div>
              </div>
              {getStatusIcon(checks.browser.status)}
            </div>

            {/* Advanced Device Info */}
            {showAdvanced && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Device Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Platform:</span> {deviceInfo.platform}</div>
                  <div><span className="font-medium">Language:</span> {deviceInfo.language}</div>
                  <div><span className="font-medium">Screen:</span> {deviceInfo.screenResolution}</div>
                  <div><span className="font-medium">Viewport:</span> {deviceInfo.viewportSize}</div>
                  <div><span className="font-medium">Color Depth:</span> {deviceInfo.colorDepth}bit</div>
                  <div><span className="font-medium">Pixel Ratio:</span> {deviceInfo.pixelRatio}</div>
                  <div><span className="font-medium">Timezone:</span> {deviceInfo.timezone}</div>
                  <div><span className="font-medium">Mobile:</span> {deviceInfo.isMobile ? 'Yes' : 'No'}</div>
                </div>
                {deviceInfo.isMobile && !examSettings?.allowMobileDevices && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Mobile devices may not be supported for this exam.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Identity Verification */}
          {examSettings?.requireIdentityVerification && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Identity Verification</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Webcam Preview */}
              <div>
                <p className="font-medium text-gray-900 mb-2">Capture Your Photo</p>
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={capturePhoto}
                  disabled={checks.webcam.status !== 'passed'}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5 inline mr-2" />
                  Capture Photo
                </button>
                {identityVerification.faceImage && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Photo captured successfully
                  </p>
                )}
              </div>

              {/* Document Upload */}
              <div>
                <p className="font-medium text-gray-900 mb-2">Upload ID Document</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    Upload a clear photo of your ID card, passport, or driver's license
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    Choose File
                  </label>
                  {identityVerification.documentImage && (
                    <p className="mt-3 text-sm text-green-600 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {identityVerification.documentImage.name}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={identityVerification.documentType}
                    onChange={(e) => setIdentityVerification(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="id_card">ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={submitVerification}
              disabled={!allChecksPassed || (examSettings?.requireIdentityVerification && (!identityVerification.faceImage || !identityVerification.documentImage)) || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Continue to Exam'}
            </button>
          </div>

          {!allChecksPassed && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Please resolve all system check issues before continuing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreExamChecks;
