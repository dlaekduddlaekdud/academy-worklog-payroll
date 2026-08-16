"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Users,
  BookOpen,
  Shield,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const WORKER_NAV: NavItem[] = [
  {
    label: "대시보드",
    href: "/worker/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "근무 기록",
    href: "/worker/work-logs",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "급여 확인",
    href: "/worker/payroll",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: "마이페이지",
    href: "/worker/mypage",
    icon: <UserCircle className="h-4 w-4" />,
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    label: "대시보드",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "근무자 관리",
    href: "/admin/workers",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "근무 기록 관리",
    href: "/admin/work-logs",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: "급여 정산",
    href: "/admin/payroll",
    icon: <CreditCard className="h-4 w-4" />,
  },
];

interface SidebarProps {
  role: Role;
  isAdmin?: boolean;
}

export function Sidebar({ role, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? ADMIN_NAV : WORKER_NAV;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* 앱 로고/이름 */}
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/worker/dashboard" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">학원 근무 관리</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단: 관리자 패널 버튼 (근무자 페이지에서 관리자만 표시) */}
      <div className="border-t p-4 space-y-2">
        {isAdmin && role !== "admin" && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-4 w-4" />
            관리자 패널
          </Link>
        )}
        <p className="text-xs text-muted-foreground px-3">
          {isAdmin || role === "admin" ? "관리자" : "근무자"} 모드
        </p>
      </div>
    </aside>
  );
}
