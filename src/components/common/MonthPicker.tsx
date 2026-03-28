"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MonthValue {
  year: number
  month: number
}

interface MonthPickerProps {
  value: MonthValue
  onChange: (value: MonthValue) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const handlePrev = () => {
    if (value.month === 1) {
      onChange({ year: value.year - 1, month: 12 })
    } else {
      onChange({ year: value.year, month: value.month - 1 })
    }
  }

  const handleNext = () => {
    if (value.month === 12) {
      onChange({ year: value.year + 1, month: 1 })
    } else {
      onChange({ year: value.year, month: value.month + 1 })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        aria-label="이전 달"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[7rem] text-center text-sm font-medium">
        {value.year}년 {value.month}월
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        aria-label="다음 달"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
