import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Clock, DollarSign, Calendar } from "lucide-react";
import type { PayrollSummary } from "@/types";

interface PayrollCardProps {
  summary: PayrollSummary;
  workerName: string;
}

export function PayrollCard({ summary, workerName }: PayrollCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">{workerName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.year}년 {summary.month}월 급여 정산
          </p>
        </div>
        <StatusBadge status={summary.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              기간
            </div>
            <p className="text-sm font-medium">
              {summary.year}.{String(summary.month).padStart(2, "0")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />총 근무시간
            </div>
            <p className="text-sm font-medium">{summary.totalHours}시간</p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />총 급여
            </div>
            <p className="text-lg font-bold">{summary.totalPay.toLocaleString()}원</p>
          </div>
        </div>

        {summary.status === "finalized" && summary.finalizedAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            확정일: {new Date(summary.finalizedAt).toLocaleDateString("ko-KR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
