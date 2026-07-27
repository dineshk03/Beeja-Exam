// API Configuration
const API_BASE_URL = import.meta.env.PROD 
  ? 'http://examportal.com/api'  // Production URL
  : '/api';  // Development URL (proxied by Vite)

export { API_BASE_URL };
