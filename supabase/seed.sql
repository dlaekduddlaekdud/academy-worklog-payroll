-- ============================================================
-- 개발용 시드 데이터
-- 주의: profiles는 직접 INSERT (auth.users는 Supabase Dashboard에서 생성)
--       실제 auth.users.id와 매핑되어야 RLS가 정상 작동함
-- ============================================================

-- UUID 상수 (mock 데이터와 동일하게 맞춤)
-- 실제 환경에서는 Dashboard에서 생성한 auth.users.id로 교체할 것

DO $$
DECLARE
  v_admin_id  UUID := 'admin-001-uuid-0000-000000000000'::UUID;
  v_worker1   UUID := 'worker-001-uuid-0000-000000000001'::UUID;
  v_worker2   UUID := 'worker-002-uuid-0000-000000000002'::UUID;
  v_worker3   UUID := 'worker-003-uuid-0000-000000000003'::UUID;
BEGIN

-- ─── profiles ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (user_id, email, name, role, is_active)
VALUES
  (v_admin_id, 'admin@academy.com',       '관리자',  'admin',  true),
  (v_worker1,  'kim.assist@academy.com',  '김조교',  'worker', true),
  (v_worker2,  'lee.assist@academy.com',  '이조교',  'worker', true),
  (v_worker3,  'park.coach@academy.com',  '박코치',  'worker', true)
ON CONFLICT (user_id) DO NOTHING;

-- ─── hourly_rates ──────────────────────────────────────────────────────────
INSERT INTO public.hourly_rates (id, worker_id, role_type, rate, effective_from, created_by)
VALUES
  ('hr-001-uuid-0000-000000000001'::UUID, v_worker1, 'assistant', 15000, '2026-01-01', v_admin_id),
  ('hr-002-uuid-0000-000000000002'::UUID, v_worker2, 'assistant', 15000, '2026-01-01', v_admin_id),
  ('hr-003-uuid-0000-000000000003'::UUID, v_worker3, 'coaching',  18000, '2026-01-01', v_admin_id),
  -- 박코치 3월 시급 인상
  ('hr-004-uuid-0000-000000000004'::UUID, v_worker3, 'coaching',  20000, '2026-03-01', v_admin_id)
ON CONFLICT DO NOTHING;

