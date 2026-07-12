import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // Required: backend uses HTTP-only cookies for JWT
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: on 401, clear auth state and redirect to /auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the Zustand auth store
      useAuthStore.getState().clearAuth();
      // Redirect to auth page
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
