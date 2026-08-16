"use server";
import { rethrowIfRedirect } from "@/lib/utils/redirect-error";
import { getMonthRange } from "@/lib/utils/date-range";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkLog, WorkLogFilter, WorkLogRow } from "@/types";
import { toWorkLog } from "@/lib/mappers/work-log";
import type { ActionResult } from "@/app/(worker)/worker/work-logs/actions";

// 관리자 권한 확인 + user_id 반환
async function getAdminUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }

  return user.id;
}

// 해당 월이 확정된 상태인지 확인
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

// 전체 근무 기록 조회 (필터 지원)
export async function getAllWorkLogs(filter: WorkLogFilter): Promise<WorkLog[]> {
  const supabase = await createClient();
  await getAdminUserId(supabase);

  let query = supabase
    .from("work_logs")
    .select("*")
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (filter.workerId) {
    query = query.eq("worker_id", filter.workerId);
  }

  if (filter.year && filter.month) {
    const { startDate, endDate } = getMonthRange(filter.year, filter.month);
    query = query.gte("work_date", startDate).lte("work_date", endDate);
  }

  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as WorkLogRow[]).map(toWorkLog);
}

// 승인 (pending → approved)
export async function approveWorkLog(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const adminId = await getAdminUserId(supabase);

    const { data: workLog, error: fetchError } = await supabase
      .from("work_logs")
      .select("status, worker_id, work_date")
      .eq("id", id)
      .single();

    if (fetchError || !workLog) {
      return { success: false, error: "근무 기록을 찾을 수 없습니다." };
    }

    if (workLog.status !== "pending") {
      return { success: false, error: "대기 중인 기록만 승인할 수 있습니다." };
    }

    const { error } = await supabase
      .from("work_logs")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: null,
      })
      .eq("id", id);

    if (error) return { success: false, error: "승인 처리에 실패했습니다." };

    revalidatePath("/admin/work-logs");
    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 일괄 승인
export async function bulkApproveWorkLogs(ids: string[]): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const adminId = await getAdminUserId(supabase);

    const { error } = await supabase
      .from("work_logs")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: null,
      })
      .in("id", ids)
      .eq("status", "pending"); // pending만 처리

    if (error) return { success: false, error: "일괄 승인에 실패했습니다." };

    revalidatePath("/admin/work-logs");
    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 반려 (pending → rejected), reason 필수
export async function rejectWorkLog(id: string, reason: string): Promise<ActionResult> {
  try {
    if (!reason.trim()) {
      return { success: false, error: "반려 사유를 입력해주세요." };
    }

    const supabase = await createClient();
    const adminId = await getAdminUserId(supabase);

    const { data: workLog, error: fetchError } = await supabase
      .from("work_logs")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !workLog) {
      return { success: false, error: "근무 기록을 찾을 수 없습니다." };
    }

    if (workLog.status !== "pending") {
      return { success: false, error: "대기 중인 기록만 반려할 수 있습니다." };
    }

    const { error } = await supabase
      .from("work_logs")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: reason,
      })
      .eq("id", id);

    if (error) return { success: false, error: "반려 처리에 실패했습니다." };

    revalidatePath("/admin/work-logs");
    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 승인 취소 (approved → pending), finalized 월 차단
export async function undoApproveWorkLog(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    // 반환값은 쓰지 않지만 관리자 권한 검사를 겸하므로 호출은 유지한다.
    await getAdminUserId(supabase);

    const { data: workLog, error: fetchError } = await supabase
      .from("work_logs")
      .select("status, worker_id, work_date")
      .eq("id", id)
      .single();

    if (fetchError || !workLog) {
      return { success: false, error: "근무 기록을 찾을 수 없습니다." };
    }

    if (workLog.status !== "approved") {
      return { success: false, error: "승인된 기록만 취소할 수 있습니다." };
    }

    // 확정 월 보호
    await assertNotFinalized(supabase, workLog.worker_id, workLog.work_date);

    // 승인 취소는 심사 이전 상태로 되돌리는 것이므로 심사 흔적도 함께 지운다.
    // reviewed_at을 남기면 "심사되지 않았는데 심사 시각은 있는" 모순이 생긴다.
    const { data: updated, error } = await supabase
      .from("work_logs")
      .update({
        status: "pending",
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
      })
      .eq("id", id)
      .select("id");

    if (error) return { success: false, error: "승인 취소에 실패했습니다." };
    if (!updated || updated.length === 0) {
      return { success: false, error: "권한이 없거나 이미 처리된 기록입니다." };
    }

    revalidatePath("/admin/work-logs");
    revalidatePath("/worker/work-logs");
    revalidatePath("/worker/dashboard");
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}
