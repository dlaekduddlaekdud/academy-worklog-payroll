// Supabase DB 타입 정의 — snake_case, DB 컬럼명 그대로 사용
// 앱 레이어(camelCase)와 명확히 분리하여 혼용 방지
// Relationships 필드는 @supabase/postgrest-js GenericTable 인터페이스 충족을 위해 필수

export interface Database {
  public: {
    Tables: {
      // ─── profiles ─────────────────────────────────────────────────────────
      profiles: {
        Row: {
          user_id: string;
          email: string;
          name: string;
          role: "admin" | "worker";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          name: string;
          role: "admin" | "worker";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "worker";
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── hourly_rates ──────────────────────────────────────────────────────
      hourly_rates: {
        Row: {
          id: string;
          worker_id: string;
          role_type: "assistant" | "coaching";
          rate: number;
          effective_from: string; // "YYYY-MM-DD"
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          role_type: "assistant" | "coaching";
          rate: number;
          effective_from: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          // 시급은 수정 불가 원칙 — 새 레코드로 추가하는 방식
          // Update 타입은 관리 도구용으로만 남겨둠
          id?: string;
          rate?: number;
          effective_from?: string;
        };
        Relationships: [];
      };

      // ─── work_logs ─────────────────────────────────────────────────────────
      work_logs: {
        Row: {
          id: string;
          worker_id: string;
          work_date: string; // "YYYY-MM-DD"
          start_time: string; // "HH:mm:ss"
          end_time: string; // "HH:mm:ss"
          duration_hours: number;
          role_type: "assistant" | "coaching";
          memo: string | null;
          status: "pending" | "approved" | "rejected";
          // 제출 시점 시급 스냅샷 — NOT NULL 보장
          applied_hourly_rate: number;
          calculated_pay: number;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          work_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          role_type: "assistant" | "coaching";
          memo?: string | null;
          status?: "pending" | "approved" | "rejected";
          applied_hourly_rate: number;
          calculated_pay: number;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          work_date?: string;
          start_time?: string;
          end_time?: string;
          duration_hours?: number;
          role_type?: "assistant" | "coaching";
          status?: "pending" | "approved" | "rejected";
          memo?: string | null;
          applied_hourly_rate?: number;
          calculated_pay?: number;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── payroll_summaries ──────────────────────────────────────────────────
      payroll_summaries: {
        Row: {
          id: string;
          worker_id: string;
          year: number;
          month: number; // 1-12
          total_hours: number;
          total_pay: number;
          status: "draft" | "finalized";
          finalized_at: string | null;
          finalized_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          year: number;
          month: number;
          total_hours?: number;
          total_pay?: number;
          status?: "draft" | "finalized";
          finalized_at?: string | null;
          finalized_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_hours?: number;
          total_pay?: number;
          status?: "draft" | "finalized";
          finalized_at?: string | null;
          finalized_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: {
      finalize_payroll: {
        Args: {
          p_worker_id: string;
          p_year: number;
          p_month: number;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}

// 테이블별 Row 타입 단축 별칭 — 서비스 레이어에서 편리하게 사용
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type HourlyRateRow = Database["public"]["Tables"]["hourly_rates"]["Row"];
export type WorkLogRow = Database["public"]["Tables"]["work_logs"]["Row"];
export type PayrollSummaryRow = Database["public"]["Tables"]["payroll_summaries"]["Row"];

// Insert/Update 타입 단축 별칭
export type WorkLogInsert = Database["public"]["Tables"]["work_logs"]["Insert"];
export type WorkLogUpdate = Database["public"]["Tables"]["work_logs"]["Update"];
export type PayrollSummaryInsert = Database["public"]["Tables"]["payroll_summaries"]["Insert"];
export type PayrollSummaryUpdate = Database["public"]["Tables"]["payroll_summaries"]["Update"];
export type HourlyRateInsert = Database["public"]["Tables"]["hourly_rates"]["Insert"];
