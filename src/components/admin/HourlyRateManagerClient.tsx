"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Pencil, Trash2, CalendarIcon, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RoleBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { showSuccess, showError } from "@/lib/toast"
import { updateHourlyRate, deleteHourlyRate } from "@/app/(admin)/admin/workers/actions"
import { cn } from "@/lib/utils"
import type { HourlyRate } from "@/types"

interface HourlyRateManagerClientProps {
  workerId: string
  rates: HourlyRate[]
}

export function HourlyRateManagerClient({ workerId, rates }: HourlyRateManagerClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 수정 다이얼로그 상태
  const [editTarget, setEditTarget] = useState<HourlyRate | null>(null)
  const [editRate, setEditRate] = useState("")
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // 삭제 확인 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  function openEdit(rate: HourlyRate) {
    setEditTarget(rate)
    setEditRate(String(rate.rate))
    setEditDate(new Date(rate.effectiveFrom))
  }

  function closeEdit() {
    setEditTarget(null)
    setEditRate("")
    setEditDate(undefined)
    setCalendarOpen(false)
  }

  function handleUpdate() {
    if (!editTarget || !editDate || !editRate) return
    const rateNum = Number(editRate)
    if (isNaN(rateNum) || rateNum <= 0) return

    startTransition(async () => {
      const result = await updateHourlyRate(
        editTarget.id,
        { rate: rateNum, effectiveFrom: format(editDate, "yyyy-MM-dd") },
        workerId
      )
      if (result.success) {
        showSuccess("시급이 수정되었습니다")
        closeEdit()
        router.refresh()
      } else {
        showError("수정에 실패했습니다", result.error ?? "")
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHourlyRate(id, workerId)
      if (result.success) {
        showSuccess("시급 기록이 삭제되었습니다")
        setDeleteTargetId(null)
        router.refresh()
      } else {
        showError("삭제에 실패했습니다", result.error ?? "")
      }
    })
  }

  if (rates.length === 0) {
    return <EmptyState title="등록된 시급이 없습니다" description="아래 폼에서 시급을 등록해주세요" />
  }

  return (
    <>
      <div className="rounded-md border divide-y">
        {rates.map((rate, index) => (
          <div key={rate.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <RoleBadge roleType={rate.roleType} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{rate.rate.toLocaleString()}원</span>
                  {index === 0 && (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                      현재
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(rate.effectiveFrom), "yyyy년 M월 d일", { locale: ko })}부터 적용
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {deleteTargetId === rate.id ? (
                // 삭제 확인 인라인 UI
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-destructive font-medium">삭제할까요?</span>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => handleDelete(rate.id)}
                    disabled={isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => setDeleteTargetId(null)}
                    disabled={isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(rate)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTargetId(rate.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>시급 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">역할</label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50">
                {editTarget && <RoleBadge roleType={editTarget.roleType} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">시급 (원)</label>
              <Input
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                placeholder="예: 15000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">적용 시작일</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate
                      ? format(editDate, "yyyy년 M월 d일", { locale: ko })
                      : "날짜를 선택해주세요"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(date) => {
                      setEditDate(date)
                      setCalendarOpen(false)
                    }}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={isPending}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={isPending || !editDate || !editRate}>
              {isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
