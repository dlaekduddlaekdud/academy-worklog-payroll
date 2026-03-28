-- ============================================================
-- work_logs 테이블
-- 근무 기록 저장 — 시급 스냅샷(applied_hourly_rate) 포함
-- ============================================================

CREATE TABLE IF NOT EXISTS public.work_logs (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID           NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  work_date           DATE           NOT NULL,
  start_time          TIME           NOT NULL,
  end_time            TIME           NOT NULL,
  duration_hours      NUMERIC(4, 2)  NOT NULL CHECK (duration_hours > 0),
  role_type           TEXT           NOT NULL CHECK (role_type IN ('assistant', 'coaching')),
  memo                TEXT,
  status              TEXT           NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  -- 제출 시점 시급 스냅샷 — 이후 시급 변경 영향 없음
  applied_hourly_rate INTEGER        NOT NULL CHECK (applied_hourly_rate >= 0),
  calculated_pay      INTEGER        NOT NULL CHECK (calculated_pay >= 0),
  submitted_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID           REFERENCES public.profiles(user_id),
  rejection_reason    TEXT,
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 근무자별 날짜 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_work_logs_worker_date
  ON public.work_logs (worker_id, work_date DESC);

-- 상태별 조회 인덱스 (관리자 pending 목록 조회 등)
CREATE INDEX IF NOT EXISTS idx_work_logs_status
  ON public.work_logs (status);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- finalized 월 보호 트리거
-- INSERT / UPDATE / DELETE 시 해당 월 payroll_summaries.status = 'finalized'이면 차단
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_finalized_month_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_work_date DATE;
BEGIN
  -- DELETE의 경우 OLD, INSERT/UPDATE는 NEW 기준
  IF TG_OP = 'DELETE' THEN
    v_work_date := OLD.work_date;
  ELSE
    v_work_date := NEW.work_date;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payroll_summaries
    WHERE worker_id = COALESCE(NEW.worker_id, OLD.worker_id)
      AND year      = EXTRACT(YEAR  FROM v_work_date)
      AND month     = EXTRACT(MONTH FROM v_work_date)
      AND status    = 'finalized'
  ) THEN
    RAISE EXCEPTION '확정된 월(%.%)의 근무 기록은 수정할 수 없습니다',
      EXTRACT(YEAR FROM v_work_date),
      EXTRACT(MONTH FROM v_work_date);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_work_logs_prevent_finalized
  BEFORE INSERT OR UPDATE OR DELETE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_finalized_month_changes();
