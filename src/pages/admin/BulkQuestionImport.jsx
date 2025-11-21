import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Download, Plus, Trash2, Save } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function BulkQuestionImport() {
  const navigate = useNavigate();
  const [importMethod, setImportMethod] = useState('form'); // 'form', 'csv', 'json'
  const [questions, setQuestions] = useState([
    {
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      category: '',
      points: 5,
      difficulty: 'medium'
    }
  ]);
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);

  React.useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      category: '',
      points: 5,
      difficulty: 'medium'
    }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (type === 'csv') {
        setCsvData(content);
        setCsvFile(file);
      } else if (type === 'json') {
        setJsonData(content);
        setJsonFile(file);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    setImporting(true);
    try {
      let questionsToImport = [];

      if (importMethod === 'form') {
        questionsToImport = questions.filter(q => q.question.trim() !== '');
      } else if (importMethod === 'csv') {
        questionsToImport = parseCSV(csvData);
      } else if (importMethod === 'json') {
        questionsToImport = JSON.parse(jsonData);
      }

      if (questionsToImport.length === 0) {
        alert('No valid questions to import');
        return;
      }

      // Import all questions
      const responses = await Promise.all(
        questionsToImport.map(q => api.post('/admin/questions', q))
      );

      const createdQuestionIds = responses.map(res => res.data._id);

      // If exam selected, assign all questions to exam using bulk endpoint
      if (selectedExam) {
        await api.post(`/admin/exams/${selectedExam}/questions/bulk`, {
          questionIds: createdQuestionIds
        });
        alert(`Successfully imported ${questionsToImport.length} questions and assigned to exam!`);
      } else {
        alert(`Successfully imported ${questionsToImport.length} questions!`);
      }
      
      navigate('/admin/questions');
    } catch (error) {
      console.error('Failed to import questions:', error);
      alert('Failed to import some questions. Please check the format.');
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 7) {
        questions.push({
          type: parts[0].trim(),
          question: parts[1].trim(),
          options: parts[2].split('|').map(o => o.trim()),
          correctAnswer: parseInt(parts[3]),
          category: parts[4].trim(),
          points: parseInt(parts[5]),
          difficulty: parts[6].trim()
        });
      }
    }
    return questions;
  };

  const downloadTemplate = (format) => {
    if (format === 'csv') {
      const csv = `type,question,options,correctAnswer,category,points,difficulty
multiple-choice,What is 2+2?,1|2|3|4,3,Math,5,easy
single-choice,Is the sky blue?,Yes|No,0,General,5,easy`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_template.csv';
      a.click();
    } else if (format === 'json') {
      const json = JSON.stringify([
        {
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['1', '2', '3', '4'],
          correctAnswer: 3,
          category: 'Math',
          points: 5,
          difficulty: 'easy'
        },
        {
          type: 'single-choice',
          question: 'Is the sky blue?',
          options: ['Yes', 'No'],
          correctAnswer: 0,
          category: 'General',
          points: 5,
          difficulty: 'easy'
        }
      ], null, 2);
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_template.json';
      a.click();
    }
  };

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
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Questions</h1>
        <p className="text-gray-600">Add multiple questions at once using different methods</p>
      </div>

      {/* Import Method Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Import Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setImportMethod('form')}
            className={`p-6 border-2 rounded-lg transition-all ${
              importMethod === 'form'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold text-gray-900 mb-1">Manual Entry</h3>
            <p className="text-sm text-gray-600">Enter questions one by one in a form</p>
          </button>
          
          <button
            onClick={() => setImportMethod('csv')}
            className={`p-6 border-2 rounded-lg transition-all ${
              importMethod === 'csv'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-gray-900 mb-1">CSV Import</h3>
            <p className="text-sm text-gray-600">Upload questions from CSV file</p>
          </button>
          
          <button
            onClick={() => setImportMethod('json')}
            className={`p-6 border-2 rounded-lg transition-all ${
              importMethod === 'json'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold text-gray-900 mb-1">JSON Import</h3>
            <p className="text-sm text-gray-600">Import from JSON format</p>
          </button>
        </div>
      </div>

      {/* Manual Entry Form */}
      {importMethod === 'form' && (
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="single-choice">Single Choice</option>
                    <option value="multiple-answer">Multiple Answer</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="match-following">Match Following</option>
                    <option value="code-test">Code Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={q.category}
                    onChange={(e) => updateQuestion(qIndex, 'category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Math, Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={q.difficulty}
                    onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              {(q.type === 'multiple-choice' || q.type === 'single-choice') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Another Question
          </button>
        </div>
      )}

      {/* CSV Import */}
      {importMethod === 'csv' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">CSV Import</h2>
            <button
              onClick={() => downloadTemplate('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Format Example
            </label>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              type,question,options,correctAnswer,category,points,difficulty<br/>
              multiple-choice,What is 2+2?,1|2|3|4,3,Math,5,easy
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Option 1: Upload CSV File
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">
                    {csvFile ? csvFile.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  className="hidden"
                />
              </label>
              {csvFile && (
                <button
                  onClick={() => {
                    setCsvFile(null);
                    setCsvData('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Manual Paste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Option 2: Paste CSV Data
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows="10"
              placeholder="Or paste your CSV data here..."
            />
          </div>
        </div>
      )}

      {/* JSON Import */}
      {importMethod === 'json' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">JSON Import</h2>
            <button
              onClick={() => downloadTemplate('json')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Option 1: Upload JSON File
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">
                    {jsonFile ? jsonFile.name : 'Click to upload JSON file'}
                  </p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'json')}
                  className="hidden"
                />
              </label>
              {jsonFile && (
                <button
                  onClick={() => {
                    setJsonFile(null);
                    setJsonData('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Manual Paste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Option 2: Paste JSON Data
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows="15"
              placeholder='Or paste your JSON data here...'
            />
          </div>
        </div>
      )}

      {/* Assign to Exam */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Assign to Exam (Optional)</h2>
        <p className="text-sm text-gray-600 mb-4">
          All imported questions will be added to the selected exam
        </p>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Don't assign to any exam --</option>
          {exams.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.title} ({exam.questions?.length || 0} questions)
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4 mt-6">
        <button
          onClick={() => navigate('/admin/questions')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleBulkImport}
          disabled={importing}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          <Save className="w-5 h-5" />
          <span>{importing ? 'Importing...' : 'Import Questions'}</span>
        </button>
      </div>
    </AdminLayout>
  );
}

export default BulkQuestionImport;
