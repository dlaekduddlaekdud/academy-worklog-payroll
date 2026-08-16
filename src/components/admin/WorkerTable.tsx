import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkerSummary, HourlyRate } from "@/types";

interface WorkerTableProps {
  workers: WorkerSummary[];
  hourlyRates: HourlyRate[];
}

// 특정 근무자의 최신 시급 조회
function getLatestRate(
  workerId: string,
  roleType: "assistant" | "coaching",
  rates: HourlyRate[]
): number | null {
  const workerRates = rates
    .filter((r) => r.workerId === workerId && r.roleType === roleType)
    .sort((a, b) => {
      const dateDiff = new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  return workerRates[0]?.rate ?? null;
}

export function WorkerTable({ workers, hourlyRates }: WorkerTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead className="text-right">조교 시급</TableHead>
            <TableHead className="text-right">코칭 시급</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-center">시급 설정</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => {
            const assistantRate = getLatestRate(worker.userId, "assistant", hourlyRates);
            const coachingRate = getLatestRate(worker.userId, "coaching", hourlyRates);
            const hasRateMissing = assistantRate === null && coachingRate === null;

            return (
              <TableRow key={worker.userId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {hasRateMissing && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="시급 미설정" />
                    )}
                    {worker.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{worker.email}</TableCell>
                <TableCell className="text-right">
                  {assistantRate !== null ? (
                    `${assistantRate.toLocaleString()}원`
                  ) : (
                    <span className="text-yellow-600 text-sm">미설정</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {coachingRate !== null ? (
                    `${coachingRate.toLocaleString()}원`
                  ) : (
                    <span className="text-yellow-600 text-sm">미설정</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      worker.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {worker.isActive ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/admin/workers/${worker.userId}/rates`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    시급 설정
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
