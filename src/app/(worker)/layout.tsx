import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/layout/AppLayout"

export default async function WorkerLayout({
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
  const isAdmin = profile?.role === "admin"

  return (
    <AppLayout role="worker" userName={userName} isAdmin={isAdmin}>
      {children}
    </AppLayout>
  )
}
