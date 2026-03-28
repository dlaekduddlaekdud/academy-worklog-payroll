import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkLogEditForm } from "@/components/worker/WorkLogEditForm"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import type { WorkLogRow } from "@/types"

interface WorkLogEditPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkLogEditPage({ params }: WorkLogEditPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: rawWorkLog, error } = await supabase
    .from("work_logs")
    .select("*")
    .eq("id", id)
    .eq("worker_id", user.id)
    .single()

  if (error || !rawWorkLog) {
    notFound()
  }

  const workLog = rawWorkLog as WorkLogRow

  // DB 타임 포맷 "HH:mm:ss" → "HH:mm" 변환
  const defaultValues = {
    workDate: workLog.work_date,
    startTime: workLog.start_time.slice(0, 5),
    endTime: workLog.end_time.slice(0, 5),
    roleType: workLog.role_type as "assistant" | "coaching",
    memo: workLog.memo ?? "",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="근무 기록 수정"
        description="근무 일시와 역할을 수정해주세요"
      />

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <WorkLogEditForm id={id} defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  )
}
