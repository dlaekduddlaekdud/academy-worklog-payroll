"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MonthPicker } from "@/components/common/MonthPicker"
import { PayrollCard } from "@/components/worker/PayrollCard"
import { PayrollDetail } from "@/components/worker/PayrollDetail"
import { EmptyState } from "@/components/common/EmptyState"
import type { PayrollSummary, WorkLog } from "@/types"

interface WorkerPayrollClientProps {
  initialSummary: PayrollSummary | null
  initialLogs: WorkLog[]
  workerName: string
  initialYear: number
  initialMonth: number
}

export function WorkerPayrollClient({
  initialSummary,
  initialLogs,
  workerName,
  initialYear,
  initialMonth,
}: WorkerPayrollClientProps) {
  const router = useRouter()
  const [month, setMonth] = useState({ year: initialYear, month: initialMonth })

  const handleMonthChange = (newMonth: { year: number; month: number }) => {
    setMonth(newMonth)
    router.push(
      `/worker/payroll?year=${newMonth.year}&month=${newMonth.month}`
    )
  }

  return (
    <>
      <MonthPicker value={month} onChange={handleMonthChange} />

      {initialSummary ? (
        <div className="space-y-4">
          <PayrollCard summary={initialSummary} workerName={workerName} />
          <PayrollDetail
            logs={initialLogs}
            year={month.year}
            month={month.month}
          />
        </div>
      ) : (
        <EmptyState
          title="급여 정산 내역이 없습니다"
          description={`${month.year}년 ${month.month}월 확정된 급여 정산이 없습니다. 근무 기록이 승인되고 관리자가 급여를 확정하면 여기에 표시됩니다.`}
        />
      )}
    </>
  )
}
