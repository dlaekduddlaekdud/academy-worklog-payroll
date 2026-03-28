import Link from "next/link"
import { redirect } from "next/navigation"
import { UserPlus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/common/PageHeader"
import { WorkerTable } from "@/components/admin/WorkerTable"
import { createClient } from "@/lib/supabase/server"
import type { WorkerSummary, HourlyRate, HourlyRateRow } from "@/types"

export default async function AdminWorkersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

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

  // 전체 시급 이력 조회
  const { data: ratesData } = await supabase
    .from("hourly_rates")
    .select("*")
    .order("effective_from", { ascending: false })

  const hourlyRates: HourlyRate[] = ((ratesData ?? []) as HourlyRateRow[]).map((r) => ({
    id: r.id,
    workerId: r.worker_id,
    roleType: r.role_type,
    rate: r.rate,
    effectiveFrom: r.effective_from,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="근무자 관리"
        description="근무자 목록 및 시급을 관리합니다"
        action={
          <Link
            href="/admin/workers/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            근무자 추가
          </Link>
        }
      />
      <WorkerTable workers={workers} hourlyRates={hourlyRates} />
    </div>
  )
}
