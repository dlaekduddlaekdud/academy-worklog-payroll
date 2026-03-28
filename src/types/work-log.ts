// 역할 타입 — 조교(assistant) / 코칭(coaching)
// ROADMAP의 work_type과 동일 개념, 실제 DB 컬럼명은 role_type
export type RoleType = "assistant" | "coaching";

// 근무 기록 상태
export type WorkLogStatus = "pending" | "approved" | "rejected";

// 앱 레이어에서 사용하는 근무 기록 (camelCase)
export interface WorkLog {
  id: string;
  workerId: string;
  workDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  durationHours: number; // 소수점 포함 (예: 1.5 = 90분)
  roleType: RoleType;
  memo: string | null;
  status: WorkLogStatus;
  // 제출 시점의 시급을 스냅샷으로 저장 — 이후 시급 변경 영향 없음
  appliedHourlyRate: number;
  calculatedPay: number;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  updatedAt: string;
}

// 근무자가 근무 기록을 새로 제출할 때 사용하는 입력 타입
export interface CreateWorkLogInput {
  workDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  roleType: RoleType;
  memo?: string;
}

// 관리자가 근무 기록을 승인/반려할 때 사용하는 입력 타입
export interface ReviewWorkLogInput {
  action: "approved" | "rejected";
  rejectionReason?: string; // rejected일 때 필수
}

// 근무 기록 목록 조회 시 사용하는 필터 조건
export interface WorkLogFilter {
  workerId?: string;
  year?: number;
  month?: number;
  status?: WorkLogStatus;
}

// 월별 근무 기록 집계 (페이지 상단 요약 카드용)
export interface WorkLogMonthlySummary {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalDurationHours: number;
  totalCalculatedPay: number;
}
