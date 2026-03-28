-- ============================================================
-- hourly_rates 테이블
-- 근무자별 역할별 시급 이력 관리
-- 시급은 수정 불가 — 변경 시 새 레코드 추가
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hourly_rates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      UUID        NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role_type      TEXT        NOT NULL CHECK (role_type IN ('assistant', 'coaching')),
  rate           INTEGER     NOT NULL CHECK (rate >= 0),
  -- 이 날짜 이후 work_date에 대해 해당 시급 적용
  effective_from DATE        NOT NULL,
  created_by     UUID        NOT NULL REFERENCES public.profiles(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 유효 시급 조회 성능을 위한 복합 인덱스
-- (worker_id, role_type, effective_from DESC) 순으로 조회하는 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_hourly_rates_lookup
  ON public.hourly_rates (worker_id, role_type, effective_from DESC);
