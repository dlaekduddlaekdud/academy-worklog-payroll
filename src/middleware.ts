import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // 세션 갱신 (쿠키 기반 토큰 리프레시)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 로그인 상태에서 /login 접근 시 근무자 대시보드로 (관리자 포함 모두 동일)
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/worker/dashboard", request.url));
  }

  // 보호된 라우트는 로그인 필수
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/worker");

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 역할 기반 접근 제어
  if (isProtectedRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = profile?.role;

    // 근무자(worker)가 /admin/* 접근 시도 → 근무자 대시보드로
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    }
    // 관리자는 /worker/* 접근 허용 (별도 차단 없음)
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일과 Next.js 내부 라우트 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
