import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, FileText, AlertTriangle, Camera } from 'lucide-react';
import SystemRequirementsCheck from './SystemRequirementsCheck';

function InstructionsPage({ exam, onStart }) {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  // Debug: Check what values we have
  console.log('🔍 EXAM DATA RECEIVED:');
  console.log('  Title:', exam.title);
  console.log('  enableWebcam:', exam.enableWebcam, '(type:', typeof exam.enableWebcam, ')');
  console.log('  enableMicrophone:', exam.enableMicrophone, '(type:', typeof exam.enableMicrophone, ')');
  console.log('  requirePhotoCapture:', exam.requirePhotoCapture, '(type:', typeof exam.requirePhotoCapture, ')');
  console.log('  Full exam object:', exam);

  const defaultInstructions = [
    'Read all questions carefully before answering.',
    'Each question carries marks as specified.',
    'There is no negative marking unless specified.',
    'Do not refresh the page during the exam.',
    'The exam will auto-submit when time expires.',
    'Ensure stable internet connection throughout the exam.',
    'Switching tabs or windows will be logged and may result in disqualification.',
  ];

  const instructions = exam.instructions 
    ? exam.instructions.split('\n').filter(line => line.trim())
    : defaultInstructions;

  const handleStart = () => {
    if (!agreed) {
      alert('Please agree to the terms and conditions before starting the exam.');
      return;
    }
    onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
          <p className="text-blue-100">{exam.description}</p>
        </div>

        {/* Exam Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
          <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-bold text-gray-900">{exam.duration} mins</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-lg font-bold text-gray-900">
                {exam.hasSections 
                  ? exam.sections.reduce((sum, s) => sum + s.questions.length, 0)
                  : exam.questions?.length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="bg-purple-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Passing Score</p>
              <p className="text-lg font-bold text-gray-900">{exam.passingScore}%</p>
            </div>
          </div>
        </div>

        {/* Sections Info (if applicable) */}
        {exam.hasSections && (
          <div className="p-6 border-b bg-blue-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Exam Sections</h2>
            <div className="space-y-3">
              {exam.sections.map((section, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{section.name}</h3>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-bold text-blue-600">{section.duration} mins</p>
                      <p className="text-xs text-gray-500 mt-1">{section.questions.length} questions</p>
                    </div>
                  </div>
                  {!section.allowBackNavigation && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      You cannot go back to this section once submitted
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Instructions
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ol className="space-y-2">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-bold text-blue-600 mr-3">{index + 1}.</span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Additional Rules */}
        {exam.rules && exam.rules.length > 0 && (
          <div className="p-6 border-b bg-amber-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-amber-600" />
              Important Rules
            </h2>
            <ul className="space-y-2">
              {exam.rules.map((rule, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-600 mr-2">⚠️</span>
                  <span className="text-gray-700">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* System Requirements Check */}
        <div className="p-6 border-b">
          <SystemRequirementsCheck 
            enableWebcam={exam.enableWebcam === true || exam.requirePhotoCapture === true}
            enableMicrophone={exam.enableMicrophone === true}
          />
        </div>

        {/* Agreement and Start */}
        <div className="p-6 bg-gray-50">
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I have read and understood all the instructions and rules. I agree to abide by them during the examination.
                I understand that any violation may result in disqualification.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!agreed}
              className={`px-8 py-3 rounded-lg font-bold text-white transition-all transform ${
                agreed
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 hover:scale-105 shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {agreed ? 'Start Exam →' : 'Accept Terms to Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructionsPage;
