import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HourlyRateHistory } from "@/components/admin/HourlyRateHistory"
import { HourlyRateManagerClient } from "@/components/admin/HourlyRateManagerClient"
import { RoleBadge } from "@/components/common/StatusBadge"
import { WorkerRatesFormClient } from "@/components/admin/WorkerRatesFormClient"
import type { HourlyRate, HourlyRateRow } from "@/types"

interface WorkerRatesPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkerRatesPage({ params }: WorkerRatesPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 근무자 정보 조회
  const { data: worker, error: workerError } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("user_id", id)
    .single()

  if (workerError || !worker) {
    notFound()
  }

  // 해당 근무자의 시급 이력 조회
  const { data: ratesData } = await supabase
    .from("hourly_rates")
    .select("*")
    .eq("worker_id", id)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })

  const workerRates: HourlyRate[] = ((ratesData ?? []) as HourlyRateRow[]).map((r) => ({
    id: r.id,
    workerId: r.worker_id,
    roleType: r.role_type,
    rate: r.rate,
    effectiveFrom: r.effective_from,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }))

  // 현재 유효 시급 (날짜 최신순)
  const currentAssistantRate = workerRates
    .filter((r) => r.roleType === "assistant")[0]

  const currentCoachingRate = workerRates
    .filter((r) => r.roleType === "coaching")[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${worker.name} 시급 관리`}
        description={worker.email}
      />

      {/* 현재 유효 시급 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">현재 적용 시급</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RoleBadge roleType="assistant" />
              </div>
              <p className="text-xl font-bold">
                {currentAssistantRate
                  ? `${currentAssistantRate.rate.toLocaleString()}원`
                  : <span className="text-yellow-600 text-base">미설정</span>}
              </p>
              {currentAssistantRate && (
                <p className="text-xs text-muted-foreground">
                  {currentAssistantRate.effectiveFrom}부터 적용
                </p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RoleBadge roleType="coaching" />
              </div>
              <p className="text-xl font-bold">
                {currentCoachingRate
                  ? `${currentCoachingRate.rate.toLocaleString()}원`
                  : <span className="text-yellow-600 text-base">미설정</span>}
              </p>
              {currentCoachingRate && (
                <p className="text-xs text-muted-foreground">
                  {currentCoachingRate.effectiveFrom}부터 적용
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 시급 등록 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">새 시급 등록</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkerRatesFormClient workerId={id} />
          </CardContent>
        </Card>

        {/* 시급 수정/삭제 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">등록된 시급 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <HourlyRateManagerClient workerId={id} rates={workerRates} />
          </CardContent>
        </Card>
      </div>

      {/* 시급 변경 이력 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">시급 변경 이력</h3>
        <HourlyRateHistory rates={workerRates} />
      </div>
    </div>
  )
}
