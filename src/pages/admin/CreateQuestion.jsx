import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function CreateQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [questionData, setQuestionData] = useState({
    type: 'multiple-choice',
    question: '',
    category: '',
    points: 5,
    difficulty: 'medium',
    // Multiple/Single Choice
    options: ['', '', '', ''],
    correctAnswer: 0,
    // Multiple Answer
    correctAnswerIndices: [],
    // Short Answer
    correctAnswers: [''],
    caseSensitive: false,
    // Match Following
    leftItems: ['', ''],
    rightItems: ['', ''],
    correctMatches: {},
    // Code Test
    language: 'javascript',
    starterCode: '',
    testCases: [{ input: '', expectedOutput: '', points: 5 }],
    // Drag & Drop
    draggableItems: ['', ''],
    dropZones: [{ label: '', correctItems: [] }],
    // Hotspot
    imageUrl: '',
    hotspots: [{ x: 0, y: 0, width: 10, height: 10, label: '' }],
    maxHotspotSelections: 1,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchQuestion();
    }
    fetchExams();
  }, [id]);

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/questions/${id}`);
      if (response.data) {
        setQuestionData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
      alert('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let questionId;
      if (isEdit) {
        await api.put(`/admin/questions/${id}`, questionData);
        questionId = id;
      } else {
        const response = await api.post('/admin/questions', questionData);
        questionId = response.data._id;
      }

      // If exam is selected, assign question to exam
      if (selectedExam && questionId) {
        try {
          await api.post(`/admin/exams/${selectedExam}/questions/${questionId}`);
          alert('Question saved and added to exam successfully!');
        } catch (error) {
          console.error('Failed to assign to exam:', error);
          alert('Question saved but failed to add to exam');
        }
      }

      navigate('/admin/questions');
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setQuestionData(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setQuestionData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }));
  };

  const updateOption = (index, value) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addCorrectAnswer = () => {
    setQuestionData(prev => ({
      ...prev,
      correctAnswers: [...prev.correctAnswers, '']
    }));
  };

  const removeCorrectAnswer = (index) => {
    setQuestionData(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.filter((_, i) => i !== index)
    }));
  };

  const updateCorrectAnswer = (index, value) => {
    setQuestionData(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.map((ans, i) => i === index ? value : ans)
    }));
  };

  const addMatchItem = (side) => {
    const field = side === 'left' ? 'leftItems' : 'rightItems';
    setQuestionData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeMatchItem = (side, index) => {
    const field = side === 'left' ? 'leftItems' : 'rightItems';
    setQuestionData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateMatchItem = (side, index, value) => {
    const field = side === 'left' ? 'leftItems' : 'rightItems';
    setQuestionData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const updateMatch = (leftIndex, rightIndex) => {
    setQuestionData(prev => ({
      ...prev,
      correctMatches: {
        ...prev.correctMatches,
        [leftIndex]: rightIndex
      }
    }));
  };

  const addTestCase = () => {
    setQuestionData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', points: 5 }]
    }));
  };

  const removeTestCase = (index) => {
    setQuestionData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index, field, value) => {
    setQuestionData(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/questions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Question Bank
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Edit Question' : 'Create New Question'}
        </h1>
        <p className="text-gray-600">Fill in the details to create a new question</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <select
              value={questionData.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="single-choice">Single Choice</option>
              <option value="multiple-answer">Multiple Answer (Checkboxes)</option>
              <option value="short-answer">Short Answer</option>
              <option value="match-following">Match the Following</option>
              <option value="code-test">Code Test</option>
              <option value="hotspot">Hotspot (Image Click)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={questionData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., JavaScript, React, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points *
            </label>
            <input
              type="number"
              value={questionData.points}
              onChange={(e) => updateField('points', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={questionData.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question *
          </label>
          <textarea
            value={questionData.question}
            onChange={(e) => updateField('question', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Enter your question here..."
            required
          />
        </div>

        {/* Type-specific fields */}
        {(questionData.type === 'multiple-choice' || questionData.type === 'single-choice') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Options *
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Option</span>
              </button>
            </div>
            <div className="space-y-3">
              {questionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={questionData.correctAnswer === index}
                    onChange={() => updateField('correctAnswer', index)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {questionData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select the radio button to mark the correct answer
            </p>
          </div>
        )}

        {questionData.type === 'multiple-answer' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Options * (Select all correct answers)
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Option</span>
              </button>
            </div>
            <div className="space-y-3">
              {questionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={questionData.correctAnswerIndices.includes(index)}
                    onChange={(e) => {
                      const newIndices = e.target.checked
                        ? [...questionData.correctAnswerIndices, index]
                        : questionData.correctAnswerIndices.filter(i => i !== index);
                      updateField('correctAnswerIndices', newIndices);
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {questionData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        removeOption(index);
                        // Update correctAnswerIndices when removing an option
                        const newIndices = questionData.correctAnswerIndices
                          .filter(i => i !== index)
                          .map(i => i > index ? i - 1 : i);
                        updateField('correctAnswerIndices', newIndices);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Check all boxes for correct answers (at least one required)
            </p>
          </div>
        )}

        {questionData.type === 'short-answer' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Correct Answers *
              </label>
              <button
                type="button"
                onClick={addCorrectAnswer}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Answer</span>
              </button>
            </div>
            <div className="space-y-3">
              {questionData.correctAnswers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => updateCorrectAnswer(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Acceptable answer ${index + 1}`}
                    required
                  />
                  {questionData.correctAnswers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCorrectAnswer(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={questionData.caseSensitive}
                  onChange={(e) => updateField('caseSensitive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Case sensitive</span>
              </label>
            </div>
          </div>
        )}

        {questionData.type === 'match-following' && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Left Column *
                  </label>
                  <button
                    type="button"
                    onClick={() => addMatchItem('left')}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {questionData.leftItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMatchItem('left', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Item ${index + 1}`}
                        required
                      />
                      {questionData.leftItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMatchItem('left', index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Right Column *
                  </label>
                  <button
                    type="button"
                    onClick={() => addMatchItem('right')}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {questionData.rightItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-6">{String.fromCharCode(65 + index)}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMatchItem('right', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Item ${String.fromCharCode(65 + index)}`}
                        required
                      />
                      {questionData.rightItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMatchItem('right', index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Correct Matches *
              </label>
              <div className="space-y-3">
                {questionData.leftItems.map((leftItem, leftIndex) => (
                  <div key={leftIndex} className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 w-32">
                      {leftIndex + 1}. {leftItem || `Item ${leftIndex + 1}`}
                    </span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={questionData.correctMatches[leftIndex] ?? ''}
                      onChange={(e) => updateMatch(leftIndex, parseInt(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select match...</option>
                      {questionData.rightItems.map((rightItem, rightIndex) => (
                        <option key={rightIndex} value={rightIndex}>
                          {String.fromCharCode(65 + rightIndex)}. {rightItem || `Item ${String.fromCharCode(65 + rightIndex)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {questionData.type === 'code-test' && (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programming Language *
              </label>
              <select
                value={questionData.language}
                onChange={(e) => updateField('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starter Code
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <Editor
                  height="200px"
                  language={questionData.language}
                  value={questionData.starterCode}
                  onChange={(value) => updateField('starterCode', value || '')}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Test Cases *
                </label>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Test Case</span>
                </button>
              </div>
              <div className="space-y-4">
                {questionData.testCases.map((testCase, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Test Case {index + 1}</h4>
                      {questionData.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Input</label>
                        <input
                          type="text"
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., [1, 2, 3]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Expected Output</label>
                        <input
                          type="text"
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 6"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Points</label>
                        <input
                          type="number"
                          value={testCase.points}
                          onChange={(e) => updateTestCase(index, 'points', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hotspot Question Type */}
        {questionData.type === 'hotspot' && (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL *
              </label>
              <input
                type="text"
                value={questionData.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the URL of the image for the hotspot question</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Hotspot Selections
              </label>
              <input
                type="number"
                value={questionData.maxHotspotSelections || ''}
                onChange={(e) => updateField('maxHotspotSelections', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                placeholder="e.g., 3"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited selections</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hotspot Areas *
                </label>
                <button
                  type="button"
                  onClick={() => updateField('hotspots', [...questionData.hotspots, { x: 0, y: 0, width: 10, height: 10, label: '' }])}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Hotspot</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Define clickable areas on the image (coordinates in percentage)</p>
              <div className="space-y-4">
                {questionData.hotspots.map((hotspot, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Hotspot {index + 1}</h4>
                      {questionData.hotspots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newHotspots = questionData.hotspots.filter((_, i) => i !== index);
                            updateField('hotspots', newHotspots);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">X (%)</label>
                        <input
                          type="number"
                          value={hotspot.x}
                          onChange={(e) => {
                            const newHotspots = [...questionData.hotspots];
                            newHotspots[index].x = parseFloat(e.target.value) || 0;
                            updateField('hotspots', newHotspots);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Y (%)</label>
                        <input
                          type="number"
                          value={hotspot.y}
                          onChange={(e) => {
                            const newHotspots = [...questionData.hotspots];
                            newHotspots[index].y = parseFloat(e.target.value) || 0;
                            updateField('hotspots', newHotspots);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Width (%)</label>
                        <input
                          type="number"
                          value={hotspot.width}
                          onChange={(e) => {
                            const newHotspots = [...questionData.hotspots];
                            newHotspots[index].width = parseFloat(e.target.value) || 0;
                            updateField('hotspots', newHotspots);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Height (%)</label>
                        <input
                          type="number"
                          value={hotspot.height}
                          onChange={(e) => {
                            const newHotspots = [...questionData.hotspots];
                            newHotspots[index].height = parseFloat(e.target.value) || 0;
                            updateField('hotspots', newHotspots);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Label (Optional)</label>
                      <input
                        type="text"
                        value={hotspot.label}
                        onChange={(e) => {
                          const newHotspots = [...questionData.hotspots];
                          newHotspots[index].label = e.target.value;
                          updateField('hotspots', newHotspots);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Heart, Liver"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assign to Exam */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Assign to Exam (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save time by adding this question directly to an exam. You can also add it later from the Exam Builder.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Don't assign to any exam --</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} ({exam.questions?.length || 0} questions)
                  </option>
                ))}
              </select>
              {selectedExam && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ This question will be added to the selected exam after saving
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : (isEdit ? 'Update Question' : 'Create Question')}</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

export default CreateQuestion;
