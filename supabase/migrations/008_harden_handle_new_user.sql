-- ============================================================
-- handle_new_user 보안 강화
--
-- role을 raw_user_meta_data에서 읽고 있었다. 이 값은 가입자가
-- 직접 채워 보낼 수 있는 클라이언트 입력이므로 신뢰할 수 없다.
-- 신규 가입은 항상 worker로 고정하고, 관리자 승격은 DB에서
-- 수동으로만 수행한다.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    -- Google OAuth는 full_name, 이메일 가입은 name 필드 사용
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(NEW.email, '@', 1)
    ),
    -- 클라이언트 입력을 신뢰하지 않는다
    'worker'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 