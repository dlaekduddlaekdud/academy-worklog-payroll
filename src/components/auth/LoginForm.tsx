"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
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
        </div>
      </CardContent>
    </Card>
  );
}
