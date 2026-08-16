"use server";
import { rethrowIfRedirect } from "@/lib/utils/redirect-error";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHourlyRateHistory } from "@/lib/services/hourly-rate";
import type { HourlyRateFormValues } from "@/lib/validations/hourly-rate";
import type { WorkerSummary, HourlyRate } from "@/types";
import type { ActionResult } from "@/app/(worker)/worker/work-logs/actions";

// 관리자 권한 확인 헬퍼
async function assertAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

// 전체 근무자 목록 조회 (admin만)
export async function getWorkers(): Promise<WorkerSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertAdmin(supabase, user.id);

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, name, email, is_active")
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data.map((p) => ({
    userId: p.user_id,
    name: p.name,
    email: p.email,
    isActive: p.is_active,
  }));
}

// 시급 등록
export async function createHourlyRate(data: HourlyRateFormValues): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await assertAdmin(supabase, user.id);

    const { error } = await supabase.from("hourly_rates").insert({
      worker_id: data.workerId,
      role_type: data.roleType,
      rate: data.rate,
      effective_from: data.effectiveFrom,
      created_by: user.id,
    });

    if (error)
      return {
        success: false,
        error: `시급 등록에 실패했습니다. (${error.code}: ${error.message})`,
      };

    revalidatePath(`/admin/workers/${data.workerId}/rates`);
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 시급 수정
export async function updateHourlyRate(
  id: string,
  data: { rate: number; effectiveFrom: string },
  workerId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await assertAdmin(supabase, user.id);

    const { error } = await supabase
      .from("hourly_rates")
      .update({ rate: data.rate, effective_from: data.effectiveFrom })
      .eq("id", id);

    if (error) return { success: false, error: `수정에 실패했습니다. (${error.message})` };

    revalidatePath(`/admin/workers/${workerId}/rates`);
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 시급 삭제
export async function deleteHourlyRate(id: string, workerId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await assertAdmin(supabase, user.id);

    const { error } = await supabase.from("hourly_rates").delete().eq("id", id);

    if (error) return { success: false, error: `삭제에 실패했습니다. (${error.message})` };

    revalidatePath(`/admin/workers/${workerId}/rates`);
    return { success: true };
  } catch (e) {
    rethrowIfRedirect(e);
    const message = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return { success: false, error: message };
  }
}

// 근무자의 시급 이력 조회
export async function getHourlyRates(workerId: string): Promise<HourlyRate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertAdmin(supabase, user.id);

  return getHourlyRateHistory(supabase, workerId);
}
