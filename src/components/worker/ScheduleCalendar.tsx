// 범용 월별 달력 컴포넌트 — 날짜별 배지 배열을 렌더링

import { cn } from "@/lib/utils"

export interface CalendarEntry {
  date: string  // "YYYY-MM-DD"
  label: string
  color: string // hex 색상
}

interface ScheduleCalendarProps {
  year: number
  month: number
  entries: CalendarEntry[]
  title?: string
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"]

// 날짜별로 배지 그룹화
function groupByDate(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>()
  for (const entry of entries) {
    const existing = map.get(entry.date) ?? []
    map.set(entry.date, [...existing, entry])
  }
  return map
}

// 달력 그리드 생성 (해당 월의 날짜 배열, 앞/뒤 빈 칸 포함)
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=일, 6=토
  const lastDay = new Date(year, month, 0).getDate()

  const grid: (number | null)[] = []

  // 앞쪽 빈 칸
  for (let i = 0; i < firstDay; i++) {
    grid.push(null)
  }
  // 날짜 채우기
  for (let d = 1; d <= lastDay; d++) {
    grid.push(d)
  }
  // 뒤쪽 빈 칸 (6×7 = 42칸 맞추기 — 레이아웃 안정화)
  while (grid.length % 7 !== 0) {
    grid.push(null)
  }

  return grid
}

export function ScheduleCalendar({
  year,
  month,
  entries,
  title,
}: ScheduleCalendarProps) {
  const grid = buildCalendarGrid(year, month)
  const grouped = groupByDate(entries)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "py-1 text-xs font-medium",
              idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {grid.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`empty-${idx}`} className="bg-muted/30 min-h-[64px]" />
            )
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const dayEntries = grouped.get(dateStr) ?? []
          const isToday = dateStr === todayStr
          const dayOfWeek = (new Date(year, month - 1, day).getDay())

          return (
            <div
              key={dateStr}
              className={cn(
                "bg-background min-h-[64px] p-1 flex flex-col gap-0.5",
                isToday && "bg-primary/5"
              )}
            >
              {/* 날짜 숫자 */}
              <span
                className={cn(
                  "text-xs font-medium self-start leading-none mb-0.5",
                  isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[11px]",
                  !isToday && dayOfWeek === 0 && "text-red-500",
                  !isToday && dayOfWeek === 6 && "text-blue-500",
                  !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-foreground"
                )}
              >
                {day}
              </span>

              {/* 일정 배지 목록 */}
              <div className="flex flex-col gap-px">
                {dayEntries.slice(0, 3).map((entry, i) => (
                  <span
                    key={i}
                    className="block rounded px-1 py-px text-[10px] leading-tight font-medium text-white truncate"
                    style={{ backgroundColor: entry.color }}
                    title={entry.label}
                  >
                    {entry.label}
                  </span>
                ))}
                {/* 3개 초과 시 나머지 개수 표시 */}
                {dayEntries.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayEntries.length - 3}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
