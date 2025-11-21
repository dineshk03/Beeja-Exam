import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const ModernConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  message, 
  type = 'warning', // 'success', 'warning', 'error', 'info'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'primary', // 'primary', 'danger', 'success'
  loading = false
}) => {
  console.log('🔍 ModernConfirmDialog render:', { isOpen, title, loading });
  
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

  const buttonStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <>
      <style jsx>{`
        @keyframes modalBounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .modal-bounce-in {
          animation: modalBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .backdrop-blur-strong {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-strong transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Dialog */}
        <div className={`
          relative bg-white rounded-3xl shadow-2xl border-2 ${config.borderColor} 
          max-w-md w-full modal-bounce-in overflow-hidden
        `}>
          {/* Accent Bar */}
          <div className={`h-2 ${config.accentColor}`} />
          
          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className={`
              inline-flex items-center justify-center w-16 h-16 rounded-full 
              ${config.bgColor} ring-4 ring-white shadow-lg mb-6
            `}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
            
            {/* Title */}
            <h3 className={`text-2xl font-bold ${config.titleColor} mb-4`}>
              {title}
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 leading-relaxed mb-8">
              {message}
            </p>
            
            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`
                  flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 
                  ${buttonStyles[confirmButtonStyle]} disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernConfirmDialog;
