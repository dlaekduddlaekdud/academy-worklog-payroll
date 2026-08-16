"use client";

import Link from "next/link";
import { LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types";

interface HeaderProps {
  userName: string;
  role: Role;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function Header({ userName, role, isAdmin = false, onLogout }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        {/* 관리자 패널 진입 버튼 (근무자 페이지에서 관리자만 표시) */}
        {isAdmin && role !== "admin" && (
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              관리자 패널
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{userName}</span>
          <Badge variant="secondary" className="text-xs">
            {isAdmin || role === "admin" ? "관리자" : "근무자"}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
