import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function CreateStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    batch: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [batches, setBatches] = useState([]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students/${id}`);
      if (response.data && response.data.student) {
        const student = response.data.student;
        setFormData({
          name: student.name || '',
          email: student.email || '',
          password: '', // Don't populate password for security
          studentId: student.studentId || '',
          batch: student.batch || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch student:', error);
      showNotification('Failed to load student details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchStudent();
    }
    fetchBatches();
  }, [isEdit, fetchStudent]);

  const fetchBatches = async () => {
    try {
      // Use the proper batch endpoint that returns Batch model data
      const response = await api.get('/batches');
      setBatches(response.data);
      console.log('✅ Fetched batches from /batches:', response.data);
    } catch (error) {
      console.error('Error fetching batches from /batches:', error);
      // Fallback: try the admin endpoints
      try {
        const fallbackResponse = await api.get('/admin/batches');
        const batchObjects = fallbackResponse.data.map(batchName => ({
          _id: batchName,
          name: batchName
        }));
        setBatches(batchObjects);
        console.log('✅ Fetched batches from /admin/batches fallback:', batchObjects);
      } catch (fallbackError) {
        console.error('Error fetching batches from fallback:', fallbackError);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!isEdit && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!isEdit && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEdit && formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        // Update existing student
        const updateData = {
          name: formData.name,
          studentId: formData.studentId,
          batch: formData.batch
        };
        // Only include password if it's been changed
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/admin/students/${id}`, updateData);
        showNotification('Student updated successfully!', 'success');
      } else {
        // Create new student
        await api.post('/auth/register', {
          ...formData,
          role: 'student'
        });
        showNotification('Student created successfully!', 'success');
      }
      setTimeout(() => navigate('/admin/students'), 1500);
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} student:`, error);
      showNotification(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} student`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Student Management
        </button>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${isEdit ? 'from-green-600 to-green-700' : 'from-blue-600 to-blue-700'} px-8 py-6`}>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-lg">
                {isEdit ? (
                  <Edit className="w-8 h-8 text-white" />
                ) : (
                  <UserPlus className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEdit ? 'Edit Student' : 'Add New Student'}
                </h1>
                <p className={`${isEdit ? 'text-green-100' : 'text-blue-100'} mt-1`}>
                  {isEdit ? 'Update student account details' : 'Create a new student account'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., John Doe"
                  required
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., john@example.com"
                  required={!isEdit}
                  disabled={isEdit}
                />
                {errors.email ? (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {isEdit ? 'Email cannot be changed' : 'This will be used for login'}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password {!isEdit && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                  required={!isEdit}
                  minLength={6}
                />
                {errors.password ? (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {isEdit ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                  </p>
                )}
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => updateField('studentId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., STU001"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Unique identifier for the student
                </p>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.batch}
                  onChange={(e) => updateField('batch', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch.name}>
                      {batch.name} {batch.year && `(${batch.year})`} {batch.department && `- ${batch.department}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Group students by batch for easier exam assignment
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-5">
              <div className="flex items-start">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 mb-1.5">Student Account Information</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    The student will be able to login using their email and password. 
                    They will have access to assigned exams and can view their results.
                    The account will be active immediately after creation.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center space-x-2 px-8 py-3 bg-gradient-to-r ${isEdit ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-5 h-5" />
                <span>
                  {saving 
                    ? (isEdit ? 'Updating Student...' : 'Creating Student...') 
                    : (isEdit ? 'Update Student' : 'Create Student')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default CreateStudent;
