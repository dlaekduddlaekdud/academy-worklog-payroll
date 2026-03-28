import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// 브라우저 환경에서 싱글톤 인스턴스 유지 (중복 생성 방지)
let client: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
