import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PayrollSummaryRow } from "@/types/database";
import type { PayrollSummary, PayrollOverview } from "@/types";

type TypedSupabaseClient = SupabaseClient<Database>;

// DB Row를 앱 레이어 타입으로 변환
function toPayrollSummary(
  row: Database["public"]["Tables"]["payroll_summaries"]["Row"]
): PayrollSummary {
  return {
    id: row.id,
    workerId: row.worker_id,
    year: row.year,
    month: row.month,
    totalHours: row.total_hours,
    totalPay: row.total_pay,
    status: row.status,
    finalizedAt: row.finalized_at,
    finalizedBy: row.finalized_by,
  };
}

// 해당 월 approved 근무 기록을 집계하여 payroll_summaries UPSERT
// UNIQUE(worker_id, year, month) constraint를 활용한 upsert
export async function upsertPayrollSummary(
  supabase: TypedSupabaseClient,
  workerId: string,
  year: number,
  month: number
): Promise<PayrollSummary> {
  // 해당 월의 approved 근무 기록 집계
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select("duration_hours, calculated_pay")
    .eq("worker_id", workerId)
    .eq("status", "approved")
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (logsError) throw new Error("근무 기록 조회 실패");

  const totalHours =
    Math.round(
      (logs ?? []).reduce((sum, log) => sum + log.duration_hours, 0) * 100
    ) / 100;
  const totalPay = (logs ?? []).reduce(
    (sum, log) => sum + log.calculated_pay,
    0
  );

// UPSERT — 집계값만 갱신한다.
  // status를 함께 넣으면 finalized 요약이 draft로 뒤집히면서
  // finalized_at/finalized_by만 남는 모순 데이터가 생긴다.
  // 신규 행의 status는 DB 기본값(draft), 확정은 finalizePayroll이 전담한다.
  const { data, error } = await supabase
    .from("payroll_summaries")
    .upsert(
      {
        worker_id: workerId,
        year,
        month,
        total_hours: totalHours,
        total_pay: totalPay,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "worker_id,year,month" }
    )
    .select()
    .single();

  if (error || !data) throw new Error("정산 집계 저장 실패");
  return toPayrollSummary(data as PayrollSummaryRow);
}

// 해당 월 전체 근무자의 정산 개요 조회 (근무자 이름 포함)
export async function getPayrollOverviews(
  supabase: TypedSupabaseClient,
  year: number,
  month: number
): Promise<PayrollOverview[]> {
  // 1. 해당 월에 work_log가 있는 근무자 목록 조회
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: workerIds, error: workerError } = await supabase
    .from("work_logs")
    .select("worker_id")
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (workerError) throw new Error("근무 기록 조회 실패");

  const uniqueWorkerIds = [
    ...new Set(
      ((workerIds ?? []) as { worker_id: string }[]).map((r) => r.worker_id)
    ),
  ];
  if (uniqueWorkerIds.length === 0) return [];

  // 2. 근무자 프로필 조회
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, name")
    .in("user_id", uniqueWorkerIds);

  if (profileError) throw new Error("프로필 조회 실패");

  const profileMap = new Map(
    ((profiles ?? []) as { user_id: string; name: string }[]).map((p) => [p.user_id, p.name])
  );

  // 3. 정산 요약 조회
  const { data: summaries, error: summaryError } = await supabase
    .from("payroll_summaries")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .in("worker_id", uniqueWorkerIds);

  if (summaryError) throw new Error("정산 요약 조회 실패");

  const summaryMap = new Map(
    ((summaries ?? []) as PayrollSummaryRow[]).map((s) => [s.worker_id, s])
  );

  // 4. work_logs 집계 (승인/대기 건수)
  const { data: allLogs, error: logsError } = await supabase
    .from("work_logs")
    .select("worker_id, status, duration_hours, calculated_pay")
    .in("worker_id", uniqueWorkerIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (logsError) throw new Error("근무 기록 집계 실패");

  type LogEntry = { worker_id: string; status: string; duration_hours: number; calculated_pay: number };

  // 5. 근무자별 집계
  return uniqueWorkerIds.map((workerId) => {
    const workerLogs = ((allLogs ?? []) as LogEntry[]).filter(
      (l) => l.worker_id === workerId
    );
    const approvedLogs = workerLogs.filter((l) => l.status === "approved");
    const pendingLogs = workerLogs.filter((l) => l.status === "pending");
    const summary = summaryMap.get(workerId);

    const totalHours =
      Math.round(
        approvedLogs.reduce((sum, l) => sum + l.duration_hours, 0) * 100
      ) / 100;
    const totalPay = approvedLogs.reduce((sum, l) => sum + l.calculated_pay, 0);

    return {
      workerId,
      workerName: profileMap.get(workerId) ?? "알 수 없음",
      year,
      month,
      totalHours: summary?.total_hours ?? totalHours,
      totalPay: summary?.total_pay ?? totalPay,
      status: summary?.status ?? "draft",
      approvedLogCount: approvedLogs.length,
      pendingLogCount: pendingLogs.length,
    };
  });
}

// 근무자 본인의 정산 요약 조회
export async function getMyPayrollSummary(
  supabase: TypedSupabaseClient,
  workerId: string,
  year: number,
  month: number
): Promise<PayrollSummary | null> {
  const { data, error } = await supabase
    .from("payroll_summaries")
    .select("*")
    .eq("worker_id", workerId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error || !data) return null;
  return toPayrollSummary(data as PayrollSummaryRow);
}

// 근무자의 전체 정산 목록 조회 (최신순)
export async function getMyPayrollSummaries(
  supabase: TypedSupabaseClient,
  workerId: string
): Promise<PayrollSummary[]> {
  const { data, error } = await supabase
    .from("payroll_summaries")
    .select("*")
    .eq("worker_id", workerId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error || !data) return [];
  return (data as PayrollSummaryRow[]).map(toPayrollSummary);
}
