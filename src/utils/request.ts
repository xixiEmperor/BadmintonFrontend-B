import axios, { AxiosInstance } from 'axios';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    
    // 统一处理响应
    if (data.code === 200) {
      return data;
    } else {
      // 处理业务错误
      throw new Error(data.message || '请求失败');
    }
  },
  (error) => {
    // 处理 HTTP 错误
    if (error.response?.status === 401) {
      // 未授权，跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;