import React, { useState, useEffect } from 'react';
import { Upload, Save, Eye, Download, Settings, Image, FileText, Users, QrCode, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

// Add slide animations with unique class names to avoid conflicts
const slideStyles = `
  @keyframes certificateSlideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes certificateFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .certificate-animate-slideInRight {
    animation: certificateSlideInRight 0.4s ease-out forwards;
  }
  
  .certificate-animate-fadeIn {
    animation: certificateFadeIn 0.3s ease-out forwards;
  }
  
  /* Certificate-specific cursor fixes */
  .certificate-animate-slideInRight,
  .certificate-animate-fadeIn {
    cursor: default !important;
  }
`;

// Inject styles only once
if (typeof document !== 'undefined' && !document.getElementById('certificate-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'certificate-animations';
  styleSheet.textContent = slideStyles;
  document.head.appendChild(styleSheet);
}

const CertificateManagement = () => {
  const [certificateSettings, setCertificateSettings] = useState(null); // Start with null to indicate loading
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dataLoading, setDataLoading] = useState(true); // Track data loading state

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'logos', label: 'Logos & Images', icon: Image },
    { id: 'signatures', label: 'Signatures', icon: Users },
    { id: 'qr', label: 'QR Code', icon: QrCode }
  ];

  useEffect(() => {
    fetchCertificateSettings();
  }, []);

  // Slide navigation functions
  const goToNextSlide = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  const goToPrevSlide = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    setActiveTab(tabs[prevIndex].id);
  };

  const goToSlide = (tabId) => {
    setActiveTab(tabId);
  };

  const fetchCertificateSettings = async () => {
    setDataLoading(true);
    try {
      const response = await api.get('/admin/certificate-settings');
      if (response.data) {
        // Remove MongoDB-specific fields before setting state
        const { _id, __v, createdAt, updatedAt, isDefault, ...cleanSettings } = response.data;
        setCertificateSettings(cleanSettings);
        console.log('Certificate settings loaded from database:', cleanSettings);
        setMessage({ 
          type: 'success', 
          text: 'Certificate settings loaded successfully from database!' 
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error fetching certificate settings:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load certificate settings from database. Please check your connection and try again.' 
      });
      // Don't set any default values - force database dependency
      setCertificateSettings(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post('/admin/certificate-settings', certificateSettings);
      setMessage({ type: 'success', text: 'Certificate settings saved successfully!' });
      console.log('Settings saved:', response.data);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving certificate settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error saving settings. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, type, subType = null) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, GIF, and SVG files are allowed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (subType) formData.append('subType', subType);

    try {
      const response = await api.post('/admin/upload-certificate-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (type === 'logo') {
        setCertificateSettings(prev => ({
          ...prev,
          logos: { ...prev.logos, [subType]: response.data.url }
        }));
      } else if (type === 'signature') {
        setCertificateSettings(prev => ({
          ...prev,
          signatures: {
            ...prev.signatures,
            [subType]: { ...prev.signatures[subType], image: response.data.url }
          }
        }));
      } else if (type === 'background') {
        setCertificateSettings(prev => ({
          ...prev,
          backgroundImage: response.data.url
        }));
      }

      setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : type === 'signature' ? 'Signature' : 'Background'} uploaded successfully!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error uploading file. Please try again.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all certificate settings to Beeja Academy defaults? This will clear existing text/signatures but keep uploaded images.')) return;
    setLoading(true);
    try {
      const response = await api.post('/admin/certificate-settings/reset-defaults');
      const { _id, __v, createdAt, updatedAt, isDefault, ...cleanSettings } = response.data.settings;
      setCertificateSettings(cleanSettings);
      setMessage({ type: 'success', text: 'Reset to Beeja Academy defaults successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error resetting settings.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const checkUploadedFiles = async () => {
    try {
      const response = await api.get('/admin/certificate-files/debug');
      console.log('Uploaded files:', response.data);
      setMessage({ 
        type: 'success', 
        text: `Found ${response.data.totalFiles} files in uploads directory. Check console for details.` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error checking files:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error checking uploaded files.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const clearBrokenImages = async () => {
    try {
      const clearedSettings = {
        ...certificateSettings,
        logos: {
          company: null,
          aicte: null,
          goi: null,
          institution: null
        },
        signatures: {
          signature1: {
            ...certificateSettings.signatures.signature1,
            image: null
          },
          signature2: {
            ...certificateSettings.signatures.signature2,
            image: null
          }
        },
        backgroundImage: null
      };
      
      setCertificateSettings(clearedSettings);
      
      const response = await api.post('/admin/certificate-settings', clearedSettings);
      setMessage({ 
        type: 'success', 
        text: 'All image references cleared from database. You can now upload new images.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error clearing images:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error clearing image references.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={certificateSettings.companyName}
            onChange={(e) => setCertificateSettings(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Tagline</label>
          <input
            type="text"
            value={certificateSettings.companyTagline}
            onChange={(e) => setCertificateSettings(prev => ({ ...prev, companyTagline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Title</label>
        <input
          type="text"
          value={certificateSettings.certificateTitle}
          onChange={(e) => setCertificateSettings(prev => ({ ...prev, certificateTitle: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Prefix</label>
          <input
            type="text"
            value={certificateSettings.coursePrefix}
            onChange={(e) => setCertificateSettings(prev => ({ ...prev, coursePrefix: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default Course Name</label>
          <input
            type="text"
            value={certificateSettings.courseName}
            onChange={(e) => setCertificateSettings(prev => ({ ...prev, courseName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Credit Text</label>
        <input
          type="text"
          value={certificateSettings.academicCredit}
          onChange={(e) => setCertificateSettings(prev => ({ ...prev, academicCredit: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderLogoSettings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries({
          company: 'Beeja Academy Logo (shown on certificate)',
          aicte: 'AICTE Logo',
          goi: 'Government of India Logo',
          institution: 'Institution Logo'
        }).map(([key, label]) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{label}</h3>
            {certificateSettings.logos[key] ? (
              <div className="space-y-3">
                <img
                  src={`http://localhost:5000${certificateSettings.logos[key]}`}
                  alt={label}
                  className="w-20 h-20 object-contain border border-gray-200 rounded"
                />
                <button
                  onClick={() => setCertificateSettings(prev => ({
                    ...prev,
                    logos: { ...prev.logos, [key]: null }
                  }))}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or SVG</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'logo', key)}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Background Image</h3>
        {certificateSettings.backgroundImage ? (
          <div className="space-y-3">
            <img
              src={`http://localhost:5000${certificateSettings.backgroundImage}`}
              alt="Background"
              className="w-full h-32 object-cover border border-gray-200 rounded"
            />
            <button
              onClick={() => setCertificateSettings(prev => ({ ...prev, backgroundImage: null }))}
              className="text-red-600 text-sm hover:text-red-800"
            >
              Remove Background
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Image className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload background</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG or SVG</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'background')}
            />
          </label>
        )}
      </div>
    </div>
  );

  const renderSignatureSettings = () => (
    <div className="space-y-6">
      {Object.entries(certificateSettings.signatures).map(([key, signature]) => (
        <div key={key} className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Signature {key === 'signature1' ? '1' : '2'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={signature.name}
                  onChange={(e) => setCertificateSettings(prev => ({
                    ...prev,
                    signatures: {
                      ...prev.signatures,
                      [key]: { ...prev.signatures[key], name: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={signature.title}
                  onChange={(e) => setCertificateSettings(prev => ({
                    ...prev,
                    signatures: {
                      ...prev.signatures,
                      [key]: { ...prev.signatures[key], title: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <input
                  type="text"
                  value={signature.organization}
                  onChange={(e) => setCertificateSettings(prev => ({
                    ...prev,
                    signatures: {
                      ...prev.signatures,
                      [key]: { ...prev.signatures[key], organization: e.target.value }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature Image</label>
              {signature.image ? (
                <div className="space-y-3">
                  <img
                    src={`http://localhost:5000${signature.image}`}
                    alt={`${signature.name} signature`}
                    className="w-full h-24 object-contain border border-gray-200 rounded bg-white"
                  />
                  <button
                    onClick={() => setCertificateSettings(prev => ({
                      ...prev,
                      signatures: {
                        ...prev.signatures,
                        [key]: { ...prev.signatures[key], image: null }
                      }
                    }))}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove Signature
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <Upload className="w-6 h-6 mb-2 text-gray-500" />
                    <p className="text-xs text-gray-500">Upload signature</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'signature', key)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderQRSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="qrEnabled"
          checked={certificateSettings.qrCodeSettings.enabled}
          onChange={(e) => setCertificateSettings(prev => ({
            ...prev,
            qrCodeSettings: { ...prev.qrCodeSettings, enabled: e.target.checked }
          }))}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="qrEnabled" className="text-sm font-medium text-gray-700">
          Enable QR Code on Certificates
        </label>
      </div>

      {certificateSettings.qrCodeSettings.enabled && (
        <div className="space-y-4 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification URL</label>
            <input
              type="url"
              value={certificateSettings.qrCodeSettings.verificationUrl}
              onChange={(e) => setCertificateSettings(prev => ({
                ...prev,
                qrCodeSettings: { ...prev.qrCodeSettings, verificationUrl: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://verify.yoursite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Size</label>
            <select
              value={certificateSettings.qrCodeSettings.size}
              onChange={(e) => setCertificateSettings(prev => ({
                ...prev,
                qrCodeSettings: { ...prev.qrCodeSettings, size: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small (15mm)</option>
              <option value="medium">Medium (20mm)</option>
              <option value="large">Large (25mm)</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeCredentials"
              checked={certificateSettings.qrCodeSettings.includeCredentials}
              onChange={(e) => setCertificateSettings(prev => ({
                ...prev,
                qrCodeSettings: { ...prev.qrCodeSettings, includeCredentials: e.target.checked }
              }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeCredentials" className="text-sm font-medium text-gray-700">
              Include Credentials ID below QR Code
            </label>
          </div>
        </div>
      )}
    </div>
  );

  const renderCertificatePreview = () => (
    <div className="bg-gray-800 p-6 rounded-lg max-w-5xl mx-auto">
      <div style={{
        position:'relative', background:'white', overflow:'hidden',
        border:'3px solid #006064', aspectRatio:'297/210', display:'flex', flexDirection:'column',
        boxShadow:'0 24px 80px rgba(0,0,0,0.3)',
        backgroundImage:'radial-gradient(ellipse at 50% 40%,rgba(0,188,212,0.05) 0%,transparent 65%)',
        fontFamily:"'Georgia','Times New Roman',serif",
      }}>
        {/* Inner border */}
        <div style={{position:'absolute',inset:10,border:'1px solid rgba(0,188,212,0.28)',pointerEvents:'none',zIndex:2}} />

        {/* Gold side pillar lines */}
        <div style={{position:'absolute',left:34,top:'13%',bottom:'18%',width:1,background:'linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent)',zIndex:2,pointerEvents:'none'}} />
        <div style={{position:'absolute',right:34,top:'13%',bottom:'18%',width:1,background:'linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent)',zIndex:2,pointerEvents:'none'}} />

        {/* Gold corners */}
        <div style={{position:'absolute',top:14,left:14,width:26,height:26,borderTop:'2.5px solid #c8a84b',borderLeft:'2.5px solid #c8a84b',zIndex:3}} />
        <div style={{position:'absolute',top:14,right:14,width:26,height:26,borderTop:'2.5px solid #c8a84b',borderRight:'2.5px solid #c8a84b',zIndex:3}} />
        <div style={{position:'absolute',bottom:14,left:14,width:26,height:26,borderBottom:'2.5px solid #c8a84b',borderLeft:'2.5px solid #c8a84b',zIndex:3}} />
        <div style={{position:'absolute',bottom:14,right:14,width:26,height:26,borderBottom:'2.5px solid #c8a84b',borderRight:'2.5px solid #c8a84b',zIndex:3}} />

        {/* Watermark */}
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,fontWeight:900,color:'rgba(0,188,212,0.05)',transform:'rotate(-20deg)',pointerEvents:'none',whiteSpace:'nowrap',zIndex:0}}>
          {certificateSettings.companyName || 'Beeja Academy'}
        </div>

        {/* Deep teal header band */}
        <div style={{
          background:'linear-gradient(135deg,#002e27 0%,#005050 25%,#007878 50%,#005050 75%,#002e27 100%)',
          padding:'1.6% 5.5%', display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'relative', zIndex:1, flexShrink:0, boxShadow:'0 3px 10px rgba(0,0,0,0.3)',
        }}>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.78)'}}>Certificate ID: BA-PREVIEW</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {certificateSettings.logos?.company && (
              <img src={`http://localhost:5000${certificateSettings.logos.company}`} alt="Logo"
                style={{height:28,objectFit:'contain',filter:'brightness(0) invert(1)'}}
                onError={e => { e.target.style.display='none'; }} />
            )}
            <span style={{fontSize:20,fontWeight:'bold',color:'white',letterSpacing:1}}>
              {certificateSettings.companyName || 'Beeja Academy'}
            </span>
          </div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.78)'}}>Issued on: Preview</div>
        </div>

        {/* Main content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 7%',position:'relative',zIndex:1,gap:'0.5%'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:42,fontWeight:900,color:'#1a1a2e',letterSpacing:8,lineHeight:1}}>
              {(certificateSettings.certificateTitle || 'CERTIFICATE').split(' ')[0]}
            </div>
            <div style={{fontSize:9,letterSpacing:5,color:'#006064',textTransform:'uppercase',marginTop:3}}>
              of Completion
            </div>
          </div>

          {/* Three-dot gold rule */}
          <div style={{display:'flex',alignItems:'center',gap:'0.5%',width:'58%'}}>
            <div style={{flex:1,height:1,background:'#c8a84b'}} />
            <div style={{width:5,height:5,background:'#c8a84b',borderRadius:'50%',flexShrink:0}} />
            <div style={{width:5,height:5,background:'#c8a84b',borderRadius:'50%',flexShrink:0}} />
            <div style={{width:5,height:5,background:'#c8a84b',borderRadius:'50%',flexShrink:0}} />
            <div style={{flex:1,height:1,background:'#c8a84b'}} />
          </div>

          <div style={{fontSize:8,letterSpacing:3,color:'#888',textAlign:'center',textTransform:'uppercase'}}>
            This Certificate is Proudly Presented To
          </div>

          <div style={{fontFamily:"'Brush Script MT','Segoe Script',cursive",fontSize:34,color:'#6d28d9',textAlign:'center',lineHeight:1.15}}>
            [Student Name]
          </div>
          <div style={{width:'18%',height:2,background:'linear-gradient(to right,transparent,#00bcd4,transparent)',margin:'0 auto'}} />

          {/* Achievement box */}
          <div style={{
            background:'linear-gradient(135deg,rgba(0,188,212,0.06),rgba(0,100,100,0.06))',
            border:'1px solid rgba(0,188,212,0.18)',borderRadius:4,
            padding:'1.2% 8%',width:'72%',margin:'0 auto',textAlign:'center',
          }}>
            <div style={{fontSize:10,color:'#555',lineHeight:1.7}}>In recognition of successfully completing</div>
            <div style={{fontSize:16,fontWeight:'bold',color:'#00897b',margin:'3px 0',letterSpacing:0.5}}>
              {certificateSettings.coursePrefix || 'Course Name'}
            </div>
            {certificateSettings.courseName && (
              <>
                <div style={{fontSize:10,color:'#555',lineHeight:1.7}}>and real-time project training on</div>
                <div style={{fontSize:14,fontWeight:'bold',color:'#00897b',margin:'2px 0'}}>
                  {certificateSettings.courseName}
                </div>
              </>
            )}
            <div style={{fontSize:9,color:'#aaa',marginTop:4,fontStyle:'italic'}}>with a score of 85% · Grade: A</div>
          </div>

          <div style={{fontSize:8,color:'#ccc',fontStyle:'italic',textAlign:'center',fontFamily:"'Georgia',serif"}}>
            "Keep learning, keep growing — excellence is a journey, not a destination."
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display:'flex',justifyContent:'space-between',alignItems:'flex-end',
          padding:'1% 5.5% 1.5%',
          borderTop:'1px solid rgba(0,188,212,0.2)',
          background:'linear-gradient(to bottom,rgba(0,188,212,0.03),rgba(0,80,80,0.05))',
          position:'relative',zIndex:1,flexShrink:0,
        }}>
          <div style={{textAlign:'center'}}>
            {certificateSettings.qrCodeSettings?.enabled !== false && (
              <>
                <div style={{width:48,height:48,background:'#f5f5f5',border:'1px solid #ddd',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto'}}>
                  <QrCode style={{width:28,height:28,color:'#aaa'}} />
                </div>
                <div style={{fontSize:8,color:'#999',marginTop:3}}>Scan to Verify</div>
              </>
            )}
          </div>

          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'#00897b',marginBottom:2}}>
              {certificateSettings.qrCodeSettings?.verificationUrl?.replace(/^https?:\/\//,'') || 'www.beejaacademy.com'}
            </div>
            <div style={{fontSize:10,color:'#aaa'}}>info@beejaacademy.com</div>
          </div>

          <div style={{textAlign:'center',minWidth:110}}>
            {certificateSettings.signatures?.signature1?.image ? (
              <img src={`http://localhost:5000${certificateSettings.signatures.signature1.image}`} alt="Signature"
                style={{height:32,objectFit:'contain',display:'block',margin:'0 auto'}}
                onError={e => { e.target.style.display='none'; }} />
            ) : (
              <div style={{fontFamily:"'Brush Script MT',cursive",fontSize:22,color:'#333',textAlign:'center',lineHeight:1.2}}>
                {certificateSettings.signatures?.signature1?.name?.split(' ')[0] || 'Sign'}
              </div>
            )}
            <div style={{width:110,height:1,background:'#555',margin:'3px auto'}} />
            <div style={{fontSize:10,fontWeight:'bold',color:'#333'}}>
              {(certificateSettings.signatures?.signature1?.name || 'DIRECTOR').toUpperCase()}
            </div>
            <div style={{fontSize:9,color:'#777'}}>
              {certificateSettings.signatures?.signature1?.title || 'Director'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading certificate settings from database...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no data loaded from database
  if (!certificateSettings) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Connection Required</h2>
              <p className="text-gray-600 mb-6">
                Certificate settings must be loaded from the database. No temporary data is available.
              </p>
              <button
                onClick={fetchCertificateSettings}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retry Database Connection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
                <p className="text-gray-600 mt-1">Customize certificate templates, logos, signatures, and settings</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Slide Navigation */}
                {!previewMode && (
                  <div className="flex items-center space-x-2 mr-4">
                    <button
                      onClick={goToPrevSlide}
                      className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      title="Previous Step"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-sm text-gray-500 px-2">
                      {tabs.find(tab => tab.id === activeTab)?.label}
                    </div>
                    <button
                      onClick={goToNextSlide}
                      className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      title="Next Step"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={fetchCertificateSettings}
                  disabled={dataLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  <span>Reload from DB</span>
                </button>
                <button
                  onClick={handleResetDefaults}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  title="Reset to Beeja Academy defaults"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>{previewMode ? 'Edit Settings' : 'Preview'}</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
            
            {/* Success/Error Messages */}
            {message.text && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center mr-3">
                      ✓
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center mr-3">
                      !
                    </div>
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          {!previewMode && (
            <div className="border-b border-gray-200">
              {/* Progress Bar */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center flex-1 max-w-md">
                    {tabs.map((tab, index) => (
                      <React.Fragment key={tab.id}>
                        <div className="flex flex-col items-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                            activeTab === tab.id 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                              : tabs.findIndex(t => t.id === activeTab) > index
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-gray-300 text-gray-400 bg-white'
                          }`}>
                            {tabs.findIndex(t => t.id === activeTab) > index ? (
                              <span className="text-sm font-bold">✓</span>
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500 text-center max-w-16">
                            {tab.label.split(' ')[0]}
                          </div>
                        </div>
                        {index < tabs.length - 1 && (
                          <div className="flex-1 mx-4">
                            <div className={`h-1 rounded-full transition-all duration-300 ${
                              tabs.findIndex(t => t.id === activeTab) > index 
                                ? 'bg-green-600' 
                                : 'bg-gray-300'
                            }`} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    Step {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
                  </div>
                </div>
              </div>

              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Tab Content */}
          <div className="px-6 py-6 relative overflow-hidden">
            {previewMode ? (
              <div className="space-y-6 certificate-animate-fadeIn">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificate Preview</h3>
                  <p className="text-gray-600 mb-4">This is how your certificate will look with current settings</p>
                  
                  {/* Debug Info */}
                  <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded">
                    <p><strong>Debug Info:</strong></p>
                    <p>Company Logo: {certificateSettings.logos?.company || 'Not set'}</p>
                    <p>Background: {certificateSettings.backgroundImage || 'Not set'}</p>
                    <p>Signature 1: {certificateSettings.signatures?.signature1?.image || 'Not set'}</p>
                    <p>Signature 2: {certificateSettings.signatures?.signature2?.image || 'Not set'}</p>
                    
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => checkUploadedFiles()}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Check Files
                      </button>
                      <button
                        onClick={() => clearBrokenImages()}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Clear Broken Images
                      </button>
                    </div>
                  </div>
                </div>
                {renderCertificatePreview()}
                <div className="text-center">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back to Settings
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Slide Container */}
                <div className="transition-all duration-500 ease-in-out">
                  {activeTab === 'general' && (
                    <div className="certificate-animate-slideInRight">
                      {renderGeneralSettings()}
                    </div>
                  )}
                  {activeTab === 'logos' && (
                    <div className="certificate-animate-slideInRight">
                      {renderLogoSettings()}
                    </div>
                  )}
                  {activeTab === 'signatures' && (
                    <div className="certificate-animate-slideInRight">
                      {renderSignatureSettings()}
                    </div>
                  )}
                  {activeTab === 'qr' && (
                    <div className="certificate-animate-slideInRight">
                      {renderQRSettings()}
                    </div>
                  )}
                </div>

                {/* Slide Navigation Footer */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={goToPrevSlide}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="flex space-x-2">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        onClick={() => goToSlide(tab.id)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          activeTab === tab.id 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        title={tab.label}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNextSlide}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
};

export default CertificateManagement;