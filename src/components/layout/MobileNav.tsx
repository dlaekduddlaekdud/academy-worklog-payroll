"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Users,
  BookOpen,
  LogOut,
  Shield,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const WORKER_NAV: NavItem[] = [
  { label: "대시보드", href: "/worker/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "근무 기록", href: "/worker/work-logs", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "급여 확인", href: "/worker/payroll", icon: <CreditCard className="h-4 w-4" /> },
  { label: "마이페이지", href: "/worker/mypage", icon: <UserCircle className="h-4 w-4" /> },
];

const ADMIN_NAV: NavItem[] = [
  { label: "대시보드", href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "근무자 관리", href: "/admin/workers", icon: <Users className="h-4 w-4" /> },
  {
    label: "근무 기록 관리",
    href: "/admin/work-logs",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  { label: "급여 정산", href: "/admin/payroll", icon: <CreditCard className="h-4 w-4" /> },
];

interface MobileNavProps {
  role: Role;
  userName: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function MobileNav({ role, userName, isAdmin = false, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = role === "admin" ? ADMIN_NAV : WORKER_NAV;

  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">학원 근무 관리</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="메뉴 열기">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                학원 근무 관리
              </SheetTitle>
            </SheetHeader>

            {/* 사용자 정보 */}
            <div className="mt-4 flex items-center gap-2 rounded-md border p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {isAdmin ? "관리자" : "근무자"}
                </Badge>
              </div>
              {/* 관리자 패널 진입 버튼 */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  관리자 패널
                </Link>
              )}
            </div>

            {/* 네비게이션 */}
            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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

            {/* 로그아웃 */}
            <div className="pb-6 pt-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
