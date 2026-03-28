-- ============================================================
-- RLS (Row Level Security) 정책
-- 역할 판별: profiles.role 컬럼 기준
-- ============================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

-- admin 여부 확인 헬퍼 함수 (각 정책에서 반복 호출 방지용)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role    = 'admin'
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ─────────────────────────────────────────────────────────────

-- 본인은 자기 프로필 조회 가능
CREATE POLICY "worker: 본인 프로필 조회"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 관리자는 전체 프로필 조회 가능
CREATE POLICY "admin: 전체 프로필 조회"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 관리자만 프로필 INSERT (새 근무자 등록)
CREATE POLICY "admin: 프로필 INSERT"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- 관리자만 프로필 UPDATE (활성 여부 등 변경)
CREATE POLICY "admin: 프로필 UPDATE"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ─── hourly_rates ──────────────────────────────────────────────────────────

-- 근무자는 본인 시급 이력만 조회
CREATE POLICY "worker: 본인 시급 조회"
  ON public.hourly_rates FOR SELECT
  USING (auth.uid() = worker_id);

-- 관리자는 전체 시급 조회
CREATE POLICY "admin: 전체 시급 조회"
  ON public.hourly_rates FOR SELECT
  USING (public.is_admin());

-- 관리자만 시급 등록 가능
CREATE POLICY "admin: 시급 INSERT"
  ON public.hourly_rates FOR INSERT
  WITH CHECK (public.is_admin());

-- 시급은 수정 불가 원칙 — 관리 도구 대응용으로만 허용
CREATE POLICY "admin: 시급 UPDATE"
  ON public.hourly_rates FOR UPDATE
  USING (public.is_admin());

-- ─── work_logs ─────────────────────────────────────────────────────────────

-- 근무자는 본인 기록만 조회
CREATE POLICY "worker: 본인 근무 기록 조회"
  ON public.work_logs FOR SELECT
  USING (auth.uid() = worker_id);

-- 근무자는 본인 기록 INSERT 가능
CREATE POLICY "worker: 근무 기록 INSERT"
  ON public.work_logs FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- 근무자는 pending 상태인 본인 기록만 수정 가능
CREATE POLICY "worker: pending 근무 기록 UPDATE"
  ON public.work_logs FOR UPDATE
  USING (auth.uid() = worker_id AND status = 'pending')
  WITH CHECK (auth.uid() = worker_id);

-- 근무자는 pending 상태인 본인 기록만 삭제 가능
CREATE POLICY "worker: pending 근무 기록 DELETE"
  ON public.work_logs FOR DELETE
  USING (auth.uid() = worker_id AND status = 'pending');

-- 관리자는 전체 근무 기록 조회
CREATE POLICY "admin: 전체 근무 기록 조회"
  ON public.work_logs FOR SELECT
  USING (public.is_admin());

-- 관리자는 상태 변경 (승인/반려) 가능
CREATE POLICY "admin: 근무 기록 UPDATE"
  ON public.work_logs FOR UPDATE
  USING (public.is_admin());

-- ─── payroll_summaries ─────────────────────────────────────────────────────

-- 근무자는 본인 정산 정보만 조회
CREATE POLICY "worker: 본인 정산 조회"
  ON public.payroll_summaries FOR SELECT
  USING (auth.uid() = worker_id);

-- 관리자는 전체 정산 CRUD 가능
CREATE POLICY "admin: 전체 정산 조회"
  ON public.payroll_summaries FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin: 정산 INSERT"
  ON public.payroll_summaries FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admin: 정산 UPDATE"
  ON public.payroll_summaries FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin: 정산 DELETE"
  ON public.payroll_summaries FOR DELETE
  USING (public.is_admin());
