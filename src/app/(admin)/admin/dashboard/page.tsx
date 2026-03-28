import Link from "next/link"
import { redirect } from "next/navigation"
import { Users, Clock, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboardPage() {
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

  // 이번 달 근무 기록 집계
  const { data: thisMonthLogs } = await supabase
    .from("work_logs")
    .select("worker_id, status, duration_hours, calculated_pay")
    .gte("work_date", startDate)
    .lte("work_date", endDate)

  const logs = thisMonthLogs ?? []
  const pendingLogs = logs.filter((l) => l.status === "pending")
  const approved = logs.filter((l) => l.status === "approved")
  const totalHours =
    Math.round(
      approved.reduce((sum, l) => sum + l.duration_hours, 0) * 100
    ) / 100
  const totalPay = approved.reduce((sum, l) => sum + l.calculated_pay, 0)

  // 활성 근무자 목록
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, name, email")
    .eq("role", "worker")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const workers = profilesData ?? []

  // 근무자별 이번 달 근무 집계
  const workerStats = workers.map((worker) => {
    const workerLogs = logs.filter((l) => l.worker_id === worker.user_id)
    const hours =
      Math.round(
        workerLogs
          .filter((l) => l.status === "approved")
          .reduce((sum, l) => sum + l.duration_hours, 0) * 100
      ) / 100
    const pending = workerLogs.filter((l) => l.status === "pending").length
    const total = workerLogs.length
    return { ...worker, hours, pending, total }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리자 대시보드"
        description={`${year}년 ${month}월 전체 현황`}
      />

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">근무자 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{workers.length}명</p>
            <p className="text-xs text-muted-foreground mt-1">활성 근무자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 근무시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours}시간</p>
            <p className="text-xs text-muted-foreground mt-1">승인된 기록 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 급여</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPay.toLocaleString()}원</p>
            <p className="text-xs text-muted-foreground mt-1">승인된 기록 기준</p>
          </CardContent>
        </Card>

        {/* 대기 중 승인 건수 */}
        <Card className={pendingLogs.length > 0 ? "border-yellow-300 bg-yellow-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">승인 대기</CardTitle>
            <AlertCircle className={`h-4 w-4 ${pendingLogs.length > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${pendingLogs.length > 0 ? "text-yellow-700" : ""}`}>
              {pendingLogs.length}건
            </p>
            {pendingLogs.length > 0 ? (
              <Link href="/admin/work-logs" className="mt-1 text-xs text-yellow-700 underline underline-offset-2 hover:text-yellow-800">
                검토하러 가기 →
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">처리 완료</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 근무자별 이번 달 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">근무자별 이번 달 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              등록된 근무자가 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>근무자</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="text-right">총 기록</TableHead>
                  <TableHead className="text-right">승인 근무시간</TableHead>
                  <TableHead className="text-right">대기 중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerStats.map((worker) => (
                  <TableRow key={worker.user_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/workers/${worker.user_id}/rates`}
                        className={cn(
                          buttonVariants({ variant: "link", size: "sm" }),
                          "h-auto p-0 font-medium"
                        )}
                      >
                        {worker.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{worker.email}</TableCell>
                    <TableCell className="text-right">{worker.total}건</TableCell>
                    <TableCell className="text-right">{worker.hours}시간</TableCell>
                    <TableCell className="text-right">
                      {worker.pending > 0 ? (
                        <span className="font-medium text-yellow-600">{worker.pending}건</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
