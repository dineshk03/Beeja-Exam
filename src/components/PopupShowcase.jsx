import React, { useState } from 'react';
import ModernModal from './ModernModal';
import ModernNotification from './ModernNotification';
import ModernConfirmDialog from './ModernConfirmDialog';
import ModernToast from './ModernToast';
import notificationManager from '../utils/notificationManager';

const PopupShowcase = () => {
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [modalType, setModalType] = useState('success');

  const showNotificationExample = (type) => {
    notificationManager[type](
      `${type.charAt(0).toUpperCase() + type.slice(1)} Example`,
      `This is a modern ${type} notification with beautiful animations and styling.`,
      { autoCloseDelay: 4000 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🎨 Modern Popup System Showcase
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Modal Examples */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Modern Modals</h2>
            <p className="text-gray-600 mb-4">
              Full-screen overlay modals with blur effects and smooth animations.
            </p>
            
            <div className="space-y-3">
              {['success', 'warning', 'error', 'info'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setModalType(type);
                    setShowModal(true);
                  }}
                  className={`
                    w-full px-4 py-2 rounded-lg font-medium transition-colors
                    ${type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      type === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                      type === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      'bg-blue-100 text-blue-700 hover:bg-blue-200'}
                  `}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Modal
                </button>
              ))}
            </div>
          </div>

          {/* Notification Examples */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔔 Smart Notifications</h2>
            <p className="text-gray-600 mb-4">
              Corner notifications with auto-close and progress indicators.
            </p>
            
            <div className="space-y-3">
              {['success', 'warning', 'error', 'info'].map((type) => (
                <button
                  key={type}
                  onClick={() => showNotificationExample(type)}
                  className={`
                    w-full px-4 py-2 rounded-lg font-medium transition-colors
                    ${type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      type === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                      type === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      'bg-blue-100 text-blue-700 hover:bg-blue-200'}
                  `}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Notification
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation Dialog */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">❓ Confirmation Dialogs</h2>
            <p className="text-gray-600 mb-4">
              Interactive confirmation dialogs with custom actions.
            </p>
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              Show Confirmation Dialog
            </button>
          </div>

          {/* Toast Examples */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🍞 Modern Toasts</h2>
            <p className="text-gray-600 mb-4">
              Rich toast notifications with actions and custom positioning.
            </p>
            
            <button
              onClick={() => setShowToast(true)}
              className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
            >
              Show Toast with Actions
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">✨ Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🎨</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Beautiful Design</h3>
              <p className="text-gray-600 text-sm">Modern gradients, shadows, and animations</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Smooth Animations</h3>
              <p className="text-gray-600 text-sm">Cubic-bezier transitions and micro-interactions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🔧</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Highly Configurable</h3>
              <p className="text-gray-600 text-sm">Multiple types, positions, and customization options</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ModernModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Modal`}
        message="This is a modern modal with beautiful styling and smooth animations. It supports different types and sizes."
        type={modalType}
        size="md"
        animation="slideUp"
      >
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            You can add custom content here, like forms, images, or any other React components.
          </p>
        </div>
      </ModernModal>

      {/* Confirmation Dialog */}
      <ModernConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false);
          notificationManager.success('Confirmed!', 'Action was confirmed successfully.');
        }}
        title="Are you sure?"
        message="This is a confirmation dialog. It's perfect for destructive actions or important decisions."
        type="warning"
        confirmText="Yes, I'm sure"
        cancelText="Cancel"
        confirmButtonStyle="danger"
      />

      {/* Toast */}
      <ModernToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        title="Success!"
        message="This is a modern toast notification with action buttons."
        type="success"
        position="bottom-right"
        actions={[
          {
            label: 'View Details',
            onClick: () => {
              setShowToast(false);
              notificationManager.info('Details', 'Here are the details you requested.');
            },
            primary: true
          },
          {
            label: 'Dismiss',
            onClick: () => setShowToast(false)
          }
        ]}
      />
    </div>
  );
};

export default PopupShowcase;
