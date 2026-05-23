import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Đảm bảo backend đang chạy trên port này

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor gắn token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('omnimart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý lỗi 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('omnimart_token');
      localStorage.removeItem('omnimart_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
