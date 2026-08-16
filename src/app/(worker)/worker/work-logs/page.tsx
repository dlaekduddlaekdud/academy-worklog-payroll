import { getMonthRange } from "@/lib/utils/date-range";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { WorkLogListClient } from "@/components/worker/WorkLogListClient";
import type { WorkLog, WorkLogRow } from "@/types";

export default async function WorkerWorkLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  // 해당 월 전체 근무 기록 조회
  const { startDate, endDate } = getMonthRange(year, month);

  const { data: logs, error } = await supabase
    .from("work_logs")
    .select("*")
    .eq("worker_id", user.id)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false });

  const workLogs: WorkLog[] =
    error || !logs
      ? []
      : (logs as WorkLogRow[]).map((row) => ({
          id: row.id,
          workerId: row.worker_id,
          workDate: row.work_date,
          startTime: row.start_time.slice(0, 5),
          endTime: row.end_time.slice(0, 5),
          durationHours: row.duration_hours,
          roleType: row.role_type as "assistant" | "coaching",
          memo: row.memo,
          status: row.status as "pending" | "approved" | "rejected",
          appliedHourlyRate: row.applied_hourly_rate,
          calculatedPay: row.calculated_pay,
          submittedAt: row.submitted_at,
          reviewedAt: row.reviewed_at,
          reviewedBy: row.reviewed_by,
          rejectionReason: row.rejection_reason,
          updatedAt: row.updated_at,
        }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="근무 기록"
        description="월별 근무 기록을 확인하고 관리합니다"
        action={
          <Link href="/worker/work-logs/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-1.5 h-4 w-4" />
            기록 입력
          </Link>
        }
      />
      <WorkLogListClient initialLogs={workLogs} initialYear={year} initialMonth={month} />
    </div>
  );
}
