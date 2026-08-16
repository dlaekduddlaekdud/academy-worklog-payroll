import type { WorkLog, WorkLogRow } from "@/types";

/** work_logs 행을 앱 도메인 타입으로 변환. worker/admin 양쪽에서 쓴다. */
export function toWorkLog(row: WorkLogRow): WorkLog {
  return {
    id: row.id,
    workerId: row.worker_id,
    workDate: row.work_date,
    // DB에는 "HH:mm:ss" 형식이므로 "HH:mm"만 추출
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    durationHours: row.duration_hours,
    roleType: row.role_type,
    memo: row.memo,
    status: row.status,
    appliedHourlyRate: row.applied_hourly_rate,
    calculatedPay: row.calculated_pay,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    updatedAt: row.updated_at,
  };
}
