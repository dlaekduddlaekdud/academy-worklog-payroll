import type { RoleType } from "./work-log";

// 급여 정산 상태 — draft(초안) / finalized(확정)
// finalized 상태가 되면 해당 월 근무 기록 수정 불가
export type PayrollStatus = "draft" | "finalized";

// 앱 레이어에서 사용하는 시급 정보 (camelCase)
export interface HourlyRate {
  id: string;
  workerId: string;
  roleType: RoleType;
  rate: number; // 원 단위
  // 이 날짜 이후 work_date에 대해 해당 시급 적용
  effectiveFrom: string; // "YYYY-MM-DD"
  createdBy: string;
  createdAt: string;
}

// 관리자가 새 시급을 등록할 때 사용하는 입력 타입
export interface CreateHourlyRateInput {
  workerId: string;
  roleType: RoleType;
  rate: number;
  effectiveFrom: string; // "YYYY-MM-DD"
}

// 앱 레이어에서 사용하는 월별 급여 정산 레코드 (camelCase)
export interface PayrollSummary {
  id: string;
  workerId: string;
  year: number;
  month: number; // 1-12
  totalHours: number; // 소수점 포함
  totalPay: number; // 원 단위
  status: PayrollStatus;
  finalizedAt: string | null;
  finalizedBy: string | null;
}

// 급여 정산 생성/갱신 시 사용하는 입력 타입
export interface UpsertPayrollSummaryInput {
  workerId: string;
  year: number;
  month: number;
}

// 관리자 정산 페이지에서 근무자별 월 급여 현황을 표시할 때 사용
export interface PayrollOverview {
  workerId: string;
  workerName: string;
  year: number;
  month: number;
  totalHours: number;
  totalPay: number;
  status: PayrollStatus;
  approvedLogCount: number;
  pendingLogCount: number;
}
