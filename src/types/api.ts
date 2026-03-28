// API 공통 응답 래퍼
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// 페이지네이션이 포함된 목록 응답
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
