import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  UserPlus, 
  Edit, 
  AlertCircle, 
  CheckCircle,
  Shield,
  Users
} from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function CreateUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    batch: '',
    isActive: true,
    permissions: {}
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [batches, setBatches] = useState([]);
  const [permissionsTemplate, setPermissionsTemplate] = useState({});
  const [showPermissions, setShowPermissions] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/${id}`);
      if (response.data) {
        const user = response.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '', // Don't populate password for security
          role: user.role || 'student',
          studentId: user.studentId || '',
          batch: user.batch || '',
          isActive: user.isActive !== undefined ? user.isActive : true,
          permissions: user.permissions || {}
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      showNotification('Failed to load user details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches');
      setBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      // Fallback to admin batches
      try {
        const fallbackResponse = await api.get('/admin/batches');
        setBatches(fallbackResponse.data);
      } catch (fallbackError) {
        console.error('Error fetching batches from fallback:', fallbackError);
      }
    }
  };

  const fetchPermissionsTemplate = async () => {
    try {
      const response = await api.get('/admin/permissions-template');
      setPermissionsTemplate(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions template:', error);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
    fetchBatches();
    fetchPermissionsTemplate();
  }, [isEdit, fetchUser]);

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
      showNotification('Please fix errors in form', 'error');
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        studentId: formData.studentId,
        batch: formData.batch,
        isActive: formData.isActive
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      // Include permissions for admin users
      if (formData.role === 'admin') {
        submitData.permissions = formData.permissions;
      }

      if (isEdit) {
        await api.put(`/admin/users/${id}`, submitData);
        showNotification('User updated successfully!', 'success');
      } else {
        await api.post('/admin/users', submitData);
        showNotification('User created successfully!', 'success');
      }
      
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} user:`, error);
      showNotification(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} user`, 'error');
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

  const handlePermissionChange = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module]?.[action]
        }
      }
    }));
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
          onClick={() => navigate('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to User Management
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
                  {isEdit ? 'Edit User' : 'Add New User'}
                </h1>
                <p className={`${isEdit ? 'text-green-100' : 'text-blue-100'} mt-1`}>
                  {isEdit ? 'Update user account details' : 'Create a new user account'}
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

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Select the user role and access level
                </p>
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
                  Unique identifier for student
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
                    <option key={batch._id || batch} value={batch.name || batch}>
                      {batch.name || batch} {batch.year && `(${batch.year})`} {batch.department && `- ${batch.department}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Group users by batch for easier management
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Status
                </label>
                <div className="flex items-center space-x-4 mt-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.isActive === true}
                      onChange={() => updateField('isActive', true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.isActive === false}
                      onChange={() => updateField('isActive', false)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Inactive users cannot login to the system
                </p>
              </div>
            </div>

            {/* Permissions Section for Admin */}
            {formData.role === 'admin' && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Admin Permissions</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure what this admin user can access and manage
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{showPermissions ? 'Hide' : 'Show'} Permissions</span>
                  </button>
                </div>

                {showPermissions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
                    {Object.entries(permissionsTemplate).map(([module, actions]) => (
                      <div key={module} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3 capitalize">
                          {module.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(actions).map(([action]) => (
                            <label key={action} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions[module]?.[action] || false}
                                onChange={() => handlePermissionChange(module, action)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {action}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-5">
              <div className="flex items-start">
                <div className="bg-blue-500 p-2 rounded-lg">
                  {formData.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-white" />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 mb-1.5">
                    {formData.role === 'admin' ? 'Admin Account' : 'Student Account'} Information
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {formData.role === 'admin' 
                      ? 'The admin will have access to the admin panel with configured permissions. They can manage exams, questions, users, and other system features based on their permissions.'
                      : 'The student will be able to login using their email and password. They will have access to assigned exams and can view their results.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
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
                    ? (isEdit ? 'Updating User...' : 'Creating User...') 
                    : (isEdit ? 'Update User' : 'Create User')
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

export default CreateUser;
