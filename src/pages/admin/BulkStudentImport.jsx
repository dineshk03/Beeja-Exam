import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Download, Plus, Trash2, Save, Users } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function BulkStudentImport() {
  const navigate = useNavigate();
  const [importMethod, setImportMethod] = useState('form'); // 'form', 'csv', 'json'
  const [students, setStudents] = useState([
    {
      name: '',
      email: '',
      password: '',
      studentId: '',
      batch: ''
    }
  ]);
  const [batches, setBatches] = useState([]);

  React.useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/admin/batches');
      setBatches(response.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const addStudent = () => {
    setStudents([...students, {
      name: '',
      email: '',
      password: '',
      studentId: '',
      batch: ''
    }]);
  };

  const removeStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index, field, value) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
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
      let studentsToImport = [];

      if (importMethod === 'form') {
        studentsToImport = students.filter(s => s.name.trim() !== '' && s.email.trim() !== '');
      } else if (importMethod === 'csv') {
        studentsToImport = parseCSV(csvData);
      } else if (importMethod === 'json') {
        studentsToImport = JSON.parse(jsonData);
      }

      if (studentsToImport.length === 0) {
        alert('No valid students to import');
        return;
      }

      // Import all students
      const results = await Promise.allSettled(
        studentsToImport.map(student => 
          api.post('/auth/register', {
            ...student,
            role: 'student'
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        alert(`Imported ${successful} students successfully. ${failed} failed (possibly duplicate emails).`);
      } else {
        alert(`Successfully imported ${successful} students!`);
      }
      
      navigate('/admin/students');
    } catch (error) {
      console.error('Failed to import students:', error);
      alert('Failed to import students. Please check the format.');
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const students = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        students.push({
          name: parts[0].trim(),
          email: parts[1].trim(),
          password: parts[2].trim(),
          studentId: parts[3]?.trim() || '',
          batch: parts[4]?.trim() || ''
        });
      }
    }
    return students;
  };

  const downloadTemplate = (format) => {
    if (format === 'csv') {
      const csv = `name,email,password,studentId,batch
John Doe,john@example.com,password123,STU001,2024-A
Jane Smith,jane@example.com,password123,STU002,2024-A
Bob Johnson,bob@example.com,password123,STU003,2024-B`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_template.csv';
      a.click();
    } else if (format === 'json') {
      const json = JSON.stringify([
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          studentId: 'STU001',
          batch: '2024-A'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          studentId: 'STU002',
          batch: '2024-A'
        }
      ], null, 2);
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_template.json';
      a.click();
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Student Management
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Students</h1>
        <p className="text-gray-600">Add multiple students at once using different methods</p>
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
            <p className="text-sm text-gray-600">Enter students one by one in a form</p>
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
            <p className="text-sm text-gray-600">Upload students from CSV file</p>
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
          {students.map((student, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Student {index + 1}
                </h3>
                {students.length > 1 && (
                  <button
                    onClick={() => removeStudent(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => updateStudent(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    onChange={(e) => updateStudent(index, 'email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={student.password}
                    onChange={(e) => updateStudent(index, 'password', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., password123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={student.studentId}
                    onChange={(e) => updateStudent(index, 'studentId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., STU001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch (Optional)
                  </label>
                  <select
                    value={student.batch}
                    onChange={(e) => updateStudent(index, 'batch', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select Batch --</option>
                    {batches.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addStudent}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Another Student
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
              name,email,password,studentId,batch<br/>
              John Doe,john@example.com,password123,STU001,2024-A
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

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4 mt-6">
        <button
          onClick={() => navigate('/admin/students')}
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
          <span>{importing ? 'Importing...' : 'Import Students'}</span>
        </button>
      </div>
    </AdminLayout>
  );
}

export default BulkStudentImport;
