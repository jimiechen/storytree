import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 响应类型
export interface ApiResponse<T = unknown> {
  result: {
    code: number;
    message: string;
    data?: T;
  };
}

// API 错误码
export enum ApiErrorCode {
  SUCCESS = 10200,
  BAD_REQUEST = 10400,
  UNAUTHORIZED = 10401,
  FORBIDDEN = 10403,
  NOT_FOUND = 10404,
  SERVER_ERROR = 10500,
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { result } = response.data;
    
    // 统一处理错误
    if (result.code !== ApiErrorCode.SUCCESS) {
      return Promise.reject(new Error(result.message));
    }
    
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response) {
      const { result } = error.response.data;
      
      // 处理 401 未授权
      if (error.response.status === 401 || result?.code === ApiErrorCode.UNAUTHORIZED) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(new Error(result?.message || '请求失败'));
    }
    
    return Promise.reject(new Error('网络错误'));
  }
);

// 封装请求方法
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data.result.data as T),
  
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data.result.data as T),
  
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data.result.data as T),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data.result.data as T),
};

export default apiClient;
