// GET /api/notion/schedule?year=2026&month=3
// 서버 사이드에서 Notion API 호출 — NOTION_TOKEN 클라이언트 노출 방지
// 응답에 근무자 실명이 포함되므로 로그인 필수

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMonthlySchedule } from "@/lib/services/notion"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  const { searchParams } = request.nextUrl

  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  if (!yearParam || !monthParam) {
    return NextResponse.json(
      { error: "year, month 파라미터가 필요합니다" },
      { status: 400 }
    )
  }

  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "유효하지 않은 year 또는 month 값입니다" },
      { status: 400 }
    )
  }

  const entries = await getMonthlySchedule(year, month)

  return NextResponse.json({ entries })
}