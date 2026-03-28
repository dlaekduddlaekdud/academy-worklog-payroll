import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { WorkLog } from "@/types"

interface PayrollDetailProps {
  logs: WorkLog[]
  year: number
  month: number
}

export function PayrollDetail({ logs, year, month }: PayrollDetailProps) {
  // 승인된 기록만 표시
  const approvedLogs = logs.filter((log) => log.status === "approved")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {year}년 {month}월 승인된 근무 기록
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {approvedLogs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="승인된 근무 기록이 없습니다"
              description="해당 월에 승인된 근무 기록이 없습니다"
            />
          </div>
        ) : (
          <div className="rounded-b-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>근무일</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead className="text-right">시급</TableHead>
                  <TableHead className="text-right">급여</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.workDate), "M월 d일 (EEE)", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {log.startTime} ~ {log.endTime}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
