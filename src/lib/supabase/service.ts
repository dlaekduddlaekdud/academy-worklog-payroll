import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// service_role 클라이언트 — RLS 우회, Server Action 전용
// 클라이언트 컴포넌트에서 절대 사용 금지
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
