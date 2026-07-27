import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ModernNotification = ({ 
  isVisible, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'warning', 'error', 'info'
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
  autoClose = true,
  autoCloseDelay = 4000,
  showProgress = true
}) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoClose && isVisible) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          handleClose();
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      setProgress(100);
    }, 300);
  };

  if (!isVisible && !isExiting) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
      textColor: 'text-white',
      progressColor: 'bg-white/30',
      shadowColor: 'shadow-green-500/25'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-white',
      progressColor: 'bg-white/30',
      shadowColor: 'shadow-yellow-500/25'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-r from-red-500 to-rose-600',
      textColor: 'text-white',
      progressColor: 'bg-white/30',
      shadowColor: 'shadow-red-500/25'
    },
    info: {
      icon: Info,
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      textColor: 'text-white',
      progressColor: 'bg-white/30',
      shadowColor: 'shadow-blue-500/25'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }
        
        @keyframes slideInTop {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOutTop {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-100%);
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-out-right {
          animation: slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-out-left {
          animation: slideOutLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-in-top {
          animation: slideInTop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-out-top {
          animation: slideOutTop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      
      <div className={`
        fixed z-50 ${positionClasses[position]} max-w-sm w-full
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}>
        <div className={`
          ${config.bgColor} ${config.shadowColor} shadow-2xl rounded-2xl p-4
          border border-white/20 backdrop-blur-sm transform transition-all duration-300
          hover:scale-105 hover:shadow-3xl
        `}>
          {/* Content */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Icon className={`w-6 h-6 ${config.textColor}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`font-bold ${config.textColor} text-sm mb-1`}>
                  {title}
                </h4>
              )}
              {message && (
                <p className={`${config.textColor} text-sm opacity-90 leading-relaxed`}>
                  {message}
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className={`
                flex-shrink-0 p-1 rounded-full ${config.textColor} 
                hover:bg-white/20 transition-colors
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress Bar */}
          {showProgress && autoClose && (
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModernNotification;
