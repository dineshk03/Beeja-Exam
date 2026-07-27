import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import api from '../../api/axios';
import { formatDate } from '../../utils/dateFormatter';

export default function CertificateModal({ certificateData, onClose }) {
  const [certSettings, setCertSettings] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    api.get('/certificate-settings')
      .then(r => setCertSettings(r.data))
      .catch(() => {});

    api.post('/generate-qr-code', { sessionId: certificateData.sessionId })
      .then(r => setQrCode(r.data.qrCode))
      .catch(() => {});
  }, [certificateData.sessionId]);

  const handleDownload = () => {
    const token = localStorage.getItem('auth-token');
    fetch(`/api/certificates/${certificateData.sessionId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificateData.certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  };

  const companyName = certSettings?.companyName || 'Beeja Academy';
  const webUrl = certSettings?.qrCodeSettings?.verificationUrl?.replace(/^https?:\/\//, '') || 'www.beejaacademy.com';
  const emailUrl = `info@beejaacademy.com`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <style>{`
        .cert-script { font-family: 'Brush Script MT', 'Segoe Script', cursive; }
        @media print {
          .cert-no-print { display: none !important; }
          .cert-modal-bg { background: transparent !important; padding: 0 !important; }
        }
      `}</style>

      <div className="cert-modal-bg w-full max-w-4xl">
        {/* Action bar */}
        <div className="cert-no-print flex justify-between items-center mb-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-[#00bcd4] text-white rounded-lg text-sm font-medium hover:bg-[#0097a7] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Certificate */}
        <div style={{
          position:'relative', background:'white', overflow:'hidden',
          border:'3px solid #006064', aspectRatio:'297/210', display:'flex', flexDirection:'column',
          boxShadow:'0 32px 100px rgba(0,0,0,0.3)',
          backgroundImage:'radial-gradient(ellipse at 50% 40%,rgba(0,188,212,0.05) 0%,transparent 65%)',
          fontFamily:"'Georgia','Times New Roman',serif",
        }}>
          <div style={{position:'absolute',inset:10,border:'1px solid rgba(0,188,212,0.28)',pointerEvents:'none',zIndex:2}} />
          <div style={{position:'absolute',left:'3.7%',top:'13%',bottom:'18%',width:1,background:'linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent)',zIndex:2,pointerEvents:'none'}} />
          <div style={{position:'absolute',right:'3.7%',top:'13%',bottom:'18%',width:1,background:'linear-gradient(to bottom,transparent,#c8a84b 15%,#c8a84b 85%,transparent)',zIndex:2,pointerEvents:'none'}} />
          {[
            {top:14,left:14,borderTop:'2.5px solid #c8a84b',borderLeft:'2.5px solid #c8a84b'},
            {top:14,right:14,borderTop:'2.5px solid #c8a84b',borderRight:'2.5px solid #c8a84b'},
            {bottom:14,left:14,borderBottom:'2.5px solid #c8a84b',borderLeft:'2.5px solid #c8a84b'},
            {bottom:14,right:14,borderBottom:'2.5px solid #c8a84b',borderRight:'2.5px solid #c8a84b'},
          ].map((s,i) => <div key={i} style={{position:'absolute',width:26,height:26,zIndex:3,...s}} />)}
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'6vw',fontWeight:900,color:'rgba(0,188,212,0.05)',transform:'rotate(-20deg)',pointerEvents:'none',whiteSpace:'nowrap',zIndex:0}}>{companyName}</div>

          {/* Deep teal header band */}
          <div style={{background:'linear-gradient(135deg,#002e27 0%,#005050 25%,#007878 50%,#005050 75%,#002e27 100%)',padding:'1.6% 5.5%',display:'flex',justifyContent:'space-between',alignItems:'center',position:'relative',zIndex:1,flexShrink:0,boxShadow:'0 3px 10px rgba(0,0,0,0.3)'}}>
            <div style={{fontSize:'0.82vw',color:'rgba(255,255,255,0.78)',fontFamily:'Arial,sans-serif'}}>
              Certificate ID: {certificateData.certificateId}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.6vw'}}>
              {certSettings?.logos?.company && (
                <img src={certSettings.logos.company} alt="Logo"
                  style={{height:'2.8vw',objectFit:'contain',filter:'brightness(0) invert(1)'}}
                  onError={e => { e.target.style.display='none'; }} />
              )}
              <span style={{fontSize:'1.8vw',fontWeight:'bold',color:'white',letterSpacing:'0.04vw'}}>{companyName}</span>
            </div>
            <div style={{fontSize:'0.82vw',color:'rgba(255,255,255,0.78)',fontFamily:'Arial,sans-serif'}}>
              Issued on: {formatDate(certificateData.completionDate)}
            </div>
          </div>

          {/* Main content */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 7%',position:'relative',zIndex:1,gap:'0.5%'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'4.6vw',fontWeight:900,color:'#1a1a2e',letterSpacing:'0.75vw',lineHeight:1}}>CERTIFICATE</div>
              <div style={{fontSize:'0.8vw',letterSpacing:'0.5vw',color:'#006064',textTransform:'uppercase',marginTop:'0.2%'}}>of Completion</div>
            </div>

            {/* Three-dot gold rule */}
            <div style={{display:'flex',alignItems:'center',gap:'0.5%',width:'58%'}}>
              <div style={{flex:1,height:1,background:'#c8a84b'}} />
              {[0,1,2].map(i => <div key={i} style={{width:5,height:5,background:'#c8a84b',borderRadius:'50%',flexShrink:0}} />)}
              <div style={{flex:1,height:1,background:'#c8a84b'}} />
            </div>

            <div style={{fontSize:'0.68vw',letterSpacing:'0.28vw',color:'#888',textAlign:'center',fontFamily:'Arial,sans-serif',textTransform:'uppercase'}}>
              This Certificate is Proudly Presented To
            </div>

            <div className="cert-script" style={{fontSize:'3.8vw',color:'#6d28d9',textAlign:'center',lineHeight:1.15}}>
              {certificateData.studentName || 'Student Name'}
            </div>
            <div style={{width:'18%',height:2,background:'linear-gradient(to right,transparent,#00bcd4,transparent)',margin:'0 auto'}} />

            {/* Achievement box */}
            <div style={{background:'linear-gradient(135deg,rgba(0,188,212,0.06),rgba(0,100,100,0.06))',border:'1px solid rgba(0,188,212,0.18)',borderRadius:4,padding:'1.2% 8%',width:'72%',margin:'0 auto',textAlign:'center'}}>
              <div style={{fontSize:'0.85vw',color:'#555',fontFamily:'Arial,sans-serif',lineHeight:1.7}}>In recognition of successfully completing</div>
              <div style={{fontSize:'1.6vw',fontWeight:'bold',color:'#00897b',letterSpacing:'0.03vw',margin:'0.2% 0'}}>
                {certSettings?.coursePrefix || certificateData.courseName}
              </div>
              {certSettings?.courseName && (
                <>
                  <div style={{fontSize:'0.85vw',color:'#555',fontFamily:'Arial,sans-serif',lineHeight:1.7}}>and real-time project training on</div>
                  <div style={{fontSize:'1.4vw',fontWeight:'bold',color:'#00897b',margin:'0.2% 0'}}>{certSettings.courseName}</div>
                </>
              )}
              {certificateData.score > 0 && (
                <div style={{fontSize:'0.78vw',color:'#888',fontFamily:'Arial,sans-serif',marginTop:'0.3%',fontStyle:'italic'}}>
                  with a score of {certificateData.score}%{certificateData.grade ? ` · Grade: ${certificateData.grade}` : ''}
                </div>
              )}
            </div>

            <div style={{fontSize:'0.7vw',color:'#ccc',fontStyle:'italic',textAlign:'center',fontFamily:"'Georgia',serif"}}>
              "Keep learning, keep growing — excellence is a journey, not a destination."
            </div>
          </div>

          {/* Footer */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',padding:'1% 5.5% 1.5%',borderTop:'1px solid rgba(0,188,212,0.2)',background:'linear-gradient(to bottom,rgba(0,188,212,0.03),rgba(0,80,80,0.05))',position:'relative',zIndex:1,flexShrink:0}}>
            <div style={{textAlign:'center'}}>
              {qrCode ? (
                <img src={qrCode} alt="QR Code" style={{width:'5vw',height:'5vw'}} />
              ) : (
                <div style={{width:'5vw',height:'5vw',background:'#f5f5f5',border:'1px solid #ddd'}} />
              )}
              <div style={{fontSize:'0.65vw',color:'#999',marginTop:2,fontFamily:'Arial,sans-serif'}}>Scan to Verify</div>
            </div>

            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.95vw',color:'#00897b',fontFamily:'Arial,sans-serif',marginBottom:2}}>{webUrl}</div>
              <div style={{fontSize:'0.82vw',color:'#999',fontFamily:'Arial,sans-serif'}}>{emailUrl}</div>
            </div>

            <div style={{textAlign:'center',minWidth:'9vw'}}>
              {certSettings?.signatures?.signature1?.image ? (
                <img src={certSettings.signatures.signature1.image} alt="Signature"
                  style={{height:'3.6vw',objectFit:'contain',display:'block',margin:'0 auto'}}
                  onError={e => { e.target.style.display='none'; }} />
              ) : (
                <div className="cert-script" style={{fontSize:'2vw',color:'#333',lineHeight:1.2,textAlign:'center'}}>
                  {certSettings?.signatures?.signature1?.name?.split(' ')[0] || 'Sign'}
                </div>
              )}
              <div style={{width:'9vw',height:1,background:'#555',margin:'3px auto'}} />
              <div style={{fontSize:'0.82vw',fontWeight:'bold',color:'#333',fontFamily:'Arial,sans-serif'}}>
                {(certSettings?.signatures?.signature1?.name || 'DIRECTOR').toUpperCase()}
              </div>
              <div style={{fontSize:'0.72vw',color:'#777',fontFamily:'Arial,sans-serif'}}>
                {certSettings?.signatures?.signature1?.title || 'Director'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
