-- ============================================================
-- 정산 확정을 단일 트랜잭션으로 원자화
--
-- 기존 finalizePayroll은 ①pending 검사 ②집계 upsert ③finalized
-- update의 3개 독립 쿼리였다. ①과 ③ 사이에 근무자가 기록을
-- 제출하거나 다른 관리자가 승인하면, 확정된 금액과 실제 근무
-- 기록이 어긋난 채로 확정된다. 급여 금액을 다루는 연산에
-- 트랜잭션 경계가 없는 상태였다.
--
-- supabase-js는 여러 문장을 하나의 트랜잭션으로 묶을 수 없으므로
-- 연산 전체를 Postgres 함수로 내린다. 함수 본문은 단일 트랜잭션에서
-- 실행되며, 요약 행을 FOR UPDATE로 잠가 동시 확정을 직렬화한다.
--
-- SECURITY DEFINER는 RLS를 우회하므로 권한 검사를 함수 안에서 직접
-- 한다. 확정자(finalized_by)도 인자로 받지 않고 auth.uid()에서
-- 가져온다 — 호출자가 보낸 값을 신뢰하면 008에서 고친 것과 같은
-- 종류의 취약점이 된다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_payroll(
  p_worker_id UUID,
  p_year      INT,
  p_month     INT
) RETURNS void AS $$
DECLARE
  v_start   DATE := make_date(p_year, p_month, 1);
  v_end     DATE := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  v_admin   UUID := auth.uid();
  v_pending INT;
  v_hours   NUMERIC;
  v_pay     INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다';
  END IF;

  -- 요약 행 잠금 — 같은 근무자/월에 대한 동시 확정을 직렬화한다.
  -- 행이 없으면 잠글 대상도 없으나, 그 경우는 아래 ON CONFLICT가 처리한다.
  PERFORM 1 FROM public.payroll_summaries
   WHERE worker_id = p_worker_id AND year = p_year AND month = p_month
   FOR UPDATE;

  SELECT count(*) INTO v_pending
    FROM public.work_logs
   WHERE worker_id = p_worker_id
     AND status = 'pending'
     AND work_date BETWEEN v_start AND v_end;

  IF v_pending > 0 THEN
    RAISE EXCEPTION '대기 중인 근무 기록 %건이 있습니다. 모두 처리 후 확정해주세요', v_pending;
  END IF;

  SELECT COALESCE(round(sum(duration_hours)::numeric, 2), 0),
         COALESCE(sum(calculated_pay), 0)
    INTO v_hours, v_pay
    FROM public.work_logs
   WHERE worker_id = p_worker_id
     AND status = 'approved'
     AND work_date BETWEEN v_start AND v_end;

  INSERT INTO public.payroll_summaries
    (worker_id, year, month, total_hours, total_pay, status, finalized_at, finalized_by)
  VALUES
    (p_worker_id, p_year, p_month, v_hours, v_pay, 'finalized', now(), v_admin)
  ON CONFLICT (worker_id, year, month) DO UPDATE
    SET total_hours  = EXCLUDED.total_hours,
        total_pay    = EXCLUDED.total_pay,
        status       = 'finalized',
        finalized_at = now(),
        finalized_by = v_admin,
        updated_at   = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
