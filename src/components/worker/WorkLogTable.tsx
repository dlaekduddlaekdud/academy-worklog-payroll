"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, ClipboardList } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge, RoleBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import type { WorkLog } from "@/types"

interface WorkLogTableProps {
  logs: WorkLog[]
  onEdit?: (log: WorkLog) => void
  onDelete?: (id: string) => void
}

export function WorkLogTable({ logs, onEdit, onDelete }: WorkLogTableProps) {
  // 반려 사유 펼침 상태
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="근무 기록이 없습니다"
        description="이번 달 근무 기록이 없습니다."
        icon={<ClipboardList className="h-6 w-6" />}
        action={
          <Link
            href="/worker/work-logs/new"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="h-3.5 w-3.5" />
            근무 기록 입력
          </Link>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>근무일</TableHead>
            <TableHead>시간</TableHead>
            <TableHead>역할</TableHead>
            <TableHead className="text-right">시급</TableHead>
            <TableHead className="text-right">급여</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-center">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {format(new Date(log.workDate), "M월 d일 (EEE)", { locale: ko })}
                </TableCell>
                <TableCell>
                  <span>{log.startTime} ~ {log.endTime}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({log.durationHours}h)
                  </span>
                </TableCell>
                <TableCell>
                  <RoleBadge roleType={log.roleType} />
                </TableCell>
                <TableCell className="text-right">
                  {log.appliedHourlyRate.toLocaleString()}원
                </TableCell>
                <TableCell className="text-right font-medium">
                  {log.calculatedPay.toLocaleString()}원
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={log.status} />
                    {/* 반려 사유 토글 버튼 */}
                    {log.status === "rejected" && log.rejectionReason && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpand(log.id)}
                        aria-label="반려 사유 보기"
                      >
                        {expandedIds.has(log.id) ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {/* 모든 상태에 수정/삭제 표시 */}
                  <div className="flex items-center justify-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(log)}
                        aria-label="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          // 승인된 기록 삭제 시 경고 확인
                          if (log.status === "approved") {
                            if (!window.confirm("승인된 기록입니다. 삭제하시겠습니까?")) return;
                          }
                          onDelete(log.id);
                        }}
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* 반려 사유 펼침 행 */}
              {log.status === "rejected" &&
                log.rejectionReason &&
                expandedIds.has(log.id) && (
                  <TableRow key={`${log.id}-reason`} className="bg-red-50/50 hover:bg-red-50/50">
                    <TableCell colSpan={7}>
                      <div className="px-2 py-1">
                        <p className="text-xs font-medium text-red-700">반려 사유</p>
                        <p className="mt-0.5 text-sm text-red-600">{log.rejectionReason}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
