import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/AppLayout"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // profiles 테이블에서 역할/이름 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", session.user.id)
    .single()

  const userName = profile?.name ?? session.user.email ?? "사용자"
  const role = (profile?.role as "admin" | "worker") ?? "worker"

  // 관리자가 아닌 경우 근무자 대시보드로 리다이렉트
  if (role !== "admin") {
    redirect("/worker/dashboard")
  }

  return (
    <AppLayout role="admin" userName={userName}>
      {children}
    </AppLayout>
  )
}
