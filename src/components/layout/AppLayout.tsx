"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Role } from "@/types";

interface AppLayoutProps {
  role: Role;
  userName: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

// Server Layout에서 props를 받아 클라이언트 로그아웃 처리를 담당
export function AppLayout({ role, userName, isAdmin = false, children }: AppLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* 모바일 네비게이션 */}
      <div className="md:hidden">
        <MobileNav role={role} userName={userName} isAdmin={isAdmin} onLogout={handleLogout} />
      </div>

      <div className="flex flex-1">
        {/* 데스크탑 사이드바 */}
        <div className="hidden md:flex">
          <Sidebar role={role} isAdmin={isAdmin} />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="hidden md:block">
            <Header userName={userName} role={role} isAdmin={isAdmin} onLogout={handleLogout} />
          </div>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
