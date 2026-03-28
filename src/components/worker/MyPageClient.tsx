"use client"

// 마이페이지 클라이언트 컴포넌트
// 좌측: 내 근무 달력 (work_logs), 우측: 판교관 전체 근무 달력 (Notion API)

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, User, Clock, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScheduleCalendar, type CalendarEntry } from "@/components/worker/ScheduleCalendar"
import type { WorkLog } from "@/types"
import type { NotionScheduleEntry } from "@/lib/services/notion"

// 역할별 색상 매핑
const ROLE_COLOR_MAP: Record<string, string> = {
  "1관 초등조교": "#f97316",  // orange
  "2관 중등조교": "#3b82f6",  // blue
  "3관 고등조교": "#16a34a",  // dark green
  "3관 고등코칭": "#0d9488",  // teal
}

const DEFAULT_COLOR = "#6b7280"

function getRoleColor(roleLabel: string): string {
  return ROLE_COLOR_MAP[roleLabel] ?? DEFAULT_COLOR
}

// work_logs 데이터를 달력 배지 형식으로 변환
function workLogsToCalendarEntries(logs: WorkLog[]): CalendarEntry[] {
  return logs.map((log) => ({
    date: log.workDate,
    label: log.roleType === "assistant" ? "조교" : "코칭",
    color: log.roleType === "assistant" ? "#f97316" : "#0d9488",
  }))
}

// Notion 일정 데이터를 달력 배지 형식으로 변환
function notionEntriesToCalendarEntries(
  entries: NotionScheduleEntry[]
): CalendarEntry[] {
  return entries.map((entry) => ({
    date: entry.date,
    label: entry.roleLabel,
    color: getRoleColor(entry.roleLabel),
  }))
}

// 승인된 근무 기록 기준 이번 달 총 시간/금액 계산
function calcMonthSummary(logs: WorkLog[]) {
  const approved = logs.filter((l) => l.status === "approved")
  const totalHours = approved.reduce((sum, l) => sum + (l.durationHours ?? 0), 0)
  const totalPay = approved.reduce((sum, l) => sum + (l.calculatedPay ?? 0), 0)
  return { totalHours, totalPay }
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원"
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

interface MyPageClientProps {
  workerName: string
  initialWorkLogs: WorkLog[]
  initialYear: number
  initialMonth: number
  assistantRate: number | null
  coachingRate: number | null
}

export function MyPageClient({
  workerName,
  initialWorkLogs,
  initialYear,
  initialMonth,
  assistantRate,
  coachingRate,
}: MyPageClientProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [notionEntries, setNotionEntries] = useState<NotionScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 월 변경 시 Notion 일정 재조회
  const fetchNotionSchedule = useCallback(async (y: number, m: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notion/schedule?year=${y}&month=${m}`)
      if (!res.ok) throw new Error("일정 조회 실패")
      const data = (await res.json()) as { entries: NotionScheduleEntry[] }
      setNotionEntries(data.entries)
    } catch {
      setNotionEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotionSchedule(year, month)
  }, [year, month, fetchNotionSchedule])

  const handlePrevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else { setMonth((m) => m - 1) }
  }

  const handleNextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else { setMonth((m) => m + 1) }
  }

  const { totalHours, totalPay } = calcMonthSummary(initialWorkLogs)

  // 달력 배지 데이터 변환
  const myCalendarEntries = workLogsToCalendarEntries(initialWorkLogs)
  const allCalendarEntries = notionEntriesToCalendarEntries(notionEntries)

  return (
    <div className="space-y-6">
      {/* 프로필 + 급여 요약 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
            {/* 이름 / 시급 */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{workerName || "—"}</p>
                <div className="mt-1 flex flex-col gap-0.5">
                  {assistantRate !== null && (
                    <p className="text-sm text-muted-foreground">
                      조교 시급: <span className="font-medium text-foreground">{formatMoney(assistantRate)}</span>
                    </p>
                  )}
                  {coachingRate !== null && (
                    <p className="text-sm text-muted-foreground">
                      코칭 시급: <span className="font-medium text-foreground">{formatMoney(coachingRate)}</span>
                    </p>
                  )}
                  {assistantRate === null && coachingRate === null && (
                    <p className="text-sm text-muted-foreground">시급 미등록</p>
                  )}
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden h-16 sm:block" />

            {/* 이번 달 근무 시간 */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{initialYear}년 {initialMonth}월 근무 시간</p>
                <p className="mt-0.5 text-lg font-semibold">{formatHours(totalHours)}</p>
                <p className="text-xs text-muted-foreground">승인된 기록 기준</p>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden h-16 sm:block" />

            {/* 이번 달 예상 급여 */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{initialYear}년 {initialMonth}월 예상 급여</p>
                <p className="mt-0.5 text-lg font-semibold">{formatMoney(totalPay)}</p>
                <p className="text-xs text-muted-foreground">승인된 기록 기준</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 월 선택 컨트롤 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {year}년 {month}월
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 달력 2단 레이아웃 — 좌: 내 근무, 우: 판교관 전체 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 좌측: 내 근무 달력 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">내 근무 달력</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleCalendar
              year={year}
              month={month}
              entries={myCalendarEntries}
            />
          </CardContent>
        </Card>

        {/* 우측: 판교관 전체 근무 달력 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">판교관 전체 근무 달력</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <ScheduleCalendar
                year={year}
                month={month}
                entries={allCalendarEntries}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 색상 범례 */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">색상 범례</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ROLE_COLOR_MAP).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 달력 로딩 스켈레톤
function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-[64px] rounded-none" />
        ))}
      </div>
    </div>
  )
}
