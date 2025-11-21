import React, { useState } from 'react';
import notificationManager from '../utils/notificationManager';
import ModernModal from './ModernModal';
import ModernConfirmDialog from './ModernConfirmDialog';

const PopupTest = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const testNotifications = () => {
    notificationManager.success('Success!', 'This is a success notification');
    
    setTimeout(() => {
      notificationManager.warning('Warning!', 'This is a warning notification');
    }, 1000);
    
    setTimeout(() => {
      notificationManager.info('Info!', 'This is an info notification');
    }, 2000);
    
    setTimeout(() => {
      notificationManager.error('Error!', 'This is an error notification');
    }, 3000);
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">🎨 Modern Popup System Test</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={testNotifications}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Test Notifications
        </button>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Test Modal
        </button>
        
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Test Confirmation
        </button>
        
        <button
          onClick={() => notificationManager.clear()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Clear All
        </button>
      </div>

      <ModernModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Test Modal"
        message="This is a test modal with modern styling!"
        type="success"
      />

      <ModernConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          notificationManager.success('Confirmed!', 'You clicked confirm!');
        }}
        title="Test Confirmation"
        message="Do you want to test the confirmation dialog?"
        type="warning"
      />
    </div>
  );
};

export default PopupTest;
