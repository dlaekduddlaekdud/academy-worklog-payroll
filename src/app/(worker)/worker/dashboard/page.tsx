import Link from "next/link"
import { redirect } from "next/navigation"
import { Clock, DollarSign, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge, RoleBadge } from "@/components/common/StatusBadge"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default async function WorkerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  // 이번 달 근무 기록 조회
  const { data: thisMonthLogs } = await supabase
    .from("work_logs")
    .select("id, work_date, start_time, end_time, duration_hours, role_type, status, calculated_pay, applied_hourly_rate, submitted_at")
    .eq("worker_id", user.id)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("submitted_at", { ascending: false })

  const logs = thisMonthLogs ?? []

  const approved = logs.filter((l) => l.status === "approved")
  const totalHours =
    Math.round(approved.reduce((sum, l) => sum + l.duration_hours, 0) * 100) / 100
  const estimatedPay = approved.reduce((sum, l) => sum + l.calculated_pay, 0)
  const approvedCount = approved.length
  const pendingCount = logs.filter((l) => l.status === "pending").length

  // 최근 5건 (전체 기록 중 제출일 최신순)
  const recentLogs = logs.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${year}년 ${month}월 근무 현황`}
        action={
          <Link
            href="/worker/work-logs/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            근무 기록 입력
          </Link>
        }
      />

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 근무시간
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours}시간</p>
            <p className="text-xs text-muted-foreground mt-1">승인된 기록 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              예상 급여
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{estimatedPay.toLocaleString()}원</p>
            <p className="text-xs text-muted-foreground mt-1">승인된 기록 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              승인된 기록
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvedCount}건</p>
            <p className="text-xs text-muted-foreground mt-1">이번 달</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              대기 중
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}건</p>
            <p className="text-xs text-muted-foreground mt-1">검토 대기 중</p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 근무 기록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">최근 근무 기록</CardTitle>
          <Link
            href="/worker/work-logs"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            전체 보기
          </Link>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              근무 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(log.work_date), "M월 d일 (EEE)", { locale: ko })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.start_time.slice(0, 5)} ~ {log.end_time.slice(0, 5)} ({log.duration_hours}시간)
                      </p>
                    </div>
                    <RoleBadge roleType={log.role_type as "assistant" | "coaching"} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {log.calculated_pay.toLocaleString()}원
                    </span>
                    <StatusBadge status={log.status as "pending" | "approved" | "rejected"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
