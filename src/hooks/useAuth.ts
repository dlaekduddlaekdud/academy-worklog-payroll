"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import type { ProfileRow } from "@/types/database";

interface UseAuthReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// ProfileRow를 앱 레이어 UserProfile로 변환
function toUserProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .returns<ProfileRow[]>()
        .single();

      if (data) {
        setProfile(toUserProfile(data));
      }

      setIsLoading(false);
    }

    loadProfile();

    // 세션 변경 이벤트 구독 (로그인/로그아웃 반영)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
  }, [router]);

  return { profile, isLoading, signOut };
}
