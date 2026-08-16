"use client";

import { useState } from "react";
import { Lock, Download, CheckCheck, ReceiptText } from "lucide-react";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import type { PayrollOverview } from "@/types";

interface PayrollTableProps {
  overviews: PayrollOverview[];
  onFinalize: (workerId: string) => void;
  onUnfinalize: (workerId: string) => void;
  onBulkFinalize: (workerIds: string[]) => void;
  onDownloadCsv: () => void;
}

export function PayrollTable({
  overviews,
  onFinalize,
  onUnfinalize,
  onBulkFinalize,
  onDownloadCsv,
}: PayrollTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const draftOverviews = overviews.filter((o) => o.status === "draft");

  const toggleSelect = (workerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) {
        next.delete(workerId);
      } else {
        next.add(workerId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const draftIds = draftOverviews.map((o) => o.workerId);
    if (selectedIds.size === draftIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(draftIds));
    }
  };

  const handleBulkFinalize = () => {
    onBulkFinalize(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const isAllSelected = draftOverviews.length > 0 && selectedIds.size === draftOverviews.length;

  if (overviews.length === 0) {
    return (
      <EmptyState
        title="정산 데이터가 없습니다"
        description="해당 월에 승인된 근무 기록이 없거나 아직 집계되지 않았습니다. 근무 기록을 승인한 후 확인해주세요."
        icon={<ReceiptText className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* 액션 버튼 영역 */}
      <div className="flex items-center justify-between">
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size}명 선택됨</span>
            <Button size="sm" onClick={handleBulkFinalize}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              선택 확정
            </Button>
          </div>
        ) : (
          <div />
        )}
        <Button variant="outline" size="sm" onClick={onDownloadCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          CSV 다운로드
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="전체 선택"
                  disabled={draftOverviews.length === 0}
                />
              </TableHead>
              <TableHead>근무자</TableHead>
              <TableHead className="text-right">총 근무시간</TableHead>
              <TableHead className="text-right">총 급여</TableHead>
              <TableHead className="text-right">승인</TableHead>
              <TableHead className="text-right">대기</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overviews.map((overview) => (
              <TableRow
                key={overview.workerId}
                className={cn(overview.status === "finalized" && "bg-blue-50/50")}
              >
                <TableCell>
                  {overview.status === "draft" && (
                    <Checkbox
                      checked={selectedIds.has(overview.workerId)}
                      onCheckedChange={() => toggleSelect(overview.workerId)}
                      aria-label={`${overview.workerName} 선택`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{overview.workerName}</TableCell>
                <TableCell className="text-right">{overview.totalHours}시간</TableCell>
                <TableCell className="text-right font-medium">
                  {overview.totalPay.toLocaleString()}원
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {overview.approvedLogCount}건
                </TableCell>
                <TableCell className="text-right">
                  {overview.pendingLogCount > 0 ? (
                    <span className="text-yellow-600">{overview.pendingLogCount}건</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={overview.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    {overview.status === "finalized" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => onUnfinalize(overview.workerId)}
                      >
                        <Lock className="mr-1 h-3 w-3" />
                        확정 취소
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onFinalize(overview.workerId)}
                        disabled={overview.pendingLogCount > 0}
                        title={
                          overview.pendingLogCount > 0 ? "대기 중인 기록이 있습니다" : undefined
                        }
                      >
                        급여 확정
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
