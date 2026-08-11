import axios from 'axios';

// Create a pre-configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request Interceptor: Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handler (e.g. handle 401 unauthorized errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be expired or invalid - clear session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

/*
========================================================================
HOW TO CONNECT THE SPRING BOOT BACKEND API:
========================================================================

Once your Spring Boot backend endpoints are ready, simply update the AuthContext.jsx 
handlers as follows:

1. Import this api service:
   import api from '../services/api';

2. In AuthContext.jsx -> login():
   const login = async (email, password) => {
     try {
       const response = await api.post('/auth/login', { email, password });
       const { token, user } = response.data; // Ensure backend returns token & user details
       
       localStorage.setItem('token', token);
       localStorage.setItem('user', JSON.stringify(user));
       
       setToken(token);
       setUser(user);
       return user;
     } catch (error) {
       throw new Error(error.response?.data?.message || 'Login failed');
     }
   };

3. In AuthContext.jsx -> register():
   const register = async (name, email, phone, password) => {
     try {
       const response = await api.post('/auth/register', { name, email, phone, password });
       return {
         success: true,
         message: response.data.message || 'Registration successful!'
       };
     } catch (error) {
       throw new Error(error.response?.data?.message || 'Registration failed');
     }
   };
*/

export default api;
