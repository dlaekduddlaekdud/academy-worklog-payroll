import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/common/PageHeader"
import { MyPageClient } from "@/components/worker/MyPageClient"
import type { WorkLog, WorkLogRow } from "@/types"

export default async function WorkerMyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 프로필 조회 (이름)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", user.id)
    .single()

  const workerName = profile?.name ?? ""

  // 이번 달 기준 설정
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  // 이번 달 내 근무 기록 조회 (내 근무 달력에 표시)
  const { data: logsData } = await supabase
    .from("work_logs")
    .select("*")
    .eq("worker_id", user.id)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true })

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

  // 현재 유효 시급 조회 (조교/코칭 각각)
  const today = now.toISOString().slice(0, 10)
  const fetchRate = async (roleType: "assistant" | "coaching") => {
    const { data } = await supabase
      .from("hourly_rates")
      .select("rate")
      .eq("worker_id", user.id)
      .eq("role_type", roleType)
      .lte("effective_from", today)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.rate ?? null
  }

  const [assistantRate, coachingRate] = await Promise.all([
    fetchRate("assistant"),
    fetchRate("coaching"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="마이페이지"
        description="근무 일정과 내 근무 기록을 확인합니다"
      />
      <MyPageClient
        workerName={workerName}
        initialWorkLogs={workLogs}
        initialYear={year}
        initialMonth={month}
        assistantRate={assistantRate}
        coachingRate={coachingRate}
      />
    </div>
  )
}
