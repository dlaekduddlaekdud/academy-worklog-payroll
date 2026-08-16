import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPayrollOverviews } from "@/lib/services/payroll";
import { generatePayrollCsv, generatePayrollCsvFilename } from "@/lib/utils/csv-generator";

// GET /api/payroll/csv?year=2026&month=3
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year, month 파라미터가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const overviews = await getPayrollOverviews(supabase, year, month);
  const csv = generatePayrollCsv(overviews, year, month);
  const filename = generatePayrollCsvFilename(year, month);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
