import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Award, Clock, Calendar, 
  Download, Home, TrendingUp, Target, FileText, Medal, Printer
} from 'lucide-react';
import api from '../api/axios';

function ExamResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificateSettings, setCertificateSettings] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  // Check if certificate mode is requested
  const certificateMode = searchParams.get('certificate') === 'true';

  useEffect(() => {
    fetchResult();
    if (certificateMode) {
      fetchCertificateSettings();
    }
  }, [sessionId, certificateMode]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/results/${sessionId}`);
      setResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching result:', error);
      setLoading(false);
    }
  };

  const fetchCertificateSettings = async () => {
    try {
      const response = await api.get('/certificate-settings');
      setCertificateSettings(response.data);
      
      // Generate QR code for this certificate
      try {
        const qrResponse = await api.post('/generate-qr-code', {
          sessionId: sessionId,
          studentId: result?.student?._id || 'unknown',
          examId: result?.exam?._id || 'unknown'
        });
        setQrCode(qrResponse.data.qrCode);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }
    } catch (error) {
      console.error('Error fetching certificate settings:', error);
      // Don't use any default settings - database is required
      setCertificateSettings(null);
    }
  };

  const downloadMarksheet = () => {
    window.print();
  };

  const downloadCertificatePDF = () => {
    const token = localStorage.getItem('auth-token');
    const link = document.createElement('a');
    link.href = `/api/certificates/${sessionId}/download`;
    link.setAttribute('download', `certificate-${sessionId}.pdf`);
    // Use fetch with auth header for authenticated download
    fetch(`/api/certificates/${sessionId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Failed to download certificate'));
  };

  // Auto-trigger certificate mode actions
  useEffect(() => {
    if (certificateMode && result) {
      const scorePercentage = result.percentage || ((result.score || 0) / (result.totalMarks || result.totalQuestions || 1)) * 100;
      const isPassed = result.passed !== undefined ? result.passed : (scorePercentage >= (result.exam?.passingScore || 70));
      
      if (isPassed) {
        // Auto-focus on certificate content
        document.title = `Certificate - ${result.exam?.title || 'Exam'} - ${result.studentName || 'Student'}`;
        // Optional: Auto-print after a delay
        // setTimeout(() => window.print(), 1000);
      }
    }
  }, [certificateMode, result]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Result Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fix data mapping - handle different API response structures
  const scorePercentage = result.percentage || ((result.score || 0) / (result.totalMarks || result.totalQuestions || 1)) * 100;
  const isPassed = result.passed !== undefined ? result.passed : (scorePercentage >= (result.exam?.passingScore || 70));

  return (
    <div className={`min-h-screen py-8 ${certificateMode ? 'bg-white print-container' : ''}`}
      style={!certificateMode ? { background: '#eff6ff' } : {}}>
      {certificateMode && (
        <style>
          {`
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                font-family: 'Arial', sans-serif;
              }
              .no-print-legacy { display: none !important; }
              
              .certificate-container {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                position: relative !important;
                overflow: hidden !important;
              }
              
              .certificate-border {
                border: 8px solid #000 !important;
                border-radius: 0 !important;
                margin: 10mm !important;
                padding: 0 !important;
                height: calc(210mm - 20mm) !important;
                width: calc(297mm - 20mm) !important;
                position: relative !important;
                background: white !important;
              }
              
              .certificate-inner-border {
                border: 3px solid #000 !important;
                margin: 8mm !important;
                padding: 0 !important;
                height: calc(100% - 16mm) !important;
                position: relative !important;
                background: white !important;
                background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmY5YTU2O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjI1JSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmNmIzNTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSI3NSUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0ZWNkYzQ7c3RvcC1vcGFjaXR5OjEiIC8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzQ1YjdhYTtzdG9wLW9wYWNpdHk6MSIgLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cGF0aCBkPSJNNDAwIDAgQzUwMCAyMDAgNjAwIDMwMCA3MDAgNDAwIEM4MDAgNTAwIDkwMCA2MDAgMTIwMCA4MDAgTDEyMDAgMCBaIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8L3N2Zz4K') !important;
                background-size: cover !important;
                background-position: right !important;
                background-repeat: no-repeat !important;
                overflow: hidden !important;
              }
              
              .certificate-inner-border::before {
                content: '' !important;
                position: absolute !important;
                top: -50% !important;
                left: -50% !important;
                width: 200% !important;
                height: 200% !important;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%) !important;
                animation: shimmer 4s ease-in-out infinite !important;
              }
              
              @keyframes shimmer {
                0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.3; }
                50% { transform: rotate(180deg) scale(1.1); opacity: 0.1; }
              }
              
              .certificate-content-bg {
                background: white !important;
                border-radius: 20px !important;
                padding: 20mm !important;
                height: 100% !important;
                position: relative !important;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.1) !important;
              }
              
              .certificate-header-logos {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                margin-bottom: 8mm !important;
                padding: 0 5mm !important;
              }
              
              .certificate-main-title {
                font-size: 38px !important;
                font-weight: bold !important;
                color: #2d5a27 !important;
                text-align: center !important;
                letter-spacing: 4px !important;
                margin: 8mm 0 6mm 0 !important;
                text-transform: uppercase !important;
                line-height: 1.2 !important;
              }
              
              .certificate-subtitle {
                font-size: 16px !important;
                color: #333 !important;
                text-align: center !important;
                margin-bottom: 3mm !important;
                font-style: italic !important;
              }
              
              .certificate-student-name {
                font-size: 32px !important;
                font-weight: bold !important;
                color: #2d5a27 !important;
                text-align: center !important;
                margin: 5mm 0 3mm 0 !important;
                text-transform: uppercase !important;
                letter-spacing: 2px !important;
                line-height: 1.1 !important;
              }
              
              .certificate-description {
                font-size: 14px !important;
                color: #333 !important;
                text-align: center !important;
                line-height: 1.5 !important;
                margin: 8mm 0 !important;
                padding: 0 15mm !important;
                max-width: 200mm !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }
              
              .certificate-footer {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-end !important;
                margin-top: 15mm !important;
                padding: 0 5mm !important;
                position: absolute !important;
                bottom: 5mm !important;
                left: 15mm !important;
                right: 15mm !important;
              }
              
              .certificate-content-bg {
                background: transparent !important;
                padding: 20mm !important;
                height: 100% !important;
                position: relative !important;
                z-index: 2 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              
              .certificate-signature {
                text-align: center !important;
                font-size: 14px !important;
                color: #333 !important;
              }
              
              .certificate-qr {
                text-align: center !important;
                font-size: 12px !important;
                color: #666 !important;
              }
              
              .certificate-logo {
                width: 60px !important;
                height: 60px !important;
                background: #ddd !important;
                border-radius: 50% !important;
                display: inline-block !important;
              }
              
              .gradient-text {
                background: linear-gradient(45deg, #ff6b35, #4ecdc4) !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                background-clip: text !important;
              }
            }
            
            @media screen {
              .certificate-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              }
            }
          `}
        </style>
      )}
      {certificateMode ? (
        <>
          <style>{`
            @keyframes certIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
            @media screen{
              .cert-wrap{max-width:920px;margin:0 auto;background:white;box-shadow:0 32px 100px rgba(0,0,0,0.26),0 8px 32px rgba(0,100,100,0.2);position:relative;overflow:hidden;border:3px solid #006064;aspect-ratio:297/210;display:flex;flex-direction:column;animation:certIn 0.7s cubic-bezier(0.22,1,0.36,1) both;background-image:radial-gradient(ellipse at 50% 40%,rgba(0,188,212,0.05) 0%,transparent 65%);font-family:'Georgia','Times New Roman',serif}
              .cert-inner-border{position:absolute;inset:10px;border:1px solid rgba(0,188,212,0.28);pointer-events:none;z-index:2}
              .cert-side-line-l{position:absolute;left:34px;top:13%;bottom:18%;width:1px;background:linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent);z-index:2;pointer-events:none}
              .cert-side-line-r{position:absolute;right:34px;top:13%;bottom:18%;width:1px;background:linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent);z-index:2;pointer-events:none}
              .cert-corner{position:absolute;width:26px;height:26px;z-index:3}
              .cert-corner-tl{top:14px;left:14px;border-top:2.5px solid #c8a84b;border-left:2.5px solid #c8a84b}
              .cert-corner-tr{top:14px;right:14px;border-top:2.5px solid #c8a84b;border-right:2.5px solid #c8a84b}
              .cert-corner-bl{bottom:14px;left:14px;border-bottom:2.5px solid #c8a84b;border-left:2.5px solid #c8a84b}
              .cert-corner-br{bottom:14px;right:14px;border-bottom:2.5px solid #c8a84b;border-right:2.5px solid #c8a84b}
              .cert-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:6vw;font-weight:900;color:rgba(0,188,212,0.05);transform:rotate(-20deg);pointer-events:none;white-space:nowrap;z-index:0}
              .cert-header-band{background:linear-gradient(135deg,#002e27 0%,#005050 25%,#007878 50%,#005050 75%,#002e27 100%);padding:1.6% 5.5%;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.3)}
              .cert-hid{font-size:0.82vw;color:rgba(255,255,255,0.78);font-family:Arial,sans-serif}
              .cert-brand{display:flex;align-items:center;gap:0.6vw}
              .cert-brand-logo{height:2.8vw;object-fit:contain;filter:brightness(0) invert(1)}
              .cert-brand-name{font-size:1.8vw;font-weight:bold;color:white;letter-spacing:0.04vw}
              .cert-hissued{font-size:0.82vw;color:rgba(255,255,255,0.78);font-family:Arial,sans-serif}
              .cert-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 7%;position:relative;z-index:1;gap:0.5%}
              .cert-title-wrap{text-align:center}
              .cert-big-title{font-size:4.6vw;font-weight:900;color:#1a1a2e;letter-spacing:0.75vw;line-height:1}
              .cert-of-completion{font-size:0.8vw;letter-spacing:0.5vw;color:#006064;text-transform:uppercase;margin-top:0.2%}
              .cert-rule{display:flex;align-items:center;gap:0.5%;width:58%}
              .cert-rule-line{flex:1;height:1px;background:#c8a84b}
              .cert-rule-dot{width:5px;height:5px;background:#c8a84b;border-radius:50%;flex-shrink:0}
              .cert-presented{font-size:0.68vw;letter-spacing:0.28vw;color:#888;text-align:center;font-family:Arial,sans-serif;text-transform:uppercase}
              .cert-student{font-family:'Brush Script MT','Segoe Script',cursive;font-size:3.8vw;color:#6d28d9;text-align:center;line-height:1.15}
              .cert-teal-line{width:18%;height:2px;background:linear-gradient(to right,transparent,#00bcd4,transparent);margin:0 auto}
              .cert-ach-box{background:linear-gradient(135deg,rgba(0,188,212,0.06),rgba(0,100,100,0.06));border:1px solid rgba(0,188,212,0.18);border-radius:4px;padding:1.2% 8%;width:72%;margin:0 auto;text-align:center}
              .cert-ach-text{font-size:0.85vw;color:#555;font-family:Arial,sans-serif;line-height:1.7}
              .cert-course-name{font-size:1.6vw;font-weight:bold;color:#00897b;letter-spacing:0.03vw;margin:0.2% 0}
              .cert-ach-score{font-size:0.78vw;color:#888;font-family:Arial,sans-serif;margin-top:0.3%;font-style:italic}
              .cert-quote{font-size:0.7vw;color:#aaa;font-style:italic;text-align:center;font-family:'Georgia',serif}
              .cert-footer{display:flex;justify-content:space-between;align-items:flex-end;padding:1% 5.5% 1.5%;border-top:1px solid rgba(0,188,212,0.2);background:linear-gradient(to bottom,rgba(0,188,212,0.03),rgba(0,80,80,0.05));position:relative;z-index:1;flex-shrink:0}
              .cert-sig-block{text-align:center;min-width:9vw}
              .cert-sig-img-el{height:3.6vw;display:block;margin:0 auto;object-fit:contain}
              .cert-sig-line{width:9vw;height:1px;background:#555;margin:3px auto}
              .cert-sig-name{font-size:0.82vw;font-weight:bold;color:#333;font-family:Arial,sans-serif}
              .cert-sig-role{font-size:0.72vw;color:#777;font-family:Arial,sans-serif}
              .cert-center-block{text-align:center}
              .cert-website{font-size:0.95vw;color:#00897b;font-family:Arial,sans-serif;margin-bottom:2px}
              .cert-email{font-size:0.82vw;color:#999;font-family:Arial,sans-serif}
              .cert-qr-block{text-align:center}
              .cert-qr-img-el{width:5vw;height:5vw}
              .cert-scan-txt{font-size:0.65vw;color:#999;margin-top:2px;font-family:Arial,sans-serif}
            }
            @media print{
              *{-webkit-print-color-adjust:exact !important;color-adjust:exact !important;print-color-adjust:exact !important}
              body{margin:0;padding:0;background:white !important}
              .no-print{display:none !important}
              .cert-wrap{width:297mm !important;height:210mm !important;margin:0 !important;background:white !important;position:relative !important;overflow:hidden !important;box-shadow:none !important;border:3px solid #006064 !important;box-sizing:border-box !important;display:flex !important;flex-direction:column !important}
              .cert-inner-border{position:absolute !important;inset:10px !important;border:1px solid rgba(0,188,212,0.28) !important;pointer-events:none !important;z-index:2 !important}
              .cert-side-line-l{position:absolute !important;left:12mm !important;top:14% !important;bottom:19% !important;width:1px !important;background:#c8a84b !important;z-index:2 !important}
              .cert-side-line-r{position:absolute !important;right:12mm !important;top:14% !important;bottom:19% !important;width:1px !important;background:#c8a84b !important;z-index:2 !important}
              .cert-corner{position:absolute !important;width:6mm !important;height:6mm !important;z-index:3 !important}
              .cert-corner-tl{top:4mm !important;left:4mm !important;border-top:2px solid #c8a84b !important;border-left:2px solid #c8a84b !important}
              .cert-corner-tr{top:4mm !important;right:4mm !important;border-top:2px solid #c8a84b !important;border-right:2px solid #c8a84b !important}
              .cert-corner-bl{bottom:4mm !important;left:4mm !important;border-bottom:2px solid #c8a84b !important;border-left:2px solid #c8a84b !important}
              .cert-corner-br{bottom:4mm !important;right:4mm !important;border-bottom:2px solid #c8a84b !important;border-right:2px solid #c8a84b !important}
              .cert-watermark{position:absolute !important;inset:0 !important;display:flex !important;align-items:center !important;justify-content:center !important;font-size:60px !important;font-weight:900 !important;color:rgba(0,188,212,0.05) !important;transform:rotate(-20deg) !important;pointer-events:none !important;white-space:nowrap !important;z-index:0 !important}
              .cert-header-band{background:#005050 !important;padding:3.5mm 12mm !important;display:flex !important;justify-content:space-between !important;align-items:center !important;position:relative !important;z-index:1 !important;flex-shrink:0 !important}
              .cert-hid{font-size:6.5pt !important;color:rgba(255,255,255,0.82) !important}
              .cert-brand{display:flex !important;align-items:center !important;gap:4px !important}
              .cert-brand-logo{height:9mm !important;object-fit:contain !important;filter:brightness(0) invert(1) !important}
              .cert-brand-name{font-size:13pt !important;font-weight:bold !important;color:white !important}
              .cert-hissued{font-size:6.5pt !important;color:rgba(255,255,255,0.82) !important}
              .cert-main{flex:1 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;padding:0 15mm !important;position:relative !important;z-index:1 !important;gap:1mm !important}
              .cert-title-wrap{text-align:center !important;margin-bottom:1mm !important}
              .cert-big-title{font-size:26pt !important;font-weight:900 !important;color:#1a1a2e !important;letter-spacing:5px !important;line-height:1 !important}
              .cert-of-completion{font-size:6.5pt !important;letter-spacing:3px !important;color:#006064 !important}
              .cert-rule{display:flex !important;align-items:center !important;gap:2mm !important;width:58% !important;margin:1mm 0 !important}
              .cert-rule-line{flex:1 !important;height:1px !important;background:#c8a84b !important}
              .cert-rule-dot{width:4px !important;height:4px !important;background:#c8a84b !important;border-radius:50% !important;flex-shrink:0 !important}
              .cert-presented{font-size:5.5pt !important;letter-spacing:2px !important;color:#888 !important;text-align:center !important;margin-bottom:1mm !important}
              .cert-student{font-size:22pt !important;color:#6d28d9 !important;text-align:center !important;font-family:'Brush Script MT',cursive !important;margin-bottom:0.5mm !important}
              .cert-teal-line{width:45mm !important;height:1.5px !important;background:#00bcd4 !important;margin:0 auto 1.5mm !important}
              .cert-ach-box{border:1px solid rgba(0,188,212,0.18) !important;border-radius:3px !important;padding:2mm 15mm !important;width:70% !important;margin:0 auto 1mm !important;text-align:center !important}
              .cert-ach-text{font-size:7.5pt !important;color:#555 !important;line-height:1.6 !important}
              .cert-course-name{font-size:11pt !important;font-weight:bold !important;color:#00897b !important;margin:0.5mm 0 !important}
              .cert-ach-score{font-size:6.5pt !important;color:#888 !important;margin-top:0.5mm !important}
              .cert-quote{font-size:6pt !important;color:#aaa !important;font-style:italic !important;text-align:center !important;margin-top:1mm !important}
              .cert-footer{display:flex !important;justify-content:space-between !important;align-items:flex-end !important;padding:1.5mm 12mm 3mm !important;border-top:1px solid rgba(0,188,212,0.2) !important;flex-shrink:0 !important}
              .cert-sig-block{text-align:center !important;min-width:32mm !important}
              .cert-sig-img-el{height:9mm !important;display:block !important;margin:0 auto !important}
              .cert-sig-line{width:32mm !important;height:1px !important;background:#555 !important;margin:1px auto !important}
              .cert-sig-name{font-size:6.5pt !important;font-weight:bold !important;color:#333 !important}
              .cert-sig-role{font-size:6pt !important;color:#777 !important}
              .cert-center-block{text-align:center !important}
              .cert-website{font-size:7.5pt !important;color:#00897b !important}
              .cert-email{font-size:6.5pt !important;color:#999 !important}
              .cert-qr-block{text-align:center !important}
              .cert-qr-img-el{width:13mm !important;height:13mm !important}
              .cert-scan-txt{font-size:5.5pt !important;color:#999 !important}
            }
          `}</style>

          <div className="cert-wrap">
            <div className="cert-inner-border" />
            <div className="cert-side-line-l" />
            <div className="cert-side-line-r" />
            <div className="cert-corner cert-corner-tl" />
            <div className="cert-corner cert-corner-tr" />
            <div className="cert-corner cert-corner-bl" />
            <div className="cert-corner cert-corner-br" />
            <div className="cert-watermark" aria-hidden="true">
              {certificateSettings?.companyName || 'Beeja Academy'}
            </div>

            {/* Header band */}
            <div className="cert-header-band">
              <div className="cert-hid">
                Certificate ID: BA-{sessionId ? sessionId.slice(-8).toUpperCase() : 'XXXXXXXX'}
              </div>
              <div className="cert-brand">
                {certificateSettings?.logos?.company && (
                  <img src={certificateSettings.logos.company} alt="Logo" className="cert-brand-logo"
                    onError={e => { e.target.style.display='none'; }} />
                )}
                <span className="cert-brand-name">
                  {certificateSettings?.companyName || 'Beeja Academy'}
                </span>
              </div>
              <div className="cert-hissued">
                {(() => {
                  const d = new Date(result?.submittedAt || result?.createdAt || Date.now());
                  return `Issued on: ${d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}, ${d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}`;
                })()}
              </div>
            </div>

            {/* Main */}
            <div className="cert-main">
              <div className="cert-title-wrap">
                <div className="cert-big-title">CERTIFICATE</div>
                <div className="cert-of-completion">of Completion</div>
              </div>

              <div className="cert-rule">
                <div className="cert-rule-line" />
                <div className="cert-rule-dot" />
                <div className="cert-rule-dot" />
                <div className="cert-rule-dot" />
                <div className="cert-rule-line" />
              </div>

              <div className="cert-presented">This Certificate is Proudly Presented To</div>

              <div className="cert-student">
                {result.studentName || result.student?.name || 'Student Name'}
              </div>
              <div className="cert-teal-line" />

              {/* Achievement box */}
              <div className="cert-ach-box">
                <div className="cert-ach-text">In recognition of successfully completing</div>
                <div className="cert-course-name">
                  {certificateSettings?.coursePrefix || result.exam?.title || 'Course Name'}
                </div>
                {certificateSettings?.courseName && (
                  <>
                    <div className="cert-ach-text">and real-time project training on</div>
                    <div className="cert-course-name" style={{fontSize:'0.84em'}}>
                      {certificateSettings.courseName}
                    </div>
                  </>
                )}
                {scorePercentage > 0 && (
                  <div className="cert-ach-score">
                    with a score of {Math.round(scorePercentage)}%{result.grade ? ` \xB7 Grade: ${result.grade}` : ''}
                  </div>
                )}
              </div>

              <div className="cert-quote">
                "Keep learning, keep growing — excellence is a journey, not a destination."
              </div>
            </div>

            {/* Footer */}
            <div className="cert-footer">
              <div className="cert-qr-block">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code" className="cert-qr-img-el" />
                ) : (
                  <div style={{width:'5vw',height:'5vw',background:'#f5f5f5',border:'1px solid #ddd'}} />
                )}
                <div className="cert-scan-txt">Scan to Verify</div>
              </div>

              <div className="cert-center-block">
                <div className="cert-website">
                  {certificateSettings?.qrCodeSettings?.verificationUrl?.replace(/^https?:\/\//,'') || 'www.beejaacademy.com'}
                </div>
                <div className="cert-email">info@beejaacademy.com</div>
              </div>

              <div className="cert-sig-block">
                {certificateSettings?.signatures?.signature1?.image ? (
                  <img src={certificateSettings.signatures.signature1.image} alt="Signature"
                    className="cert-sig-img-el" onError={e => { e.target.style.display='none'; }} />
                ) : (
                  <div style={{fontFamily:"'Brush Script MT','Segoe Script',cursive",fontSize:'2vw',color:'#333',textAlign:'center',lineHeight:1.2}}>
                    {certificateSettings?.signatures?.signature1?.name?.split(' ')[0] || 'Sign'}
                  </div>
                )}
                <div className="cert-sig-line" />
                <div className="cert-sig-name">
                  {(certificateSettings?.signatures?.signature1?.name || 'DIRECTOR').toUpperCase()}
                </div>
                <div className="cert-sig-role">
                  {certificateSettings?.signatures?.signature1?.title || 'Director'}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Regular Result Layout
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Exam Result</h1>
                  <p className="text-blue-100 mt-2">{result.exam?.title || result.examTitle || 'Exam'}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{scorePercentage.toFixed(1)}%</div>
                  <div className={`text-sm font-medium ${isPassed ? 'text-green-200' : 'text-red-200'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </div>
                </div>
              </div>
            </div>

          {/* Content */}
          <div className="p-6">
            {/* Pass/Fail Status */}
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              isPassed 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {isPassed ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-3" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {isPassed ? 'Congratulations! You have passed the exam.' : 'Unfortunately, you did not pass this exam.'}
                  </h3>
                  <p className="text-sm opacity-75">
                    {isPassed 
                      ? 'You have successfully met the passing criteria.' 
                      : 'Please review the material and try again.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Student & Exam Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Student Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{result.studentName || result.student?.name || 'Student'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{result.studentEmail || result.student?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Exam Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{result.exam?.duration || result.duration || 'N/A'} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(result.submittedAt || result.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Score Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.score || result.correctAnswers || 0}</div>
                  <div className="text-sm text-gray-600">Score Obtained</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.totalMarks || result.totalQuestions || 0}</div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{scorePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {isPassed ? 'PASS' : 'FAIL'}
                  </div>
                  <div className="text-sm text-gray-600">Result</div>
                </div>
              </div>
            </div>

            {/* Question Analysis */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Question Analysis
              </h3>
              
              {(() => {
                // Debug: Check what's in the exam data
                console.log('🔍 DEBUG - Full result object:', result);
                console.log('🔍 DEBUG - Exam object:', result.exam);
                console.log('🔍 DEBUG - showQuestionAnalysis value:', result.exam?.showQuestionAnalysis);
                console.log('🔍 DEBUG - Has questions:', !!result.exam?.questions);
                console.log('🔍 DEBUG - Has answers:', !!result.answers);
                
                const shouldShow = result.exam && result.exam.questions && result.answers && result.exam.showQuestionAnalysis === true;
                console.log('🔍 DEBUG - Should show analysis:', shouldShow);
                
                return shouldShow;
              })() ? (
                <div className="space-y-4">
                  {result.exam.questions.map((question, index) => {
                    const studentAnswer = result.answers[question._id];
                    const correctAnswer = question.correctAnswer;
                    const isCorrect = studentAnswer === correctAnswer;
                    
                    return (
                      <div key={index} className={`border-2 rounded-lg p-4 ${
                        isCorrect 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Question {index + 1}
                              </h4>
                              <span className={`text-sm font-medium ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isCorrect ? '+1' : '0'} marks
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-800 font-medium mb-2">
                            {question.question}
                          </p>
                          
                          {question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => {
                                const isStudentChoice = studentAnswer === optionIndex;
                                const isCorrectChoice = correctAnswer === optionIndex;
                                
                                return (
                                  <div key={optionIndex} className={`p-2 rounded border ${
                                    isCorrectChoice 
                                      ? 'border-green-300 bg-green-100' 
                                      : isStudentChoice 
                                      ? 'border-red-300 bg-red-100' 
                                      : 'border-gray-200 bg-white'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-700">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <span className="text-gray-800">{option}</span>
                                      {isCorrectChoice && (
                                        <span className="text-green-600 font-medium text-sm">
                                          ✅ Correct Answer
                                        </span>
                                      )}
                                      {isStudentChoice && !isCorrectChoice && (
                                        <span className="text-red-600 font-medium text-sm">
                                          ❌ Your Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-1">💡 Explanation:</div>
                            <div className="text-blue-800 text-sm">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                        
                        {!isCorrect && !question.explanation && (
                          <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                            <div className="text-sm font-medium text-orange-700 mb-1">💡 Note:</div>
                            <div className="text-orange-800 text-sm">
                              Review this question to understand the correct answer better.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : result.exam && result.exam.questions && result.answers ? (
                <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-800 font-medium">Question Analysis Disabled</p>
                  <p className="text-sm text-blue-600">The instructor has not enabled detailed question analysis for this exam</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Question analysis not available</p>
                  <p className="text-sm text-gray-500">No exam data found</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 ${certificateMode ? 'no-print' : ''}`}>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              
              <button
                onClick={() => navigate('/my-results')}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View All Results</span>
              </button>
              
              {certificateMode ? (
                <>
                  <button
                    onClick={() => navigate(`/result/${sessionId}`)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Regular Result</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Certificate</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={downloadMarksheet}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Result</span>
                  </button>
                  {isPassed && (
                    <>
                      <button
                        onClick={() => navigate(`/result/${sessionId}?certificate=true`)}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Award className="w-4 h-4" />
                        <span>View Certificate</span>
                      </button>
                      <button
                        onClick={downloadCertificatePDF}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Certificate PDF</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Certificate Footer - Only visible when printing */}
            {certificateMode && isPassed && (
              <div className="print-only mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                <p>This is an <strong>official certificate</strong> generated by Exam Portal.</p>
                <p>Document ID: <strong>{sessionId}</strong> | Generated on: <strong>{new Date().toLocaleDateString()}</strong></p>
                <p>This certificate is digitally verified and authenticated.</p>
                <p>© {new Date().getFullYear()} Exam Portal. All rights reserved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default ExamResult;