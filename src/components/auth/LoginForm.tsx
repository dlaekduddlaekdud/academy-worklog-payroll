"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  async function handleEmailLogin(data: LoginFormValues) {
    setErrorMessage(null);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // signInWithPassword는 code 교환 없이 세션이 바로 생성되므로
    // auth/callback을 거치지 않고 profiles에서 역할을 직접 조회해 redirect
    if (!authData.user) {
      router.push("/worker/dashboard");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", authData.user.id)
      .single();

    // 관리자도 근무자 대시보드에서 시작 (관리자 패널은 프로필 버튼으로 진입)
    router.push("/worker/dashboard");
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-4 pb-6 pt-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <BookOpen className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            학원 근무 관리
          </p>
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
          <CardDescription className="text-sm">계정으로 로그인하세요</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-6">
        <div className="space-y-4">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {/* 이메일/비밀번호 로그인 */}
          <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border/60" />
            <span className="mx-3 text-xs text-muted-foreground">또는</span>
            <div className="flex-1 border-t border-border/60" />
          </div>

          {/* Google 로그인 */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-3 border-border/80 font-medium hover:bg-muted/60"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isGoogleLoading ? "로그인 중..." : "Google로 로그인"}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 px-8 pb-8">
        <p className="text-center text-xs text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
