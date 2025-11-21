import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const ModernModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'warning', 'error', 'info'
  children,
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  animation = 'slideUp' // 'slideUp', 'fadeIn', 'scaleIn'
}) => {
  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      accentColor: 'bg-green-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      accentColor: 'bg-yellow-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      accentColor: 'bg-red-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      accentColor: 'bg-blue-500'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  const animationClasses = {
    slideUp: 'animate-slideUp',
    fadeIn: 'animate-fadeIn',
    scaleIn: 'animate-scaleIn'
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .backdrop-blur-custom {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-custom transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
          relative bg-white rounded-2xl shadow-2xl border-2 ${config.borderColor} 
          ${sizeClasses[size]} w-full ${animationClasses[animation]}
          transform transition-all duration-300
        `}>
          {/* Accent Bar */}
          <div className={`h-1 ${config.accentColor} rounded-t-2xl`} />
          
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors group z-10"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </button>
          )}
          
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} 
                flex items-center justify-center ring-4 ring-white shadow-lg
              `}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className={`text-xl font-bold ${config.titleColor} mb-2`}>
                    {title}
                  </h3>
                )}
                {message && (
                  <p className="text-gray-600 leading-relaxed">
                    {message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Custom Content */}
            {children && (
              <div className="mt-6">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernModal;
