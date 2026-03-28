"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { CreateWorkerValues } from "@/lib/validations/auth";

export async function createWorkerAction(data: CreateWorkerValues) {
  // 현재 사용자가 admin인지 먼저 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userId = user.id;

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (adminProfile?.role !== "admin") {
    throw new Error("관리자만 근무자 계정을 생성할 수 있습니다.");
  }

  // service_role 클라이언트로 auth.users에 계정 생성
  const serviceClient = createServiceRoleClient();
  const { data: newUser, error: createError } =
    await serviceClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: "worker",
      },
    });

  if (createError) {
    if (createError.message.includes("already registered")) {
      throw new Error("이미 등록된 이메일입니다.");
    }
    throw new Error("계정 생성에 실패했습니다. 다시 시도해주세요.");
  }

  // auth 트리거가 profiles를 자동 생성하지만, 혹시 누락 시 직접 upsert
  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({
      user_id: newUser.user.id,
      email: data.email,
      name: data.name,
      role: "worker" as const,
      is_active: true,
    });

  if (profileError) {
    throw new Error("프로필 생성에 실패했습니다.");
  }

  redirect("/admin/workers");
}
