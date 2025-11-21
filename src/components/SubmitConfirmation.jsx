import React from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, Flag, ArrowRight } from 'lucide-react';

function SubmitConfirmation({ 
  totalQuestions, 
  answeredCount, 
  flaggedCount, 
  onConfirm, 
  onCancel,
  onReview,
  submitting 
}) {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <>
      <style jsx>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-slide-up {
          animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .backdrop-blur-custom {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-custom flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-2 border-gray-100 modal-slide-up overflow-hidden">
          {/* Accent Bar */}
          <div className={`h-1 ${unansweredCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          
          {/* Content */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
          {unansweredCount > 0 ? (
            <div className="bg-yellow-100 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
          ) : (
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Submit Exam?
        </h2>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Total Questions:</span>
            <span className="font-semibold text-gray-900">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-gray-700">Answered:</span>
            <span className="font-semibold text-green-700">{answeredCount}</span>
          </div>
          {unansweredCount > 0 && (
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-700">Unanswered:</span>
              <span className="font-semibold text-yellow-700">{unansweredCount}</span>
            </div>
          )}
          {flaggedCount > 0 && (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Flagged for Review:</span>
              <span className="font-semibold text-blue-700">{flaggedCount}</span>
            </div>
          )}
        </div>

        {unansweredCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}. 
              Are you sure you want to submit?
            </p>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Once submitted, you cannot change your answers.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onReview || onCancel}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            📋 Review Answers
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-green-400"
          >
            {submitting ? '⏳ Submitting...' : '🚀 Submit Exam'}
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SubmitConfirmation;
