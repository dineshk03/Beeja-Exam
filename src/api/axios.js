import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for authentication errors, not business logic errors
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    // For 403, check if it's an auth error or business logic error
    else if (error.response?.status === 403) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || '';
      
      // Don't redirect for these business logic errors:
      // 1. Max attempts reached
      // 2. Inactive/deactivated account (should show message on login page)
      // 3. Any error with details object
      if (errorData?.details || 
          errorMessage.includes('attempt') || 
          errorMessage.includes('deactivated') ||
          errorMessage.includes('inactive')) {
        // Let the component handle it
        return Promise.reject(error);
      }
      
      // For other 403 errors (permission denied), redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
