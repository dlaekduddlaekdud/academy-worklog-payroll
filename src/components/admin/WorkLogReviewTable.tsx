"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Check, X, ClipboardCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, RoleBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { RejectionDialog } from "@/components/admin/RejectionDialog";
import type { WorkLog, WorkerSummary } from "@/types";

interface WorkLogReviewTableProps {
  logs: WorkLog[];
  profiles: WorkerSummary[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onBulkApprove: (ids: string[]) => void;
}

export function WorkLogReviewTable({
  logs,
  profiles,
  onApprove,
  onReject,
  onBulkApprove,
}: WorkLogReviewTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingLogs = logs.filter((log) => log.status === "pending");

  const getWorkerName = (workerId: string) => {
    return profiles.find((p) => p.userId === workerId)?.name ?? "알 수 없음";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = pendingLogs.map((l) => l.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const handleBulkApprove = () => {
    onBulkApprove(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleRejectConfirm = (reason: string) => {
    if (rejectingId) {
      onReject(rejectingId, reason);
      setRejectingId(null);
    }
  };

  const isAllSelected = pendingLogs.length > 0 && selectedIds.size === pendingLogs.length;

  if (logs.length === 0) {
    return (
      <EmptyState
        title="검토할 근무 기록이 없습니다"
        description="해당 기간에 검토할 근무 기록이 없습니다."
        icon={<ClipboardCheck className="h-6 w-6" />}
      />
    );
  }

  return (
    <>
      {/* 일괄 승인 버튼 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">{selectedIds.size}건 선택됨</span>
          <Button size="sm" onClick={handleBulkApprove}>
            <Check className="mr-1.5 h-4 w-4" />
            선택 승인
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="전체 선택"
                  disabled={pendingLogs.length === 0}
                />
              </TableHead>
              <TableHead>근무자</TableHead>
              <TableHead>근무일</TableHead>
              <TableHead>시간</TableHead>
              <TableHead>역할</TableHead>
              <TableHead className="text-right">급여</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.status === "pending" && (
                    <Checkbox
                      checked={selectedIds.has(log.id)}
                      onCheckedChange={() => toggleSelect(log.id)}
                      aria-label={`${getWorkerName(log.workerId)} 선택`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{getWorkerName(log.workerId)}</TableCell>
                <TableCell>{format(new Date(log.workDate), "M/d (EEE)", { locale: ko })}</TableCell>
                <TableCell>
                  <span className="text-sm">
                    {log.startTime}~{log.endTime}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">({log.durationHours}h)</span>
                </TableCell>
                <TableCell>
                  <RoleBadge roleType={log.roleType} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {log.calculatedPay.toLocaleString()}원
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.status} />
                </TableCell>
                <TableCell>
                  {log.status === "pending" && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => onApprove(log.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setRejectingId(log.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        반려
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RejectionDialog
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