-- ─── work_logs ─────────────────────────────────────────────────────────────
INSERT INTO public.work_logs (
  id, worker_id, work_date, start_time, end_time, duration_hours,
  role_type, memo, status, applied_hourly_rate, calculated_pay,
  submitted_at, reviewed_at, reviewed_by, rejection_reason
)
VALUES
  -- 김조교 2월 (approved)
  ('wl-001-uuid-0000-000000000001'::UUID, v_worker1,
   '2026-02-03', '09:00', '13:00', 4.0,
   'assistant', '수학 수업 보조', 'approved', 15000, 60000,
   '2026-02-03T13:10:00Z', '2026-02-04T10:00:00Z', v_admin_id, NULL),

  ('wl-002-uuid-0000-000000000002'::UUID, v_worker1,
   '2026-02-10', '14:00', '18:00', 4.0,
   'assistant', NULL, 'approved', 15000, 60000,
   '2026-02-10T18:05:00Z', '2026-02-11T09:00:00Z', v_admin_id, NULL),

  -- 김조교 3월 (pending)
  ('wl-003-uuid-0000-000000000003'::UUID, v_worker1,
   '2026-03-04', '10:00', '14:00', 4.0,
   'assistant', '영어 수업 보조', 'pending', 15000, 60000,
   '2026-03-04T14:05:00Z', NULL, NULL, NULL),

  -- 이조교 2월 (approved)
  ('wl-004-uuid-0000-000000000004'::UUID, v_worker2,
   '2026-02-05', '09:00', '12:30', 3.5,
   'assistant', '과학 실험 보조', 'approved', 15000, 52500,
   '2026-02-05T12:35:00Z', '2026-02-06T09:00:00Z', v_admin_id, NULL),

  -- 이조교 2월 (rejected)
  ('wl-005-uuid-0000-000000000005'::UUID, v_worker2,
   '2026-02-12', '13:00', '17:00', 4.0,
   'assistant', NULL, 'rejected', 15000, 60000,
   '2026-02-12T17:10:00Z', '2026-02-13T10:00:00Z', v_admin_id,
   '시간 기록이 실제 근무 시간과 다릅니다. 재확인 후 다시 제출해주세요.'),

  -- 이조교 3월 (pending)
  ('wl-006-uuid-0000-000000000006'::UUID, v_worker2,
   '2026-03-02', '09:00', '13:00', 4.0,
   'assistant', '3월 첫 수업 보조', 'pending', 15000, 60000,
   '2026-03-02T13:05:00Z', NULL, NULL, NULL),

  -- 박코치 2월 (approved)
  ('wl-007-uuid-0000-000000000007'::UUID, v_worker3,
   '2026-02-06', '15:00', '18:00', 3.0,
   'coaching', '수학 1:1 코칭', 'approved', 18000, 54000,
   '2026-02-06T18:10:00Z', '2026-02-07T09:00:00Z', v_admin_id, NULL),

  ('wl-008-uuid-0000-000000000008'::UUID, v_worker3,
   '2026-02-20', '16:00', '19:00', 3.0,
   'coaching', '영어 집중 코칭', 'approved', 18000, 54000,
   '2026-02-20T19:05:00Z', '2026-02-21T10:00:00Z', v_admin_id, NULL),

  ('wl-009-uuid-0000-000000000009'::UUID, v_worker3,
   '2026-02-27', '15:00', '18:30', 3.5,
   'coaching', NULL, 'approved', 18000, 63000,
   '2026-02-27T18:35:00Z', '2026-02-28T09:00:00Z', v_admin_id, NULL),

  -- 박코치 3월 (pending) — 3월 인상된 시급은 work_logs의 appliedHourlyRate 기준
  ('wl-010-uuid-0000-000000000010'::UUID, v_worker3,
   '2026-03-05', '15:00', '18:00', 3.0,
   'coaching', '3월 첫 코칭 세션', 'pending', 18000, 54000,
   '2026-03-05T18:10:00Z', NULL, NULL, NULL),

  ('wl-011-uuid-0000-000000000011'::UUID, v_worker3,
   '2026-03-10', '16:00', '20:00', 4.0,
   'coaching', NULL, 'pending', 18000, 72000,
   '2026-03-10T20:05:00Z', NULL, NULL, NULL)

ON CONFLICT DO NOTHING;

-- ─── payroll_summaries ─────────────────────────────────────────────────────
INSERT INTO public.payroll_summaries (
  id, worker_id, year, month, total_hours, total_pay, status, finalized_at, finalized_by
)
VALUES
  -- 2월 finalized
  ('ps-001-uuid-0000-000000000001'::UUID, v_worker1, 2026, 2, 8.0,  120000, 'finalized', '2026-03-05T10:00:00Z', v_admin_id),
  ('ps-002-uuid-0000-000000000002'::UUID, v_worker2, 2026, 2, 3.5,   52500, 'finalized', '2026-03-05T10:00:00Z', v_admin_id),
  ('ps-003-uuid-0000-000000000003'::UUID, v_worker3, 2026, 2, 9.5,  171000, 'finalized', '2026-03-05T10:00:00Z', v_admin_id),
  -- 3월 draft
  ('ps-004-uuid-0000-000000000004'::UUID, v_worker1, 2026, 3, 4.0,   60000, 'draft', NULL, NULL),
  ('ps-005-uuid-0000-000000000005'::UUID, v_worker2, 2026, 3, 4.0,   60000, 'draft', NULL, NULL),
  ('ps-006-uuid-0000-000000000006'::UUID, v_worker3, 2026, 3, 7.0,  126000, 'draft', NULL, NULL)
ON CONFLICT (worker_id, year, month) DO NOTHING;

END $$;
