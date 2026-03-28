-- ============================================================
-- payroll_summaries 테이블
-- 월별 급여 정산 — finalized 상태가 되면 해당 월 근무 기록 수정 불가
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payroll_summaries (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id    UUID           NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  year         INTEGER        NOT NULL CHECK (year >= 2000),
  month        INTEGER        NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_hours  NUMERIC(6, 2)  NOT NULL DEFAULT 0,
  total_pay    INTEGER        NOT NULL DEFAULT 0,
  status       TEXT           NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'finalized')),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID           REFERENCES public.profiles(user_id),
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),

  -- 동일 근무자의 동일 연월 중복 방지
  UNIQUE (worker_id, year, month)
);

CREATE TRIGGER trg_payroll_summaries_updated_at
  BEFORE UPDATE ON public.payroll_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
