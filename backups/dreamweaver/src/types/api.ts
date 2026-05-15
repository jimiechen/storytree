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

// 用户类型
export interface User {
  userId: string;
  email: string;
  username: string;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  currentWordCount: number;
  targetWordCount: number;
  status: 'draft' | 'writing' | 'completed';
  chapters?: Chapter[];
  createdAt: string;
}

// 章节类型
export interface Chapter {
  id: string;
  title: string;
  content?: string;
  order: number;
  wordCount: number;
  status: 'draft' | 'revised' | 'final';
  updatedAt?: string;
}
