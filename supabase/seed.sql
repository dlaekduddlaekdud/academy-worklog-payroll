-- ============================================================
-- 개발용 시드 데이터
--
-- 사전 조건: Supabase Auth에 아래 4개 계정을 먼저 만들어 둔다.
--   admin@academy.com / kim.assist@academy.com
--   lee.assist@academy.com / park.coach@academy.com
-- (Dashboard > Authentication > Users > Add user)
--
-- 계정을 만들면 handle_new_user 트리거가 profiles를 role='worker'로
-- 생성한다. 이 스크립트는 그 프로필의 이름과 역할을 채워 넣고,
-- 시급/근무기록/정산 데이터를 넣는다.
--
-- UUID를 리터럴로 박지 않고 이메일로 조회하는 이유:
-- auth.users.id는 계정 생성 시점에 정해지므로 미리 알 수 없고,
-- profiles.user_id가 auth.users를 참조하므로 임의의 UUID를 넣으면
-- 외래키에서 실패한다.
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_worker1  UUID;
  v_worker2  UUID;
  v_worker3  UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@academy.com';
  SELECT id INTO v_worker1  FROM auth.users WHERE email = 'kim.assist@academy.com';
  SELECT id INTO v_worker2  FROM auth.users WHERE email = 'lee.assist@academy.com';
  SELECT id INTO v_worker3  FROM auth.users WHERE email = 'park.coach@academy.com';

  IF v_admin_id IS NULL OR v_worker1 IS NULL OR v_worker2 IS NULL OR v_worker3 IS NULL THEN
    RAISE EXCEPTION '4개 계정을 Auth에 먼저 생성해야 한다. 파일 상단 주석 참고.';
  END IF;

  -- ─── profiles ────────────────────────────────────────────────
  -- 트리거가 이미 생성했으므로 이름/역할만 갱신한다.
  UPDATE public.profiles SET name = '관리자', role = 'admin',  is_active = true WHERE user_id = v_admin_id;
  UPDATE public.profiles SET name = '김조교', role = 'worker', is_active = true WHERE user_id = v_worker1;
  UPDATE public.profiles SET name = '이조교', role = 'worker', is_active = true WHERE user_id = v_worker2;
  UPDATE public.profiles SET name = '박코치', role = 'worker', is_active = true WHERE user_id = v_worker3;

  -- ─── hourly_rates ────────────────────────────────────────────
  INSERT INTO public.hourly_rates (worker_id, role_type, rate, effective_from, created_by)
  VALUES
    (v_worker1, 'assistant', 15000, '2026-01-01', v_admin_id),
    (v_worker2, 'assistant', 15000, '2026-01-01', v_admin_id),
    (v_worker3, 'coaching',  18000, '2026-01-01', v_admin_id),
    -- 박코치 3월 시급 인상. 2월 근무의 applied_hourly_rate는 18000으로 남아야 한다.
    (v_worker3, 'coaching',  20000, '2026-03-01', v_admin_id)
  ON CONFLICT DO NOTHING;

  -- ─── work_logs ───────────────────────────────────────────────
  INSERT INTO public.work_logs (
    worker_id, work_date, start_time, end_time, duration_hours,
    role_type, memo, status, applied_hourly_rate, calculated_pay,
    submitted_at, reviewed_at, reviewed_by, rejection_reason
  )
  VALUES
    -- 김조교 2월 (확정된 달)
    (v_worker1, '2026-02-03', '09:00', '13:00', 4.0, 'assistant', '수학 수업 보조',
     'approved', 15000, 60000, '2026-02-03T13:10:00Z', '2026-02-04T10:00:00Z', v_admin_id, NULL),
    (v_worker1, '2026-02-10', '14:00', '18:00', 4.0, 'assistant', NULL,
     'approved', 15000, 60000, '2026-02-10T18:05:00Z', '2026-02-11T09:00:00Z', v_admin_id, NULL),
    -- 김조교 3월
    (v_worker1, '2026-03-04', '10:00', '14:00', 4.0, 'assistant', '영어 수업 보조',
     'pending', 15000, 60000, '2026-03-04T14:05:00Z', NULL, NULL, NULL),

    -- 이조교 2월
    (v_worker2, '2026-02-05', '09:00', '12:30', 3.5, 'assistant', '과학 실험 보조',
     'approved', 15000, 52500, '2026-02-05T12:35:00Z', '2026-02-06T09:00:00Z', v_admin_id, NULL),
    (v_worker2, '2026-02-12', '13:00', '17:00', 4.0, 'assistant', NULL,
     'rejected', 15000, 60000, '2026-02-12T17:10:00Z', '2026-02-13T10:00:00Z', v_admin_id,
     '시간 기록이 실제 근무 시간과 다릅니다. 재확인 후 다시 제출해주세요.'),
    -- 이조교 3월
    (v_worker2, '2026-03-02', '09:00', '13:00', 4.0, 'assistant', '3월 첫 수업 보조',
     'pending', 15000, 60000, '2026-03-02T13:05:00Z', NULL, NULL, NULL),

    -- 박코치 2월 — 시급 인상 전이므로 18000이 박혀 있다
    (v_worker3, '2026-02-06', '15:00', '18:00', 3.0, 'coaching', '수학 1:1 코칭',
     'approved', 18000, 54000, '2026-02-06T18:10:00Z', '2026-02-07T09:00:00Z', v_admin_id, NULL),
    (v_worker3, '2026-02-20', '16:00', '19:00', 3.0, 'coaching', '영어 집중 코칭',
     'approved', 18000, 54000, '2026-02-20T19:05:00Z', '2026-02-21T10:00:00Z', v_admin_id, NULL),
    (v_worker3, '2026-02-27', '15:00', '18:30', 3.5, 'coaching', NULL,
     'approved', 18000, 63000, '2026-02-27T18:35:00Z', '2026-02-28T09:00:00Z', v_admin_id, NULL),
    -- 박코치 3월 — 인상된 20000이 적용된다
    (v_worker3, '2026-03-05', '15:00', '18:00', 3.0, 'coaching', '3월 첫 코칭 세션',
     'pending', 20000, 60000, '2026-03-05T18:10:00Z', NULL, NULL, NULL),
    (v_worker3, '2026-03-10', '16:00', '20:00', 4.0, 'coaching', NULL,
     'pending', 20000, 80000, '2026-03-10T20:05:00Z', NULL, NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- ─── payroll_summaries ───────────────────────────────────────
  -- 2월만 확정. 3월은 요약 행을 만들지 않는다 — 확정 전 집계는
  -- 조회 시점에 실시간으로 계산하므로 미리 저장하지 않는다.
  INSERT INTO public.payroll_summaries
    (worker_id, year, month, total_hours, total_pay, status, finalized_at, finalized_by)
  VALUES
    (v_worker1, 2026, 2, 8.0,  120000, 'finalized', '2026-03-05T10:00:00Z', v_admin_id),
    (v_worker2, 2026, 2, 3.5,   52500, 'finalized', '2026-03-05T10:00:00Z', v_admin_id),
    (v_worker3, 2026, 2, 9.5,  171000, 'finalized', '2026-03-05T10:00:00Z', v_admin_id)
  ON CONFLICT (worker_id, year, month) DO NOTHING;

END $$;
