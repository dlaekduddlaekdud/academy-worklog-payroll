"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/common/MonthPicker";
import { WorkLogReviewTable } from "@/components/admin/WorkLogReviewTable";
import { showSuccess, showError } from "@/lib/toast";
import {
  approveWorkLog,
  bulkApproveWorkLogs,
  rejectWorkLog,
} from "@/app/(admin)/admin/work-logs/actions";
import type { WorkLog, WorkerSummary, WorkLogStatus } from "@/types";

interface AdminWorkLogsClientProps {
  initialLogs: WorkLog[];
  workers: WorkerSummary[];
  initialYear: number;
  initialMonth: number;
  initialWorkerFilter: string;
  initialStatusFilter: "all" | WorkLogStatus;
}

export function AdminWorkLogsClient({
  initialLogs,
  workers,
  initialYear,
  initialMonth,
  initialWorkerFilter,
  initialStatusFilter,
}: AdminWorkLogsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState({ year: initialYear, month: initialMonth });
  const [workerFilter, setWorkerFilter] = useState(initialWorkerFilter);
  const [statusFilter, setStatusFilter] = useState<WorkLogStatus | "all">(initialStatusFilter);

  // 필터 변경 시 URL 파라미터 업데이트 → 서버 재조회
  const pushFilter = (newYear: number, newMonth: number, newWorker: string, newStatus: string) => {
    const params = new URLSearchParams({
      year: String(newYear),
      month: String(newMonth),
      ...(newWorker !== "all" && { workerId: newWorker }),
      ...(newStatus !== "all" && { status: newStatus }),
    });
    router.push(`/admin/work-logs?${params.toString()}`);
  };

  const handleMonthChange = (newMonth: { year: number; month: number }) => {
    setMonth(newMonth);
    pushFilter(newMonth.year, newMonth.month, workerFilter, statusFilter);
  };

  const handleWorkerChange = (value: string) => {
    setWorkerFilter(value);
    pushFilter(month.year, month.month, value, statusFilter);
  };

  const handleStatusChange = (value: string) => {
    const typedValue = value as WorkLogStatus | "all";
    setStatusFilter(typedValue);
    pushFilter(month.year, month.month, workerFilter, value);
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveWorkLog(id);
      if (result.success) {
        showSuccess("승인 처리되었습니다");
        router.refresh();
      } else {
        showError("승인에 실패했습니다", result.error ?? "");
      }
    });
  };

  const handleReject = (id: string, reason: string) => {
    startTransition(async () => {
      const result = await rejectWorkLog(id, reason);
      if (result.success) {
        showSuccess("반려 처리되었습니다");
        router.refresh();
      } else {
        showError("반려에 실패했습니다", result.error ?? "");
      }
    });
  };

  const handleBulkApprove = (ids: string[]) => {
    startTransition(async () => {
      const result = await bulkApproveWorkLogs(ids);
      if (result.success) {
        showSuccess(`${ids.length}건 일괄 승인되었습니다`);
        router.refresh();
      } else {
        showError("일괄 승인에 실패했습니다", result.error ?? "");
      }
    });
  };

  // 현재 화면의 대기중 기록 전체 승인
  const handleApproveAll = () => {
    const pendingIds = initialLogs.filter((l) => l.status === "pending").map((l) => l.id);
    if (pendingIds.length === 0) return;
    if (!confirm(`대기중인 ${pendingIds.length}건을 전체 승인하시겠습니까?`)) return;
    handleBulkApprove(pendingIds);
  };

  const pendingCount = initialLogs.filter((l) => l.status === "pending").length;

  return (
    <>
      {/* 필터 + 전체 승인 */}
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={handleMonthChange} />

        <Select value={workerFilter} onValueChange={handleWorkerChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="근무자 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 근무자</SelectItem>
            {workers.map((worker) => (
              <SelectItem key={worker.userId} value={worker.userId}>
                {worker.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="approved">승인</SelectItem>
            <SelectItem value="rejected">반려</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">{initialLogs.length}건</span>

        {isPending && <span className="text-sm text-muted-foreground">처리 중...</span>}

        {/* 전체 승인 버튼 — 대기중 기록이 있을 때만 표시 */}
        {pendingCount > 0 && (
          <Button size="sm" disabled={isPending} onClick={handleApproveAll} className="ml-auto">
            <CheckCheck className="mr-1.5 h-4 w-4" />
            전체 승인 ({pendingCount}건)
          </Button>
        )}
      </div>

      <WorkLogReviewTable
        logs={initialLogs}
        profiles={workers}
        onApprove={handleApprove}
        onReject={handleReject}
        onBulkApprove={handleBulkApprove}
      />
    </>
  );
}
