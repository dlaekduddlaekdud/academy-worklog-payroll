"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  upsertPayrollSummary,
  getPayrollOverviews,
} from "@/lib/services/payroll";
import type { PayrollOverview } from "@/types";
import type { ActionResult } from "@/app/(worker)/worker/work-logs/actions";

// 관리자 권한 확인 + user_id 반환
async function getAdminUserId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
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

// 정산 집계 (draft 상태로 upsert)
export async function calculatePayroll(
  workerId: string,
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await getAdminUserId(supabase);

    // 이미 확정된 월은 재집계 불가 (status를 draft로 덮어쓰지 않도록 사전 차단)
    const { data: existing } = await supabase
      .from("payroll_summaries")
      .select("status")
      .eq("worker_id", workerId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (existing?.status === "finalized") {
      return { success: false, error: "이미 확정된 월은 재집계할 수 없습니다." };
    }

    await upsertPayrollSummary(supabase, workerId, year, month);

    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 정산 확정 (draft → finalized)
export async function finalizePayroll(
  workerId: string,
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const adminId = await getAdminUserId(supabase);

    // 대기 중인 근무 기록이 있으면 확정 불가
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;


    const { data: pendingLogs } = await supabase
      .from("work_logs")
      .select("id")
      .eq("worker_id", workerId)
      .eq("status", "pending")
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (pendingLogs && pendingLogs.length > 0) {
      return {
        success: false,
        error: `대기 중인 근무 기록 ${pendingLogs.length}건이 있습니다. 모두 처리 후 확정해주세요.`,
      };
    }

    // 정산 집계 후 finalized로 변경
    await upsertPayrollSummary(supabase, workerId, year, month);

    const { error } = await supabase
      .from("payroll_summaries")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("worker_id", workerId)
      .eq("year", year)
      .eq("month", month);

    if (error) return { success: false, error: "정산 확정에 실패했습니다." };

    revalidatePath("/admin/payroll");
    revalidatePath("/worker/payroll");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 일괄 확정
export async function bulkFinalizePayroll(
  workerIds: string[],
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const adminId = await getAdminUserId(supabase);

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    // 각 근무자별 pending 체크 + 집계
    const failedIds: string[] = [];
    const successIds: string[] = [];

    for (const workerId of workerIds) {
      // pending 기록이 있으면 해당 근무자는 건너뜀
      const { data: pendingLogs } = await supabase
        .from("work_logs")
        .select("id")
        .eq("worker_id", workerId)
        .eq("status", "pending")
        .gte("work_date", startDate)
        .lte("work_date", endDate);

      if (pendingLogs && pendingLogs.length > 0) {
        failedIds.push(workerId);
        continue;
      }

      try {
        await upsertPayrollSummary(supabase, workerId, year, month);
        successIds.push(workerId);
      } catch {
        failedIds.push(workerId);
      }
    }

    if (successIds.length === 0) {
      return { success: false, error: "확정 가능한 근무자가 없습니다. 대기 중인 기록을 먼저 처리해주세요." };
    }

    // 집계에 성공한 근무자만 finalized 처리
    const { error } = await supabase
      .from("payroll_summaries")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .in("worker_id", successIds)
      .eq("year", year)
      .eq("month", month);

    if (error) return { success: false, error: "일괄 확정에 실패했습니다." };

    revalidatePath("/admin/payroll");
    revalidatePath("/worker/payroll");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 확정 취소 (finalized → draft)
export async function unfinalizePayroll(
  workerId: string,
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await getAdminUserId(supabase);

    const { error } = await supabase
      .from("payroll_summaries")
      .update({
        status: "draft",
        finalized_at: null,
        finalized_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("worker_id", workerId)
      .eq("year", year)
      .eq("month", month);

    if (error) return { success: false, error: "확정 취소에 실패했습니다." };

    revalidatePath("/admin/payroll");
    revalidatePath("/worker/payroll");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 전체 정산 개요 조회
export async function getPayrollOverviewsAction(
  year: number,
  month: number
): Promise<PayrollOverview[]> {
  const supabase = await createClient();
  await getAdminUserId(supabase);

  return getPayrollOverviews(supabase, year, month);
}
