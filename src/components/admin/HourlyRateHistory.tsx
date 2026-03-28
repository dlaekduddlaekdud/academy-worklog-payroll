import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoleBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import type { HourlyRate } from "@/types"

interface HourlyRateHistoryProps {
  rates: HourlyRate[]
}

export function HourlyRateHistory({ rates }: HourlyRateHistoryProps) {
  // 날짜 내림차순 정렬
  const sortedRates = [...rates].sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  )

  if (sortedRates.length === 0) {
    return (
      <EmptyState
        title="시급 이력이 없습니다"
        description="등록된 시급 이력이 없습니다"
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>적용일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead className="text-right">시급</TableHead>
            <TableHead>등록일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRates.map((rate, index) => (
            <TableRow key={rate.id}>
              <TableCell className="font-medium">
                {format(new Date(rate.effectiveFrom), "yyyy년 M월 d일", { locale: ko })}
                {index === 0 && (
                  <span className="ml-2 text-xs text-green-600 font-medium">현재</span>
                )}
              </TableCell>
              <TableCell>
                <RoleBadge roleType={rate.roleType} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {rate.rate.toLocaleString()}원
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(rate.createdAt), "yyyy-MM-dd HH:mm", { locale: ko })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
