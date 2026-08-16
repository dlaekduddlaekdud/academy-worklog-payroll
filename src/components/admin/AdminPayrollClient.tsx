"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MonthPicker } from "@/components/common/MonthPicker";
import { PayrollTable } from "@/components/admin/PayrollTable";
import { showSuccess, showError } from "@/lib/toast";
import {
  finalizePayroll,
  unfinalizePayroll,
  bulkFinalizePayroll,
} from "@/app/(admin)/admin/payroll/actions";
import type { PayrollOverview } from "@/types";

interface AdminPayrollClientProps {
  initialOverviews: PayrollOverview[];
  initialYear: number;
  initialMonth: number;
}

export function AdminPayrollClient({
  initialOverviews,
  initialYear,
  initialMonth,
}: AdminPayrollClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState({ year: initialYear, month: initialMonth });

  const handleMonthChange = (newMonth: { year: number; month: number }) => {
    setMonth(newMonth);
    router.push(`/admin/payroll?year=${newMonth.year}&month=${newMonth.month}`);
  };

  const handleFinalize = (workerId: string) => {
    const overview = initialOverviews.find((o) => o.workerId === workerId);
    startTransition(async () => {
      const result = await finalizePayroll(workerId, month.year, month.month);
      if (result.success) {
        showSuccess(`${overview?.workerName ?? ""}의 급여가 확정되었습니다`);
        router.refresh();
      } else {
        showError("급여 확정에 실패했습니다", result.error ?? "");
      }
    });
  };

  const handleUnfinalize = (workerId: string) => {
    const overview = initialOverviews.find((o) => o.workerId === workerId);
    startTransition(async () => {
      const result = await unfinalizePayroll(workerId, month.year, month.month);
      if (result.success) {
        showSuccess(`${overview?.workerName ?? ""}의 급여 확정이 취소되었습니다`);
        router.refresh();
      } else {
        showError("확정 취소에 실패했습니다", result.error ?? "");
      }
    });
  };

  const handleBulkFinalize = (workerIds: string[]) => {
    startTransition(async () => {
      const result = await bulkFinalizePayroll(workerIds, month.year, month.month);
      if (result.success) {
        showSuccess(`${workerIds.length}명의 급여가 확정되었습니다`);
        router.refresh();
      } else {
        showError("일괄 확정에 실패했습니다", result.error ?? "");
      }
    });
  };

  const handleDownloadCsv = () => {
    // 브라우저 다운로드 트리거
    const url = `/api/payroll/csv?year=${month.year}&month=${month.month}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `급여정산_${month.year}년_${month.month}월.csv`;
    a.click();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <MonthPicker value={month} onChange={handleMonthChange} />
        {isPending && <span className="text-sm text-muted-foreground">처리 중...</span>}
      </div>

      <PayrollTable
        overviews={initialOverviews}
        onFinalize={handleFinalize}
        onUnfinalize={handleUnfinalize}
        onBulkFinalize={handleBulkFinalize}
        onDownloadCsv={handleDownloadCsv}
      />
    </>
  );
}
