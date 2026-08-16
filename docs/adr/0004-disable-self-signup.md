# 0004. 자가 가입 경로를 없앤다

- 상태: 채택
- 관련: `008_harden_handle_new_user.sql`, `src/app/(admin)/admin/workers/new/`

## 맥락

학원 내부에서 쓰는 시스템이고, 계정은 관리자가 만든다는 것이 처음부터의
전제였다. 그런데 실제 코드에는 `/signup` 페이지와 Google 로그인이 열려 있었다.
문서와 코드가 어긋난 상태였다.

여기에 더 심각한 문제가 있었다. 가입 트리거가 클라이언트가 보낸 값을 그대로
믿고 있었다.

```sql
COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
```

`raw_user_meta_data`는 가입자가 직접 채우는 값이다. `signUp`은 anon key로
호출할 수 있는 공개 엔드포인트이고, anon key는 클라이언트 번들에 노출되는 게
정상이다. 아래 한 줄이면 외부인이 관리자가 된다.

```js
supabase.auth.signUp({ email, password, options: { data: { role: "admin" } } });
```

관리자가 되면 `is_admin()`이 true가 되어 RLS 전체가 무력화된다. 전 직원 급여
열람·수정, 정산 확정, 계정 생성까지 전부 가능해진다.

## 결정

세 층으로 막는다.

**DB.** 가입 트리거에서 role을 `'worker'`로 고정한다(`008`). 클라이언트 입력은
신뢰하지 않는다. 관리자 승격은 DB에서 수동으로만 한다.

**Supabase 설정.** Authentication에서 "Allow new users to sign up"을 끄고
Google provider도 끈다.

**앱.** `/signup` 페이지와 `SignupForm`, 로그인 화면의 Google 버튼을 제거한다.

## 앱에서 지우는 것만으로는 안 된다

이 점을 실제로 확인했다. 페이지를 지운 뒤 curl로 엔드포인트를 직접 쳐봤다.

```
POST /auth/v1/signup  →  200, 계정 생성됨
```

anon key는 클라이언트에 노출되는 값이므로 화면이 없어도 API는 그대로 열려
있다. UI 제거는 방어가 아니다. 대시보드 설정을 끈 뒤 다시 확인했다.

```
POST /auth/v1/signup  →  422 signup_disabled
```

Google provider를 따로 끈 이유는, OAuth는 가입과 로그인이 같은 경로라
`signInWithOAuth` 성공 시 해당 이메일의 유저가 없으면 자동으로 생성되기
때문이다. Email 쪽 가입만 막아도 OAuth로는 계정이 만들어진다.

## 함께 발견한 것

가입 경로를 닫으면서 관리자의 계정 생성 화면을 확인했더니, `/admin/workers/new`가
"Google 로그인하면 자동 등록됩니다"라는 안내 페이지로 덮여 있었다.
`createWorkerAction`과 `CreateWorkerForm`은 멀쩡히 존재하는데 화면에서만 분리돼
`CreateWorkerForm`이 어디서도 import되지 않는 상태였다. 페이지를 폼으로
되돌렸다.

계정 생성은 서버 전용 service_role 키로 `auth.admin.createUser()`를 호출하므로
공개 가입 차단 설정과 무관하게 동작한다.

## 결과

계정을 만들 수 있는 경로는 관리자 화면 하나뿐이다. 대신 클론해서 실행하는
사람이 Supabase 설정을 직접 꺼야 하므로, README의 실행 절차에 그 단계를 넣었다.
