-- ============================================================
-- 근무 기록 무결성 규칙 재정립
--
-- 007에서 finalized 월 보호 트리거를 "앱 레이어에서 처리한다"는
-- 이유로 삭제했으나, 앱 레이어 검사는 createWorkLog에만 있었고
-- update/delete에는 없었다. DB와 앱 어느 쪽도 확정 월을 지키지
-- 못하는 상태였으므로 트리거를 복원한다. 앱 레이어 검사도 함께
-- 복원하여 두 레이어 모두에서 막는다.
--
-- 또한 RLS는 worker에게 pending만 수정/삭제를 허용했는데, UI는
-- rejected 수정을 허용하고 있었다. 반려된 기록을 수정하면 RLS가
-- 0행을 반환하고 supabase-js는 이를 에러로 보지 않으므로,
-- "수정 완료" 응답과 함께 아무것도 저장되지 않았다.
-- 반려 후 재제출은 문서화된 핵심 플로우이므로 RLS를 rejected까지
-- 확장하고, 수정 결과는 pending으로 복귀하도록 WITH CHECK로 강제한다.
-- 승인된 기록의 수정 차단은 유지한다.
-- ============================================================

-- ─── 1. worker RLS: pending + rejected 허용, 결과는 pending 강제 ───

-- 005의 원본 정책과, 이후 별도로 만들어졌던 pending/rejected 정책을 모두 정리한다.
-- 후자는 WITH CHECK에 status 조건이 없어 근무자가 수정 요청에 status를 실어
-- 보내면 스스로 approved로 만들 수 있었다. 정책은 OR로 합쳐지므로 느슨한 쪽이
-- 이긴다 — 새 정책만 추가하는 것으로는 막히지 않는다.
DROP POLICY IF EXISTS "worker: pending 근무 기록 UPDATE" ON public.work_logs;
DROP POLICY IF EXISTS "worker: pending 근무 기록 DELETE" ON public.work_logs;
DROP POLICY IF EXISTS "worker: pending/rejected 근무 기록 UPDATE" ON public.work_logs;
DROP POLICY IF EXISTS "worker: pending/rejected 근무 기록 DELETE" ON public.work_logs;

CREATE POLICY "worker: 미승인 근무 기록 UPDATE"
  ON public.work_logs FOR UPDATE
  USING (auth.uid() = worker_id AND status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = worker_id AND status = 'pending');

CREATE POLICY "worker: 미승인 근무 기록 DELETE"
  ON public.work_logs FOR DELETE
  USING (auth.uid() = worker_id AND status IN ('pending', 'rejected'));

-- ─── 2. finalized 월 보호 트리거 복원 (003 정의) ───

CREATE OR REPLACE FUNCTION public.prevent_finalized_month_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_work_date DATE;
BEGIN
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

DROP TRIGGER IF EXISTS trg_work_logs_prevent_finalized ON public.work_logs;

CREATE TRIGGER trg_work_logs_prevent_finalized
  BEFORE INSERT OR UPDATE OR DELETE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_finalized_month_changes();
