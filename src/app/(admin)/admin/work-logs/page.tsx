import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/common/PageHeader"
import { AdminWorkLogsClient } from "@/components/admin/AdminWorkLogsClient"
import type { WorkLog, WorkerSummary, WorkLogRow } from "@/types"

export default async function AdminWorkLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; workerId?: string; status?: string }>
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
  const workerIdParam = params.workerId ?? "all"
  const statusParam = params.status ?? "all"

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  // 근무 기록 조회
  let query = supabase
    .from("work_logs")
    .select("*")
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false })

  if (workerIdParam !== "all") {
    query = query.eq("worker_id", workerIdParam)
  }

  if (statusParam !== "all") {
    query = query.eq("status", statusParam as "pending" | "approved" | "rejected")
  }

  const { data: logsData } = await query

  const workLogs: WorkLog[] = ((logsData ?? []) as WorkLogRow[]).map((row) => ({
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

  // 근무자 목록 조회
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, name, email, is_active")
    .eq("role", "worker")
    .order("name", { ascending: true })

  const workers: WorkerSummary[] = (profilesData ?? []).map((p) => ({
    userId: p.user_id,
    name: p.name,
    email: p.email,
    isActive: p.is_active,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="근무 기록 관리"
        description="근무 기록을 검토하고 승인/반려합니다"
      />
      <AdminWorkLogsClient
        initialLogs={workLogs}
        workers={workers}
        initialYear={year}
        initialMonth={month}
        initialWorkerFilter={workerIdParam}
        initialStatusFilter={statusParam as "all" | "pending" | "approved" | "rejected"}
      />
    </div>
  )
}
