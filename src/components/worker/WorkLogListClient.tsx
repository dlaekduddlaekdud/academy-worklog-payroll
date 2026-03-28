"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthPicker } from "@/components/common/MonthPicker"
import { WorkLogTable } from "@/components/worker/WorkLogTable"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { showSuccess, showError } from "@/lib/toast"
import { deleteWorkLog } from "@/app/(worker)/worker/work-logs/actions"
import type { WorkLog, WorkLogStatus } from "@/types"

interface WorkLogListClientProps {
  initialLogs: WorkLog[]
  initialYear: number
  initialMonth: number
}

export function WorkLogListClient({
  initialLogs,
  initialYear,
  initialMonth,
}: WorkLogListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [month, setMonth] = useState({ year: initialYear, month: initialMonth })
  const [statusFilter, setStatusFilter] = useState<WorkLogStatus | "all">("all")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // 월 변경 시 URL 파라미터 업데이트 → 서버에서 재조회
  const handleMonthChange = (newMonth: { year: number; month: number }) => {
    setMonth(newMonth)
    router.push(
      `/worker/work-logs?year=${newMonth.year}&month=${newMonth.month}`
    )
  }

  const filteredLogs =
    statusFilter === "all"
      ? initialLogs
      : initialLogs.filter((log) => log.status === statusFilter)

  const approved = initialLogs.filter((l) => l.status === "approved")
  const totalHours =
    Math.round(
      approved.reduce((sum, l) => sum + l.durationHours, 0) * 100
    ) / 100
  const totalPay = approved.reduce((sum, l) => sum + l.calculatedPay, 0)
  const pendingCount = initialLogs.filter((l) => l.status === "pending").length
  const approvedCount = approved.length

  const handleEdit = (log: WorkLog) => {
    router.push(`/worker/work-logs/${log.id}/edit`)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return
    startTransition(async () => {
      const result = await deleteWorkLog(deleteTargetId)
      setDeleteTargetId(null)
      if (result.success) {
        showSuccess("근무 기록이 삭제되었습니다")
        router.refresh()
      } else {
        showError("삭제에 실패했습니다", result.error ?? "")
      }
    })
  }

  return (
    <>
      {/* 월 선택 + 요약 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <MonthPicker value={month} onChange={handleMonthChange} />

        <div className="flex gap-3">
          <Card className="min-w-[120px]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">승인 근무시간</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-lg font-bold">{totalHours}시간</p>
            </CardContent>
          </Card>
          <Card className="min-w-[120px]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">예상 급여</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-lg font-bold">{totalPay.toLocaleString()}원</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 상태별 탭 필터 */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as WorkLogStatus | "all")}
      >
        <TabsList>
          <TabsTrigger value="all">
            전체 ({initialLogs.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            대기중 ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">
            승인 ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            반려 ({initialLogs.filter((l) => l.status === "rejected").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <WorkLogTable
        logs={filteredLogs}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteTargetId(id)}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="근무 기록을 삭제하시겠습니까?"
        description="삭제된 기록은 복구할 수 없습니다."
        onConfirm={handleDeleteConfirm}
        confirmLabel="삭제"
        loading={isPending}
        destructive
      />
    </>
  )
}
