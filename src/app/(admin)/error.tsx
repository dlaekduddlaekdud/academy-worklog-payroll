"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
        <p className="text-sm text-muted-foreground">
          페이지를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>다시 시도</Button>
        <Link
          href="/admin/dashboard"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  )
}
