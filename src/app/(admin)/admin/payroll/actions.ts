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

    // 이미 확정된 월은 재집계 불가
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

// 정산 확정 — 검사·집계·확정을 단일 트랜잭션으로 처리 (migration 009)
export async function finalizePayroll(
  workerId: string,
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await getAdminUserId(supabase);

    const { error } = await supabase.rpc("finalize_payroll", {
      p_worker_id: workerId,
      p_year: year,
      p_month: month,
    });

    // 함수가 RAISE EXCEPTION으로 던진 사유(대기 기록 존재 등)를 그대로 전달한다
    if (error) {
      return {
        success: false,
        error: error.message || "정산 확정에 실패했습니다.",
      };
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/worker/payroll");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 일괄 확정 — 근무자별로 RPC를 호출한다.
// 한 근무자의 실패가 나머지를 막지 않아야 한다는 요구사항이므로,
// 전체를 하나의 트랜잭션으로 묶지 않고 개별 트랜잭션을 반복한다.
export async function bulkFinalizePayroll(
  workerIds: string[],
  year: number,
  month: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await getAdminUserId(supabase);

    let successCount = 0;
    const failed: string[] = [];

    for (const workerId of workerIds) {
      const { error } = await supabase.rpc("finalize_payroll", {
        p_worker_id: workerId,
        p_year: year,
        p_month: month,
      });

      if (error) {
        failed.push(workerId);
      } else {
        successCount += 1;
      }
    }

    if (successCount === 0) {
      return {
        success: false,
        error:
          "확정 가능한 근무자가 없습니다. 대기 중인 기록을 먼저 처리해주세요.",
      };
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/worker/payroll");

    if (failed.length > 0) {
      return {
        success: true,
        error: `${successCount}명 확정 완료, ${failed.length}명은 대기 중인 기록이 있어 건너뛰었습니다.`,
      };
    }

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