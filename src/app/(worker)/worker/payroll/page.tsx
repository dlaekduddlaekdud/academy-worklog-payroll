import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/common/PageHeader"
import { WorkerPayrollClient } from "@/components/worker/WorkerPayrollClient"
import { getMyPayrollSummary } from "@/lib/services/payroll"
import type { WorkLog, WorkLogRow } from "@/types"

export default async function WorkerPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()), 10)
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10)

  // 프로필 조회 (이름)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", user.id)
    .single()

  const workerName = profile?.name ?? ""

  // 해당 월 정산 요약 조회
  const summary = await getMyPayrollSummary(supabase, user.id, year, month)

  // 해당 월 근무 기록 조회
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { data: logsData } = await supabase
    .from("work_logs")
    .select("*")
    .eq("worker_id", user.id)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true })

  const monthLogs: WorkLog[] = ((logsData ?? []) as WorkLogRow[]).map((row) => ({
    id: row.id,
    workerId: row.worker_id,
    workDate: row.work_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    durationHours: row.duration_hours,
    roleType: row.role_type as "assistant" | "coaching",
    memo: row.memo,
    status: row.status as "pending" | "approved" | "rejected",
    appliedHourlyRate: row.applied_hourly_rate,
    calculatedPay: row.calculated_pay,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    updatedAt: row.updated_at,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="급여 확인"
        description="월별 급여 정산 내역을 확인합니다"
      />
      <WorkerPayrollClient
        initialSummary={summary}
        initialLogs={monthLogs}
        workerName={workerName}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}
