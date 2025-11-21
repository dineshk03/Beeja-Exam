import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Clock, FileText, Lock, Unlock } from 'lucide-react';

function SectionManager({ sections = [], onUpdate, availableQuestions = [] }) {
  const [editingSections, setEditingSections] = useState(sections.length > 0 ? sections : []);

  const addSection = () => {
    const newSection = {
      name: '',
      description: '',
      duration: 30,
      questions: [],
      allowBackNavigation: false,
    };
    const updated = [...editingSections, newSection];
    setEditingSections(updated);
    onUpdate(updated);
  };

  const removeSection = (index) => {
    if (window.confirm('Are you sure you want to remove this section?')) {
      const updated = editingSections.filter((_, i) => i !== index);
      setEditingSections(updated);
      onUpdate(updated);
    }
  };

  const updateSection = (index, field, value) => {
    const updated = editingSections.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    );
    setEditingSections(updated);
    onUpdate(updated);
  };

  const addQuestionToSection = (sectionIndex, questionId) => {
    const updated = editingSections.map((section, i) => {
      if (i === sectionIndex) {
        return {
          ...section,
          questions: [...section.questions, questionId]
        };
      }
      return section;
    });
    setEditingSections(updated);
    onUpdate(updated);
  };

  const removeQuestionFromSection = (sectionIndex, questionIndex) => {
    const updated = editingSections.map((section, i) => {
      if (i === sectionIndex) {
        return {
          ...section,
          questions: section.questions.filter((_, qi) => qi !== questionIndex)
        };
      }
      return section;
    });
    setEditingSections(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Exam Sections</h3>
          <p className="text-sm text-gray-600">
            Create multiple sections with independent timers
          </p>
        </div>
        <button
          onClick={addSection}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {editingSections.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No sections created yet</p>
          <button
            onClick={addSection}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {editingSections.map((section, index) => (
            <div 
              key={index} 
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
            >
              {/* Section Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                        Section {index + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {section.questions?.length || 0} questions
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeSection(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Section Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => updateSection(index, 'name', e.target.value)}
                    placeholder="e.g., Aptitude, Technical, Verbal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={section.duration}
                      onChange={(e) => updateSection(index, 'duration', parseInt(e.target.value))}
                      min="1"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={section.description}
                  onChange={(e) => updateSection(index, 'description', e.target.value)}
                  placeholder="Brief description of this section..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* One-way Navigation Toggle */}
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!section.allowBackNavigation}
                    onChange={(e) => updateSection(index, 'allowBackNavigation', !e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {!section.allowBackNavigation ? (
                        <Lock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-semibold text-gray-900">
                        One-way Navigation
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {!section.allowBackNavigation 
                        ? '🔒 Students cannot return to this section once submitted'
                        : '🔓 Students can navigate back to this section'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Questions in Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Questions in this Section ({section.questions?.length || 0})
                </h4>
                
                {section.questions && section.questions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {section.questions.map((questionId, qIndex) => {
                      const question = availableQuestions.find(q => q._id === questionId);
                      return (
                        <div 
                          key={qIndex}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {question?.question || questionId}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {question?.type || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {question?.points || 0} points
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeQuestionFromSection(index, qIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-gray-600 text-sm">
                      No questions added to this section yet
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Use the Exam Builder to add questions to sections
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {editingSections.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Exam Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Total Sections</p>
              <p className="text-2xl font-bold text-blue-900">{editingSections.length}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Duration</p>
              <p className="text-2xl font-bold text-blue-900">
                {editingSections.reduce((sum, s) => sum + (s.duration || 0), 0)} mins
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Questions</p>
              <p className="text-2xl font-bold text-blue-900">
                {editingSections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">One-way Sections</p>
              <p className="text-2xl font-bold text-blue-900">
                {editingSections.filter(s => !s.allowBackNavigation).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionManager;
