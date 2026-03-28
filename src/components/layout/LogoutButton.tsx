"use client"

// 로그아웃 처리를 위한 클라이언트 컴포넌트
// 레이아웃(Server Component)에서 직접 onLogout 핸들러를 전달할 수 없으므로 분리
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function LogoutButton() {
  const router = useRouter()

  useEffect(() => {
    // 전역 커스텀 이벤트로 로그아웃 요청을 수신
    const handleLogout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    }

    window.addEventListener("logout", handleLogout)
    return () => window.removeEventListener("logout", handleLogout)
  }, [router])

  return null
}
