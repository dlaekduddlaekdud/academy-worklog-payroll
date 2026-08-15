"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveHourlyRate } from "@/lib/services/hourly-rate";
import {
  calculateDurationHours,
  calculatePay,
} from "@/lib/utils/pay-calculator";
import type { WorkLogFormValues } from "@/lib/validations/work-log";
import type { WorkLog, WorkLogFilter, WorkLogMonthlySummary, WorkLogRow } from "@/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// DB Row를 앱 레이어 타입으로 변환
function toWorkLog(row: {
  id: string;
  worker_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  role_type: "assistant" | "coaching";
  memo: string | null;
  status: "pending" | "approved" | "rejected";
  applied_hourly_rate: number;
  calculated_pay: number;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  updated_at: string;
}): WorkLog {
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

// 해당 월이 확정된 상태인지 확인 — 확정이면 에러를 throw
async function assertNotFinalized(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workerId: string,
  workDate: string
): Promise<void> {
  const date = new Date(workDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const { data } = await supabase
    .from("payroll_summaries")
    .select("status")
    .eq("worker_id", workerId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (data?.status === "finalized") {
    throw new Error(`${year}년 ${month}월은 이미 확정된 월입니다`);
  }
}

// 근무 기록 생성
export async function createWorkLog(
  data: WorkLogFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const userId = user.id;

    // 확정 월 보호
    await assertNotFinalized(supabase, userId, data.workDate);

    // 유효 시급 조회
    const rate = await getEffectiveHourlyRate(
      supabase,
      userId,
      data.roleType,
      data.workDate
    );
    if (rate === null) {
      return {
        success: false,
        error: "해당 날짜에 유효한 시급이 설정되지 않았습니다. 관리자에게 문의하세요.",
      };
    }

    const durationHours = calculateDurationHours(data.startTime, data.endTime);
    const calculatedPay = calculatePay(durationHours, rate);

    const { error } = await supabase.from("work_logs").insert({
      worker_id: userId,
      work_date: data.workDate,
      start_time: data.startTime,
      end_time: data.endTime,
      duration_hours: durationHours,
      role_type: data.roleType,
      memo: data.memo ?? null,
      status: "pending",
      applied_hourly_rate: rate,
      calculated_pay: calculatedPay,
      submitted_at: new Date().toISOString(),
    });

    if (error) return { success: false, error: "근무 기록 저장에 실패했습니다." };

    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 근무 기록 수정 (pending/rejected만 가능, 수정 시 pending으로 복귀)
export async function updateWorkLog(
  id: string,
  data: WorkLogFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const userId = user.id;

    const { data: existing, error: fetchError } = await supabase
      .from("work_logs")
      .select("status, worker_id, work_date")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "근무 기록을 찾을 수 없습니다." };
    }

    if (existing.worker_id !== userId) {
      return { success: false, error: "본인의 근무 기록만 수정할 수 있습니다." };
    }

    // 승인된 기록은 수정 불가 — 승인의 의미를 지키기 위해 관리자의 승인 취소를 거친다
    if (existing.status === "approved") {
      return {
        success: false,
        error: "승인된 기록은 수정할 수 없습니다. 관리자에게 승인 취소를 요청하세요.",
      };
    }

    // 확정 월 보호 — 날짜를 다른 달로 옮기는 경우 양쪽 월 모두 검사
    await assertNotFinalized(supabase, userId, existing.work_date);
    await assertNotFinalized(supabase, userId, data.workDate);

    // 시급 재계산 (변경된 날짜/역할 기준)
    const rate = await getEffectiveHourlyRate(
      supabase,
      userId,
      data.roleType,
      data.workDate
    );
    if (rate === null) {
      return {
        success: false,
        error: "해당 날짜에 유효한 시급이 설정되지 않았습니다.",
      };
    }

    const durationHours = calculateDurationHours(data.startTime, data.endTime);
    const calculatedPay = calculatePay(durationHours, rate);

    const { data: updated, error } = await supabase
      .from("work_logs")
      .update({
        work_date: data.workDate,
        start_time: data.startTime,
        end_time: data.endTime,
        duration_hours: durationHours,
        role_type: data.roleType,
        memo: data.memo ?? null,
        applied_hourly_rate: rate,
        calculated_pay: calculatedPay,
        // 수정된 기록은 재검토 대상이므로 pending으로 복귀하고 심사 흔적을 지운다
        status: "pending",
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");

    if (error) return { success: false, error: "근무 기록 수정에 실패했습니다." };

    // RLS가 막으면 supabase는 에러 없이 0행을 반환한다.
    // 이 검사가 없으면 아무것도 저장되지 않은 채 "수정 완료"가 표시된다.
    if (!updated || updated.length === 0) {
      return {
        success: false,
        error: "수정 권한이 없거나 이미 처리된 기록입니다.",
      };
    }

    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}


// 근무자 본인의 근무 기록 목록 조회
export async function getMyWorkLogs(filter: WorkLogFilter): Promise<WorkLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("work_logs")
    .select("*")
    .eq("worker_id", user.id)
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (filter.year && filter.month) {
    const startDate = `${filter.year}-${String(filter.month).padStart(2, "0")}-01`;
    const lastDay = new Date(filter.year, filter.month, 0).getDate();
    const endDate = `${filter.year}-${String(filter.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    query = query.gte("work_date", startDate).lte("work_date", endDate);
  }

  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as WorkLogRow[]).map(toWorkLog);
}
// 근무 기록 삭제 (pending/rejected만 가능)
export async function deleteWorkLog(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const userId = user.id;

    const { data: existing, error: fetchError } = await supabase
      .from("work_logs")
      .select("status, worker_id, work_date")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "근무 기록을 찾을 수 없습니다." };
    }

    if (existing.worker_id !== userId) {
      return { success: false, error: "본인의 근무 기록만 삭제할 수 있습니다." };
    }

    if (existing.status === "approved") {
      return {
        success: false,
        error: "승인된 기록은 삭제할 수 없습니다. 관리자에게 승인 취소를 요청하세요.",
      };
    }

    await assertNotFinalized(supabase, userId, existing.work_date);

    const { data: deleted, error } = await supabase
      .from("work_logs")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) return { success: false, error: "근무 기록 삭제에 실패했습니다." };

    if (!deleted || deleted.length === 0) {
      return {
        success: false,
        error: "삭제 권한이 없거나 이미 처리된 기록입니다.",
      };
    }

    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 이번 달 근무 기록 요약 조회
export async function getMyMonthlySummary(
  year: number,
  month: number
): Promise<WorkLogMonthlySummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;


  const { data, error } = await supabase
    .from("work_logs")
    .select("status, duration_hours, calculated_pay")
    .eq("worker_id", user.id)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (error || !data) {
    return {
      totalCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      totalDurationHours: 0,
      totalCalculatedPay: 0,
    };
  }

  const approved = data.filter((l) => l.status === "approved");
  return {
    totalCount: data.length,
    approvedCount: approved.length,
    pendingCount: data.filter((l) => l.status === "pending").length,
    rejectedCount: data.filter((l) => l.status === "rejected").length,
    totalDurationHours:
      Math.round(
        approved.reduce((sum, l) => sum + l.duration_hours, 0) * 100
      ) / 100,
    totalCalculatedPay: approved.reduce(
      (sum, l) => sum + l.calculated_pay,
      0
    ),
  };
}
