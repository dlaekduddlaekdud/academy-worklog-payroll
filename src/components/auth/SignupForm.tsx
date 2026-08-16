"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createWorkerSchema, type CreateWorkerValues } from "@/lib/validations/auth";
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

export function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkerValues>({
    resolver: zodResolver(createWorkerSchema),
  });

  async function handleSignup(data: CreateWorkerValues) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setErrorMessage("이미 가입된 이메일입니다. 로그인해주세요.");
      } else {
        setErrorMessage("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } else {
      setSuccessMessage("가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.");
      setTimeout(() => router.push("/login"), 3000);
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
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription className="text-sm">새 계정을 만드세요</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-6">
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-50 px-3 py-2">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

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
              placeholder="4자 이상 입력"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "가입 중..." : "회원가입"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center px-8 pb-8">
        <p className="text-center text-xs text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
