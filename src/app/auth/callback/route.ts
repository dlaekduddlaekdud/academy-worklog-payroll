import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth 또는 매직링크 인증 후 Supabase가 이 URL로 리다이렉트
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // 세션 교환 성공 후 역할에 따라 대시보드로 이동
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("user_id", userId)
    .single();

  // Google OAuth로 가입 시 이름이 비어 있으면 메타데이터에서 업데이트
  if (!profile?.name) {
    const { data: userData } = await supabase.auth.getUser();
    const meta = userData?.user?.user_metadata;
    const googleName = meta?.name ?? meta?.full_name ?? meta?.given_name ?? null;
    if (googleName) {
      await supabase.from("profiles").update({ name: googleName }).eq("user_id", userId);
    }
  }

  if (profile?.role === "admin") {
    return NextResponse.redirect(`${origin}/admin/dashboard`);
  }

  return NextResponse.redirect(`${origin}/worker/dashboard`);
}
