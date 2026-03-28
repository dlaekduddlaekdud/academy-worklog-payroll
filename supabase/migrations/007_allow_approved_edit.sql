-- finalized 월 보호 트리거 제거 (앱 레이어에서 처리)
DROP TRIGGER IF EXISTS trg_work_logs_prevent_finalized ON public.work_logs;
DROP FUNCTION IF EXISTS public.prevent_finalized_month_changes();
