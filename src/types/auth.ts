// 사용자 역할 타입
export type Role = "admin" | "worker";

// 앱 레이어에서 사용하는 사용자 프로필 (camelCase)
export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 근무자 목록 조회 시 사용하는 간략 정보
export interface WorkerSummary {
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
}

// JWT claims에서 추출한 인증 정보
export interface AuthClaims {
  sub: string;
  email: string;
  role: Role;
}
