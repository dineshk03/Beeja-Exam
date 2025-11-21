import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ModernToast = ({ 
  isVisible, 
  onClose, 
  title, 
  message, 
  type = 'success', // 'success', 'warning', 'error', 'info'
  position = 'bottom-right',
  autoClose = true,
  autoCloseDelay = 4000,
  showProgress = true,
  actions = [] // Array of action buttons
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
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
      progressColor: 'bg-green-500',
      shadowColor: 'shadow-green-500/20'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-700',
      progressColor: 'bg-yellow-500',
      shadowColor: 'shadow-yellow-500/20'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      progressColor: 'bg-red-500',
      shadowColor: 'shadow-red-500/20'
    },
    info: {
      icon: Info,
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      progressColor: 'bg-blue-500',
      shadowColor: 'shadow-blue-500/20'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <>
      <style jsx>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
        }
        
        .toast-slide-in {
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .toast-slide-out {
          animation: toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      
      <div className={`
        fixed z-50 ${positionClasses[position]} max-w-md w-full
        ${isExiting ? 'toast-slide-out' : 'toast-slide-in'}
      `}>
        <div className={`
          ${config.bgColor} ${config.borderColor} ${config.shadowColor}
          border-2 rounded-2xl p-6 shadow-2xl backdrop-blur-sm
          transform transition-all duration-300 hover:scale-105
        `}>
          {/* Header */}
          <div className="flex items-start space-x-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-lg`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`font-bold ${config.titleColor} text-lg mb-1`}>
                  {title}
                </h4>
              )}
              {message && (
                <p className={`${config.messageColor} text-sm leading-relaxed`}>
                  {message}
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className={`
                flex-shrink-0 p-1 rounded-full ${config.titleColor} 
                hover:bg-white/50 transition-colors opacity-60 hover:opacity-100
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex space-x-2 mb-4">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${action.primary 
                      ? `${config.iconColor.replace('text-', 'bg-')} text-white hover:opacity-90` 
                      : `${config.titleColor} hover:bg-white/50`
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Progress Bar */}
          {showProgress && autoClose && (
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
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

export default ModernToast;
