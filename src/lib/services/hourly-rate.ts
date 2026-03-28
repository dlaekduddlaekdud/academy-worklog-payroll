import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, HourlyRateRow } from "@/types/database";
import type { HourlyRate, RoleType } from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;

// work_date 기준으로 해당 역할의 유효 시급 조회
// effective_from이 work_date 이하인 것 중 가장 최근 레코드 반환
export async function getEffectiveHourlyRate(
  supabase: TypedSupabaseClient,
  workerId: string,
  roleType: RoleType,
  workDate: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("hourly_rates")
    .select("rate")
    .eq("worker_id", workerId)
    .eq("role_type", roleType)
    .lte("effective_from", workDate)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.rate;
}

// DB Row를 앱 레이어 타입으로 변환
function toHourlyRate(row: Database["public"]["Tables"]["hourly_rates"]["Row"]): HourlyRate {
  return {
    id: row.id,
    workerId: row.worker_id,
    roleType: row.role_type,
    rate: row.rate,
    effectiveFrom: row.effective_from,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// 근무자의 전체 시급 이력 조회 (최신순)
export async function getHourlyRateHistory(
  supabase: TypedSupabaseClient,
  workerId: string
): Promise<HourlyRate[]> {
  const { data, error } = await supabase
    .from("hourly_rates")
    .select("*")
    .eq("worker_id", workerId)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as HourlyRateRow[]).map(toHourlyRate);
}
