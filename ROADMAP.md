# academy-worklog-payroll 로드맵

## 프로젝트 개요

**프로젝트명:** academy-worklog-payroll
**설명:** 학원 근무자(조교/코칭) 근무 기록 및 역할별 급여 계산 웹 서비스
**유형:** 포트폴리오용 개인 프로젝트

### 핵심 가치

- 근무자가 직접 근무 내역을 입력하고, 관리자가 승인/반려하는 워크플로우
- 같은 근무자라도 역할(조교/코칭)에 따라 시급이 다르게 적용
- 근무 기록 시점의 시급을 스냅샷으로 저장하여 이력 보존
- 월별 급여 정산 및 확정 처리

### 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript strict |
| 백엔드/DB/인증 | Supabase (Auth + PostgreSQL + RLS) |
| 스타일링 | Tailwind CSS v3 + shadcn/ui (new-york) |
| 폼/유효성 검사 | React Hook Form + Zod |
| 날짜 처리 | date-fns |
| 알림 | sonner (Toast) |
| E2E 테스트 | Playwright MCP |

### DB 스키마 (참고)

```
profiles: user_id, name, email, role(admin|worker), is_active, created_at, updated_at
  → email: auth.users 동기화, 관리자 화면 식별 용도
  → is_active: 퇴사자 처리 (삭제 시 FK 무결성 깨지므로 비활성화로 처리)

hourly_rates: id, worker_id, role_type(assistant|coaching), rate, effective_from, created_by
  → INDEX: (worker_id, role_type, effective_from) — 유효 시급 조회 성능
  → 유효 시급 조회: effective_from <= work_date ORDER BY effective_from DESC LIMIT 1

work_logs: id, worker_id, work_date, start_time, end_time, duration_hours, role_type, memo,
  status(pending|approved|rejected), applied_hourly_rate, calculated_pay,
  submitted_at, reviewed_at, reviewed_by, rejection_reason, updated_at
  → rejection_reason 한계: 반려→재제출→재반려 시 이전 사유가 덮어씌워짐 (MVP 허용 범위)

payroll_summaries: id, worker_id, year, month, total_hours, total_pay,
  status(draft|finalized), finalized_at, finalized_by
  → UNIQUE(worker_id, year, month): 동일 근무자의 동일 월 중복 정산 방지 필수
```

---

## 개발 원칙

### 구조 우선 접근법

1. **인프라 먼저, UI 나중에** - DB 스키마와 인증을 먼저 설정한 후 실제 인증 컨텍스트 기반으로 UI를 구현한다. 인증 없이 UI를 만들면 레이아웃/사이드바/권한 분기를 나중에 전면 리팩토링해야 한다.
2. **타입 먼저, 구현 나중에** - TypeScript 인터페이스와 Zod 스키마를 먼저 정의한 후 구현한다.
3. **컴포넌트 먼저, 페이지 나중에** - 재사용 가능한 공통 컴포넌트를 먼저 만든 후 페이지를 조립한다.

### Playwright MCP E2E 테스트 필수 원칙

- 모든 Phase의 구현 완료 시 Playwright MCP 기반 E2E 테스트를 수행한다.
- 핵심 사용자 흐름(근무 기록 입력, 승인/반려, 급여 정산)은 반드시 E2E 테스트로 검증한다.
- UI 변경 시 관련 테스트를 함께 업데이트한다.

---

## 개발 워크플로우

```
1. 작업 계획    →  ROADMAP.md에서 다음 Task 확인
2. 작업 생성    →  Task 파일 생성 (tasks/task-XXX.md)
3. 작업 구현    →  구현 사항 체크리스트 기반으로 개발
4. 테스트       →  Playwright MCP E2E 테스트 수행
5. 로드맵 업데이트 →  완료된 항목 체크 표시 (✅)
```

### Task 파일 구조 템플릿

```markdown
# Task XXX: [제목]

## 개요
- **목표:** [이 Task가 달성하려는 것]
- **예상 소요 시간:** [시간]
- **관련 기능:** [관련된 비즈니스 기능]
- **의존성:** [선행 Task 번호]

## 구현 사항
- [ ] 구현 항목 1
- [ ] 구현 항목 2

## 수락 기준
- [ ] 기준 1
- [ ] 기준 2

## 테스트 체크리스트 (Playwright MCP)
- [ ] 테스트 시나리오 1
- [ ] 테스트 시나리오 2

## 관련 파일
- `src/...`
```

---

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

> 프로젝트 초기 설정, 라우팅, 타입 시스템 구축

- [x] Task 001: 프로젝트 구조 및 라우팅 설정
- [x] Task 002: 타입 정의 및 인터페이스 설계

### Phase 2: 인프라 설정 (DB + 인증)

> UI 작업 전에 인증 컨텍스트와 DB 스키마를 먼저 확정
> 인증 없이 UI를 만들면 레이아웃/권한 분기를 나중에 전면 수정해야 함

- [x] Task 006: 데이터베이스 스키마 및 Supabase 초기 설정
  - Supabase 마이그레이션 실제 적용 완료 (2026-03-19): hourly_rates, work_logs, payroll_summaries 테이블 생성, RLS 정책 전체 적용 (is_admin() 함수 포함)
- [x] Task 007: 인증 시스템 및 권한 관리
  - 관리자/근무자 역할 분기 수정 (2026-03-19): 관리자도 /worker/* 페이지 접근 가능, 헤더/사이드바에 "관리자 패널" 버튼 표시, Worker layout에 isAdmin prop 추가

### Phase 3: UI/UX 완성 (실제 인증 컨텍스트 기반)

> 인증된 사용자 정보를 레이아웃/사이드바에 반영하면서 UI 구현
> Phase 3까지는 더미 데이터 허용, 실제 데이터 연결은 Phase 4에서 수행

- [x] Task 003: 공통 컴포넌트 라이브러리 구현
- [x] Task 004: 근무자 UI/UX 완성
- [x] Task 005: 관리자 UI/UX 완성

### Phase 4: 핵심 비즈니스 로직 구현

> CRUD, 시급 적용, 승인/반려, 정산 등 실제 데이터 연결

- [x] Task 008: 근무 기록 CRUD 및 시급 적용 로직
  - 시급 CRUD 완성 (2026-03-19): 시급 등록/수정/삭제 기능, HourlyRateManagerClient.tsx 신규 생성, 동일 effective_from 시 created_at 기준 최신 항목 적용 로직, updateHourlyRate/deleteHourlyRate 서버 액션 추가
  - 시급 미설정 처리: actions.ts에서 null 반환 → showError 토스트 안내 (이미 구현됨 확인)
  - admin/workers role 필터: .eq("role", "worker") 이미 적용됨 확인
  - Google OAuth 이름 처리 (2026-03-20): auth/callback route에서 name 빈 값 시 raw_user_meta_data 기반 업데이트, 마이그레이션 006 추가
- [x] Task 009: 승인/반려 플로우 구현
- [x] Task 010-A: 월별 급여 정산 (집계, draft/finalized 상태 관리)
- [x] Task 010-B: CSV 다운로드

### Phase 5: 품질 + 배포 ← MVP 완료 기준

> 여기까지 완료되면 실제 학원에서 사용 가능한 상태

- [x] Task 011: 핵심 기능 통합 테스트 (핵심 플로우 3개)
  - 플로우 A/B/C 전체 통합 검증 완료 (2026-03-20)
  - 플로우 A: 근무자 로그인 → 근무 기록 입력 → 관리자 승인 → 정산 집계 → 급여 확인
  - 플로우 B: 관리자 반려 → 근무자 수정 재제출 → 관리자 승인 → 정산 반영 확인
  - 플로우 C: 정산 확정 → 근무 기록 수정 차단 → 확정 취소 → 급여 확정 버튼 재활성화
  - 테스트 중 발견/수정한 버그 (2026-03-20):
    1. 날짜 버그: 모든 날짜 계산에서 `-31` 하드코딩 → `new Date(year, month, 0).getDate()` 동적 계산으로 수정 (영향 파일 11개)
    2. PayrollTable.tsx: 확정 취소 버튼 미구현 → "확정 취소" 버튼 추가
    3. WorkLogTable.tsx: 반려 기록에 수정/삭제 버튼 미표시 → `pending || rejected` 조건으로 수정
    4. [id]/edit/page.tsx: 반려 기록 edit 페이지 접근 차단 → `pending || rejected` 허용
    5. actions.ts (worker): 반려 기록 수정 시 status 미변경 → `pending` 복귀 + 반려 정보 초기화
- [x] Task 012: 사용자 경험 향상
  - UI/UX 버그 수정 (2026-03-19): 달력 투명도 문제 해결 (tailwind.config.ts hsl->var 변환), 기본 근무 시간 17:00~22:00 변경, WorkerTable.tsx buttonVariants 서버 컴포넌트 import 오류 수정, createHourlyRate 에러 메시지 디버깅 개선
- [x] Task 014: 배포 및 모니터링

### Phase 6: 부가기능 (Post-MVP)

> 시간 여유가 있을 때 포트폴리오 완성도를 높이기 위한 작업

- [ ] Task 013: 성능 최적화 (SEO 제외)
- [ ] Task 015: 대시보드 통계 및 차트 (관리자용)
- [ ] Task 016: 포트폴리오 문서화 및 데모 데이터 준비

---

## 작업별 세부 사항

---

### Task 001: 프로젝트 구조 및 라우팅 설정

#### 개요

- **목표:** Next.js 16 프로젝트 초기화 및 App Router 기반 라우팅 구조 설정
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 전체 애플리케이션 기반
- **의존성:** 없음

#### 구현 사항

- [ ] Next.js 16 프로젝트 생성 (TypeScript strict, App Router)
- [ ] Tailwind CSS v3 설정
- [ ] shadcn/ui 초기화 (new-york 테마)
- [ ] 폴더 구조 설계 및 생성
  - `src/app/` - 페이지 라우팅
  - `src/components/` - 공통 컴포넌트
  - `src/components/ui/` - shadcn/ui 컴포넌트
  - `src/lib/` - 유틸리티, Supabase 클라이언트
  - `src/types/` - 타입 정의
  - `src/hooks/` - 커스텀 훅
  - `src/constants/` - 상수
  - `src/mocks/` - 더미 데이터
- [ ] App Router 라우팅 구조 설정
  - `/` - 랜딩 / 리다이렉트
  - `/login` - 로그인
  - `/worker/dashboard` - 근무자 대시보드
  - `/worker/work-logs` - 내 근무 내역
  - `/worker/work-logs/new` - 근무 기록 입력
  - `/worker/payroll` - 급여 확인
  - `/admin/dashboard` - 관리자 대시보드
  - `/admin/workers` - 근무자 관리
  - `/admin/workers/[id]/rates` - 시급 설정
  - `/admin/work-logs` - 근무 기록 관리 (승인/반려)
  - `/admin/payroll` - 월별 급여 정산
- [ ] 레이아웃 컴포넌트 구성 (RootLayout, WorkerLayout, AdminLayout)
- [ ] 기본 미들웨어 구조 설정 (인증 가드 placeholder)
- [ ] ESLint, Prettier 설정
- [ ] 절대 경로 import 설정 (`@/`)

#### 수락 기준

- [ ] `npm run dev`로 정상 실행 확인
- [ ] 모든 라우트에 placeholder 페이지가 렌더링됨
- [ ] TypeScript strict 모드에서 에러 없음
- [ ] shadcn/ui 컴포넌트가 정상 렌더링됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 각 라우트 접속 시 placeholder 페이지가 표시되는지 확인
- [ ] 레이아웃이 올바르게 적용되는지 확인
- [ ] 네비게이션 링크가 정상 동작하는지 확인

#### 관련 파일

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(worker)/layout.tsx`
- `src/app/(admin)/layout.tsx`
- `src/middleware.ts`
- `tailwind.config.ts`
- `tsconfig.json`

---

### Task 002: 타입 정의 및 인터페이스 설계

#### 개요

- **목표:** 전체 애플리케이션에서 사용할 TypeScript 타입과 Zod 스키마 정의
- **예상 소요 시간:** 2~3시간
- **관련 기능:** 전체 데이터 모델
- **의존성:** Task 001

#### 구현 사항

- [ ] DB 테이블 매핑 타입 정의
  - `Profile` (user_id, name, email, role, is_active, created_at, updated_at)
  - `HourlyRate` (id, worker_id, role_type, rate, effective_from, created_by)
  - `WorkLog` (id, worker_id, work_date, start_time, end_time, duration_hours, role_type, memo, status, applied_hourly_rate, calculated_pay, submitted_at, reviewed_at, reviewed_by, rejection_reason, updated_at)
  - `PayrollSummary` (id, worker_id, year, month, total_hours, total_pay, status, finalized_at, finalized_by)
- [ ] Enum 타입 정의
  - `UserRole`: admin | worker
  - `RoleType`: assistant | coaching
  - `WorkLogStatus`: pending | approved | rejected
  - `PayrollStatus`: draft | finalized
- [ ] Zod 유효성 검사 스키마 정의
  - `workLogFormSchema` (근무 기록 입력 폼)
  - `hourlyRateFormSchema` (시급 설정 폼)
  - `rejectionReasonSchema` (반려 사유)
- [ ] API 응답 타입 정의
  - `ApiResponse<T>` 공통 래퍼
  - 목록 조회 응답 (페이지네이션 포함)
- [ ] 컴포넌트 Props 타입 정의 (주요 공통 컴포넌트)
- [ ] 더미 데이터 생성 (각 타입별 샘플 데이터)

#### 수락 기준

- [ ] 모든 타입이 TypeScript strict 모드에서 에러 없이 컴파일됨
- [ ] Zod 스키마와 TypeScript 타입이 일치함 (`z.infer` 활용)
- [ ] 더미 데이터가 타입에 맞게 생성됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 타입 정의 자체는 E2E 테스트 대상이 아님 (빌드 시 타입 체크로 검증)

#### 관련 파일

- `src/types/database.ts`
- `src/types/enums.ts`
- `src/types/api.ts`
- `src/types/index.ts`
- `src/lib/validations/work-log.ts`
- `src/lib/validations/hourly-rate.ts`
- `src/mocks/profiles.ts`
- `src/mocks/work-logs.ts`
- `src/mocks/hourly-rates.ts`
- `src/mocks/payroll-summaries.ts`

---

### Task 003: 공통 컴포넌트 라이브러리 구현

#### 개요

- **목표:** 전체 애플리케이션에서 재사용할 공통 UI 컴포넌트 구현
- **예상 소요 시간:** 4~5시간
- **관련 기능:** 전체 UI
- **의존성:** Task 001, Task 002

#### 구현 사항

- [ ] shadcn/ui 컴포넌트 추가
  - Button, Input, Label, Select, Textarea
  - Card, Table, Badge, Dialog, Sheet
  - Calendar, DatePicker, Tabs
  - Skeleton, Separator
- [ ] 커스텀 공통 컴포넌트 구현
  - `PageHeader` - 페이지 제목 + 설명 + 액션 버튼 영역
  - `StatusBadge` - 상태별 색상이 다른 배지 (pending/approved/rejected/draft/finalized)
  - `DataTable` - 정렬, 필터링, 페이지네이션 지원 테이블
  - `EmptyState` - 데이터 없을 때 표시할 빈 상태 컴포넌트
  - `ConfirmDialog` - 확인/취소 다이얼로그
  - `FormField` - React Hook Form + shadcn/ui 통합 폼 필드
  - `MonthPicker` - 년/월 선택 컴포넌트
  - `LoadingSkeleton` - 페이지별 스켈레톤 UI
- [ ] 네비게이션 컴포넌트
  - `Sidebar` - 역할별 메뉴가 다른 사이드바
  - `Header` - 사용자 정보, 로그아웃 버튼
  - `MobileNav` - 모바일 반응형 네비게이션
- [ ] sonner Toast 전역 설정

#### 수락 기준

- [ ] 모든 공통 컴포넌트가 독립적으로 렌더링됨
- [ ] 반응형 디자인 적용 (모바일/데스크탑)
- [ ] 다크 모드 고려 불필요 (라이트 모드만)
- [ ] 접근성 기본 사항 충족 (키보드 네비게이션, aria-label)

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 사이드바 메뉴 클릭 시 해당 페이지로 이동하는지 확인
- [ ] 모바일 뷰포트에서 네비게이션이 정상 동작하는지 확인
- [ ] Dialog 열기/닫기 동작 확인
- [ ] Toast 메시지 표시 확인

#### 관련 파일

- `src/components/ui/` - shadcn/ui 컴포넌트
- `src/components/common/PageHeader.tsx`
- `src/components/common/StatusBadge.tsx`
- `src/components/common/DataTable.tsx`
- `src/components/common/EmptyState.tsx`
- `src/components/common/ConfirmDialog.tsx`
- `src/components/common/FormField.tsx`
- `src/components/common/MonthPicker.tsx`
- `src/components/common/LoadingSkeleton.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileNav.tsx`

---

### Task 004: 근무자 UI/UX 완성

#### 개요

- **목표:** 근무자가 사용하는 모든 화면을 더미 데이터 기반으로 완성
- **예상 소요 시간:** 5~6시간
- **관련 기능:** 근무 기록 입력, 내 근무 내역 조회, 급여 확인
- **의존성:** Task 002, Task 003

#### 구현 사항

- [ ] 근무자 대시보드 (`/worker/dashboard`)
  - 이번 달 근무 요약 (총 시간, 예상 급여)
  - 최근 근무 기록 미리보기 (최근 5건)
  - 빠른 액션 버튼 (근무 기록 입력)
- [ ] 근무 기록 입력 폼 (`/worker/work-logs/new`)
  - 근무일 선택 (DatePicker)
  - 시작 시간 / 종료 시간 입력
  - 역할 선택 (조교 / 코칭)
  - 메모 입력 (선택)
  - 근무 시간 자동 계산 표시
  - React Hook Form + Zod 유효성 검사
  - 제출 확인 다이얼로그
- [ ] 내 근무 내역 (`/worker/work-logs`)
  - 월별 필터링 (MonthPicker)
  - 상태별 필터링 (전체/대기/승인/반려)
  - 근무 기록 목록 (테이블 형태)
  - 각 행에 상태 배지 표시
  - 반려된 기록에 반려 사유 표시
  - 대기 중 기록 수정/삭제 기능
- [ ] 급여 확인 (`/worker/payroll`)
  - 월별 급여 요약 카드
  - 역할별 시간/급여 분류 표시
  - 급여 상세 내역 (근무 기록 단위)
  - 확정/미확정 상태 표시

#### 수락 기준

- [ ] 더미 데이터로 모든 화면이 정상 렌더링됨
- [ ] 폼 유효성 검사가 올바르게 동작함 (에러 메시지 표시)
- [ ] 반응형 디자인 적용됨
- [ ] 페이지 간 네비게이션이 자연스러움

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 근무 기록 입력 폼 작성 및 제출 플로우 확인
- [ ] 유효하지 않은 입력 시 에러 메시지 표시 확인
- [ ] 월별 필터 변경 시 목록 갱신 확인
- [ ] 상태별 필터 동작 확인
- [ ] 대기 중 기록 수정 플로우 확인
- [ ] 급여 확인 페이지에서 월 선택 시 데이터 변경 확인

#### 관련 파일

- `src/app/(worker)/worker/dashboard/page.tsx`
- `src/app/(worker)/worker/work-logs/page.tsx`
- `src/app/(worker)/worker/work-logs/new/page.tsx`
- `src/app/(worker)/worker/payroll/page.tsx`
- `src/components/worker/DashboardSummary.tsx`
- `src/components/worker/WorkLogForm.tsx`
- `src/components/worker/WorkLogTable.tsx`
- `src/components/worker/PayrollCard.tsx`
- `src/components/worker/PayrollDetail.tsx`

---

### Task 005: 관리자 UI/UX 완성

#### 개요

- **목표:** 관리자가 사용하는 모든 화면을 더미 데이터 기반으로 완성
- **예상 소요 시간:** 6~7시간
- **관련 기능:** 근무자 관리, 시급 설정, 승인/반려, 월별 정산
- **의존성:** Task 002, Task 003

#### 구현 사항

- [ ] 관리자 대시보드 (`/admin/dashboard`)
  - 이번 달 전체 근무 요약
  - 대기 중인 승인 건수
  - 근무자별 근무 현황 요약
- [ ] 근무자 관리 (`/admin/workers`)
  - 근무자 목록 테이블
  - 근무자별 현재 시급 표시 (조교/코칭)
  - 근무자 상세 페이지 링크
- [ ] 시급 설정 (`/admin/workers/[id]/rates`)
  - 근무자 정보 표시
  - 역할별 현재 시급 표시
  - 시급 변경 폼 (역할 선택, 금액 입력, 적용 시작일)
  - 시급 변경 이력 테이블
- [ ] 근무 기록 관리 (`/admin/work-logs`)
  - 전체 근무 기록 목록 (근무자명 포함)
  - 상태별/근무자별/월별 필터링
  - 승인 버튼 / 반려 버튼
  - 반려 시 사유 입력 다이얼로그
  - 일괄 승인 기능
- [ ] 월별 급여 정산 (`/admin/payroll`)
  - 월 선택 (MonthPicker)
  - 근무자별 급여 요약 테이블 (총 시간, 총 급여, 상태)
  - 정산 확정 버튼 (개별/일괄)
  - 확정 취소 기능
  - CSV 다운로드 버튼 (더미 동작)

#### 수락 기준

- [ ] 더미 데이터로 모든 화면이 정상 렌더링됨
- [ ] 승인/반려 플로우가 UI 상에서 자연스럽게 동작함
- [ ] 시급 설정 폼 유효성 검사 동작
- [ ] 반응형 디자인 적용됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 근무 기록 승인 플로우 확인 (승인 버튼 클릭 → 상태 변경)
- [ ] 근무 기록 반려 플로우 확인 (반려 버튼 → 사유 입력 → 상태 변경)
- [ ] 일괄 승인 플로우 확인
- [ ] 시급 설정 폼 작성 및 저장 플로우 확인
- [ ] 급여 정산 확정 플로우 확인
- [ ] CSV 다운로드 버튼 클릭 확인
- [ ] 필터 변경 시 목록 갱신 확인

#### 관련 파일

- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/(admin)/admin/workers/page.tsx`
- `src/app/(admin)/admin/workers/[id]/rates/page.tsx`
- `src/app/(admin)/admin/work-logs/page.tsx`
- `src/app/(admin)/admin/payroll/page.tsx`
- `src/components/admin/AdminDashboardSummary.tsx`
- `src/components/admin/WorkerTable.tsx`
- `src/components/admin/HourlyRateForm.tsx`
- `src/components/admin/HourlyRateHistory.tsx`
- `src/components/admin/WorkLogReviewTable.tsx`
- `src/components/admin/RejectionDialog.tsx`
- `src/components/admin/PayrollTable.tsx`

---

### Task 006: 데이터베이스 스키마 및 Supabase 초기 설정

#### 개요

- **목표:** Supabase 프로젝트 설정 및 DB 스키마 생성, RLS 정책 구성
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 전체 데이터 저장/조회
- **의존성:** Task 002

#### 구현 사항

- [x] Supabase 프로젝트 생성 및 환경 변수 설정
- [x] 데이터베이스 테이블 생성 (SQL 마이그레이션) — 실제 DB 적용 완료 (2026-03-19)
  - `profiles` 테이블 (email, is_active, updated_at 포함)
  - `hourly_rates` 테이블
  - `work_logs` 테이블 (updated_at 포함)
  - `payroll_summaries` 테이블 (UNIQUE(worker_id, year, month) 포함)
- [x] 외래 키 및 인덱스 설정
  - `hourly_rates`: INDEX(worker_id, role_type, effective_from) — 유효 시급 조회 성능
  - `work_logs`: INDEX(worker_id, work_date), INDEX(status)
- [x] RLS (Row Level Security) 정책 설정 — is_admin() 함수 포함, 실제 적용 완료
  - profiles: 본인 정보 조회 가능, 관리자는 전체 조회 가능
  - hourly_rates: 관리자만 생성/수정, 근무자는 본인 시급 조회 가능
  - work_logs: 근무자는 본인 기록만 CRUD, 관리자는 전체 조회/수정 가능
  - payroll_summaries: 근무자는 본인 정산만 조회, 관리자는 전체 CRUD 가능
- [ ] DB trigger 설정
  - `auth.users` INSERT 시 `profiles` 자동 생성 (role: worker 기본값)
  - `work_logs` INSERT/UPDATE/DELETE 시 해당 월 `payroll_summaries.status = finalized`이면 거부 (확정 월 보호)
  - `profiles.updated_at`, `work_logs.updated_at` 자동 갱신
- [x] Supabase 클라이언트 설정 (`createClient`, `createServerClient`)
- [ ] DB 타입 자동 생성 설정 (`supabase gen types`)
- [ ] 시드 데이터 SQL 작성 (개발용)

#### 수락 기준

- [ ] 모든 테이블이 정상 생성됨
- [ ] RLS 정책이 올바르게 동작함 (역할별 접근 제어)
- [ ] Supabase 클라이언트로 CRUD 동작 확인
- [ ] 타입 자동 생성이 정상 동작함

#### 테스트 체크리스트 (Playwright MCP)

- [ ] DB 설정 자체는 E2E 테스트 대상이 아님 (Supabase 대시보드 및 SQL로 검증)

#### 관련 파일

- `supabase/migrations/001_create_profiles.sql`
- `supabase/migrations/002_create_hourly_rates.sql`
- `supabase/migrations/003_create_work_logs.sql`
- `supabase/migrations/004_create_payroll_summaries.sql`
- `supabase/seed.sql`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/types/supabase.ts`
- `.env.local`

---

### Task 007: 인증 시스템 및 권한 관리

#### 개요

- **목표:** Supabase Auth 기반 로그인/로그아웃, 역할별 라우팅 보호
- **예상 소요 시간:** 4~5시간
- **관련 기능:** 로그인, 권한 분리, 라우트 보호
- **의존성:** Task 006

#### 구현 사항

- [x] 로그인 페이지 구현 (이메일/비밀번호 + Google OAuth 병렬 지원)
- [x] 회원가입 페이지 구현 (`/signup`)
  - 이메일/비밀번호로 자가 가입 가능 (role: worker 기본값, DB trigger로 profiles 자동 생성)
  - Google OAuth로 가입 가능 (로그인 페이지의 Google 버튼으로 신규 계정 자동 생성)
  - **관리자 계정은 Supabase 대시보드에서 직접 role을 admin으로 변경**
- [x] Supabase Auth 연동 (signInWithPassword, signInWithOAuth, signOut)
  - 이메일 로그인: profiles 테이블 직접 조회 후 역할별 redirect (auth/callback 미경유)
  - Google OAuth 로그인: `/auth/callback` 경유 후 역할별 redirect
- [x] 미들웨어 인증 가드 구현
  - 비로그인 사용자 → `/login` 리다이렉트
  - 근무자가 관리자 페이지 접근 → `/worker/dashboard` 리다이렉트
  - ~~관리자가 근무자 페이지 접근 → `/admin/dashboard` 리다이렉트~~ → 관리자도 /worker/* 접근 허용 (2026-03-19 변경: 관리자는 근무자 페이지로 시작하되 헤더에 "관리자 패널" 버튼 표시)
- [x] 로그인 후 역할에 따른 리다이렉트
- [x] 로그아웃 처리 및 세션 정리
- [x] Auth 콜백 페이지 (`/auth/callback`) — Google OAuth 전용

#### 수락 기준

- [x] 이메일/비밀번호로 로그인 및 회원가입 가능
- [x] Google OAuth로 로그인 및 신규 가입 가능
- [x] 역할에 따라 올바른 페이지로 리다이렉트됨
- [x] 권한 없는 페이지 접근 시 적절히 차단됨
- [x] 로그아웃 후 로그인 페이지로 이동됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 이메일 로그인 폼 작성 및 로그인 성공 → 역할별 대시보드 이동 확인
- [ ] 이메일 회원가입 → 로그인 → worker 대시보드 이동 확인
- [ ] 잘못된 자격 증명으로 로그인 시 에러 메시지 확인
- [ ] 로그아웃 후 보호된 페이지 접근 시 리다이렉트 확인
- [ ] 근무자 계정으로 관리자 페이지 접근 시 리다이렉트 확인
- [ ] 관리자 계정으로 근무자 페이지 접근 시 리다이렉트 확인

#### 관련 파일

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`

---

### Task 008: 근무 기록 CRUD 및 시급 적용 로직

#### 개요

- **목표:** 근무 기록 생성/조회/수정/삭제 기능 구현 및 시급 스냅샷 저장
- **예상 소요 시간:** 5~6시간
- **관련 기능:** 근무 기록 입력, 시급 적용, 급여 자동 계산
- **의존성:** Task 006, Task 007, Task 004

#### 구현 사항

- [ ] 근무 기록 생성 (Server Action)
  - 근무 시간 자동 계산 (end_time - start_time)
  - 해당 근무자의 해당 역할 시급 조회 (work_date 기준 유효 시급)
    - 쿼리: `WHERE worker_id = ? AND role_type = ? AND effective_from <= work_date ORDER BY effective_from DESC LIMIT 1`
    - 시급이 없으면 에러 반환 (폼에서 미리 경고 표시 권장)
  - `applied_hourly_rate` 스냅샷 저장
  - `calculated_pay` = duration_hours * applied_hourly_rate 계산 저장
  - 상태 기본값: `pending`
  - **확정 월 차단**: 해당 월 `payroll_summaries.status = finalized`이면 저장 거부
- [ ] 근무 기록 조회
  - 근무자: 본인 기록만 조회 (월별, 상태별 필터)
  - 관리자: 전체 기록 조회 (근무자별, 월별, 상태별 필터)
- [ ] 근무 기록 수정
  - `pending` 상태인 기록만 수정 가능
  - **확정 월 차단**: 해당 월 finalized이면 수정 거부 (앱 레벨 검증 + DB trigger 이중 방어)
  - 수정 시 시급 재계산
- [ ] 근무 기록 삭제
  - `pending` 상태인 기록만 삭제 가능
  - **확정 월 차단**: finalized이면 삭제 거부
- [x] 시급 관리
  - 관리자: 시급 등록/수정/삭제 (HourlyRateManagerClient.tsx, updateHourlyRate/deleteHourlyRate 서버 액션)
  - `effective_from` 기준으로 유효 시급 결정 (미래 시급 사전 등록 가능)
  - 동일 effective_from 시 created_at 기준 최신 항목 적용 로직 추가
  - 시급 변경 이력 조회
  - [ ] 시급 미설정 근무자/역할 조합이 있을 경우 관리자 화면에서 경고 표시 (잔여)
- [ ] 더미 데이터를 실제 Supabase 데이터로 교체 (근무자 화면)

#### 수락 기준

- [ ] 근무 기록 생성 시 시급이 자동으로 적용됨
- [ ] 급여가 정확하게 계산됨
- [ ] pending 상태가 아닌 기록은 수정/삭제 불가
- [ ] 시급 변경 시 이미 저장된 기록의 스냅샷은 변경되지 않음

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 근무 기록 입력 → DB 저장 → 목록에 표시 확인
- [ ] 시급이 올바르게 적용되어 급여가 계산되는지 확인
- [ ] pending 기록 수정 플로우 확인
- [ ] approved 기록 수정 시도 시 차단 확인
- [ ] 기록 삭제 플로우 확인

#### 관련 파일

- `src/app/api/work-logs/route.ts` 또는 `src/app/(worker)/worker/work-logs/actions.ts`
- `src/app/(admin)/admin/workers/[id]/rates/actions.ts` — updateHourlyRate, deleteHourlyRate 서버 액션
- `src/components/admin/HourlyRateManagerClient.tsx` — 시급 등록/수정/삭제 클라이언트 컴포넌트
- `src/lib/services/work-log.ts`
- `src/lib/services/hourly-rate.ts`
- `src/lib/utils/pay-calculator.ts`
- `src/hooks/useWorkLogs.ts`
- `src/hooks/useHourlyRates.ts`

---

### Task 009: 승인/반려 플로우 구현

#### 개요

- **목표:** 관리자의 근무 기록 승인/반려 프로세스 구현
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 승인/반려, 수정 요청
- **의존성:** Task 008, Task 005

#### 구현 사항

- [ ] 승인 처리
  - pending → approved 상태 변경
  - reviewed_at, reviewed_by 기록
  - 일괄 승인 (선택된 기록들 한번에 승인)
- [ ] 반려 처리
  - pending → rejected 상태 변경
  - rejection_reason 필수 입력
  - reviewed_at, reviewed_by 기록
- [ ] 승인 취소 (approved → pending)
  - 관리자가 실수로 승인한 경우 되돌리기
  - **조건**: 해당 월 `payroll_summaries.status`가 `finalized`가 아닌 경우만 허용
  - rejection_reason 불필요, reviewed_at/reviewed_by 초기화
- [ ] 수정 요청 플로우
  - 근무자: 반려된 기록 확인 → 수정하여 재제출
  - 재제출 시 상태 rejected → pending으로 변경, rejection_reason은 유지(참고용)
- [ ] 실시간 상태 반영 (목록 갱신)
- [ ] 더미 데이터를 실제 Supabase 데이터로 교체 (관리자 화면)

#### 수락 기준

- [ ] 승인된 기록의 상태가 approved로 변경됨
- [ ] 반려된 기록에 반려 사유가 표시됨
- [ ] 반려된 기록을 수정하여 재제출 가능
- [ ] 일괄 승인이 정상 동작함
- [ ] 승인 취소가 draft 월에서는 가능, finalized 월에서는 차단됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 관리자: 근무 기록 승인 → 상태 변경 확인
- [ ] 관리자: 근무 기록 반려 → 사유 입력 → 상태 변경 확인
- [ ] 관리자: 일괄 승인 플로우 확인
- [ ] 관리자: 승인 취소 → pending 복귀 확인 (draft 월)
- [ ] 관리자: finalized 월의 승인 취소 시도 → 차단 확인
- [ ] 근무자: 반려된 기록 수정 → 재제출 → pending 상태 확인
- [ ] 승인/반려 후 목록이 갱신되는지 확인

#### 관련 파일

- `src/app/(admin)/admin/work-logs/actions.ts`
- `src/lib/services/work-log-review.ts`
- `src/components/admin/WorkLogReviewTable.tsx`
- `src/components/admin/RejectionDialog.tsx`

---

### Task 010-A: 월별 급여 정산

#### 개요

- **목표:** 월별 급여 집계, draft/finalized 상태 관리, 확정 취소 구현
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 급여 정산
- **의존성:** Task 008, Task 009

#### 구현 사항

- [ ] 월별 급여 정산 데이터 집계
  - 근무자별 해당 월의 `approved` 상태 근무 기록 합산
  - 역할별(assistant/coaching) 시간/급여 분류
  - `payroll_summaries` 테이블에 저장 (draft 상태)
  - 이미 draft 레코드가 있으면 업데이트 (UNIQUE constraint 활용)
- [ ] 정산 확정 처리
  - draft → finalized 상태 변경
  - finalized_at, finalized_by 기록
  - 확정 이후 해당 월 work_logs 수정/삭제/상태변경 불가 (DB trigger + 앱 레벨 이중 방어)
- [ ] 확정 취소
  - finalized → draft 상태 변경
  - 취소 후 근무 기록 수정 다시 가능
- [ ] 근무자 급여 확인 페이지를 실제 데이터로 교체

#### 수락 기준

- [ ] 월별 정산 데이터가 정확하게 집계됨 (approved 기록만 합산)
- [ ] draft/finalized 상태 전환이 올바르게 동작함
- [ ] 확정된 월의 근무 기록은 수정/삭제 불가 (앱 레벨 + DB trigger 모두 차단)
- [ ] 확정 취소 후 근무 기록 수정이 다시 가능함

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 월 선택 → 정산 데이터 표시 확인
- [ ] 정산 확정 버튼 클릭 → finalized 상태 변경 확인
- [ ] 확정 취소 플로우 확인
- [ ] 확정된 월의 근무 기록 수정 시도 → 차단 확인

#### 관련 파일

- `src/app/(admin)/admin/payroll/actions.ts`
- `src/lib/services/payroll.ts`
- `src/components/admin/PayrollTable.tsx`

---

### Task 010-B: CSV 다운로드

#### 개요

- **목표:** 월별 급여 정산 데이터 CSV 내보내기 기능 구현
- **예상 소요 시간:** 1~2시간
- **관련 기능:** CSV 내보내기
- **의존성:** Task 010-A

#### 구현 사항

- [ ] 월별 전체 정산 요약 CSV 생성
  - 컬럼: 이름, 역할, 총 근무시간, 시급, 총 급여, 정산 상태
  - 파일명: `급여정산_YYYY년_MM월.csv`
- [ ] 근무자별 상세 기록 CSV 생성 (선택)
  - 컬럼: 근무일, 시작시간, 종료시간, 근무시간, 역할, 시급, 급여, 상태
- [ ] Route Handler에서 CSV 응답 반환 (`Content-Type: text/csv`)

#### 수락 기준

- [ ] CSV 파일이 올바른 인코딩(UTF-8 BOM)으로 다운로드됨 (엑셀 한글 깨짐 방지)
- [ ] 파일명에 년월이 정확하게 반영됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] CSV 다운로드 버튼 클릭 → 파일 다운로드 확인
- [ ] 다운로드된 파일의 데이터가 화면 표시 데이터와 일치하는지 확인

#### 관련 파일

- `src/lib/utils/csv-generator.ts`
- `src/app/api/payroll/csv/route.ts`

---

### Task 011: 핵심 기능 통합 테스트

#### 개요

- **목표:** 전체 비즈니스 플로우를 E2E 테스트로 검증
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 전체 시스템
- **의존성:** Task 007 ~ Task 010

#### 구현 사항

> Playwright MCP는 spec 파일 자동화 도구가 아닌 대화형 E2E 테스트 도구다.
> 각 Task에서 MCP로 테스트를 수행했더라도, 이 단계에서 핵심 플로우 3개를 다시 통합 검증한다.

- [ ] 테스트 데이터 준비 (관리자 계정, 근무자 계정 2명, 시급 설정 완료 상태)
- [ ] 핵심 플로우 통합 검증
  - 플로우 A (기본 급여 계산): 근무자 로그인 → 근무 기록 입력 → 관리자 승인 → 정산 집계 → 급여 정확성 확인
  - 플로우 B (반려/재제출): 관리자 반려 → 근무자 수정 재제출 → 관리자 승인 → 정산 반영 확인
  - 플로우 C (확정 보호): 정산 확정 → 근무 기록 수정 시도 차단 → 확정 취소 → 수정 재가능 확인
- [ ] 엣지 케이스 검증
  - 시급 미설정 역할로 근무 기록 입력 시 에러 처리 확인
  - finalized 월의 기록 수정/삭제 시도 차단 확인
- [ ] 버그 수정 및 안정화

#### 수락 기준

- [ ] 플로우 A/B/C 모두 끊김 없이 동작
- [ ] 엣지 케이스에서 적절한 에러 메시지 표시
- [ ] 급여 계산 결과가 수동 검산과 일치

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 플로우 A 전체 실행 확인
- [ ] 플로우 B 전체 실행 확인
- [ ] 플로우 C 전체 실행 확인
- [ ] 엣지 케이스 2개 확인

#### 관련 파일

- 별도 spec 파일 없음 (Playwright MCP 대화형 테스트로 수행)
- 테스트 중 발견된 버그는 해당 Task 파일에 기록 후 수정

---

### Task 012: 사용자 경험 향상

#### 개요

- **목표:** Toast 알림, 스켈레톤 로딩, 에러 처리, 유효성 검사 메시지 개선
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 전체 UI/UX
- **의존성:** Task 011

#### 구현 사항

- [ ] Toast 알림 통합
  - 성공: 기록 저장, 승인, 확정 등
  - 실패: API 에러, 유효성 검사 실패 등
  - 정보: 상태 변경 안내 등
- [ ] 스켈레톤 로딩 UI
  - 데이터 로딩 중 스켈레톤 표시
  - 페이지 전환 시 로딩 인디케이터
- [ ] 글로벌 에러 처리
  - API 에러 공통 처리
  - 네트워크 에러 처리
  - error.tsx 페이지 구현
  - not-found.tsx 페이지 구현
- [ ] 유효성 검사 메시지 한국어화
  - Zod 에러 메시지 커스터마이징
  - 폼 필드별 명확한 에러 안내
- [ ] 빈 상태(Empty State) 개선
  - 데이터가 없을 때 안내 메시지 및 액션 버튼

#### 수락 기준

- [ ] 모든 사용자 액션에 적절한 피드백(Toast)이 제공됨
- [ ] 데이터 로딩 중 스켈레톤이 표시됨
- [ ] 에러 발생 시 사용자 친화적인 메시지가 표시됨
- [ ] 유효성 검사 메시지가 한국어로 명확하게 안내됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 데이터 저장 시 성공 Toast 표시 확인
- [ ] API 에러 발생 시 에러 Toast 표시 확인
- [ ] 로딩 중 스켈레톤 표시 확인
- [ ] 존재하지 않는 페이지 접근 시 404 페이지 확인
- [ ] 폼 유효성 검사 에러 메시지 한국어 확인

#### 관련 파일

- `src/lib/utils/toast.ts`
- `src/components/common/LoadingSkeleton.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/lib/validations/*.ts` (에러 메시지 한국어화)

---

### Task 013: 성능 최적화

> ⚠️ Post-MVP — Phase 6에서 수행. MVP 배포 후 여유가 있을 때 진행.
> SEO는 인증 필수 내부 업무 앱에 불필요. Open Graph/robots.txt 제외.
> 로그인 페이지에만 최소한의 title/description 설정으로 충분.

#### 개요

- **목표:** 서버/클라이언트 컴포넌트 최적화 및 번들 사이즈 점검
- **예상 소요 시간:** 1~2시간
- **관련 기능:** 성능
- **의존성:** Task 012

#### 구현 사항

- [ ] 서버 컴포넌트 / 클라이언트 컴포넌트 분리 점검
  - 불필요한 `"use client"` 제거
  - 데이터 페칭을 서버 컴포넌트에서 수행하도록 리팩토링
- [ ] loading.tsx 파일 추가 (라우트 그룹별)
- [ ] Suspense 경계 최적화
- [ ] 로그인 페이지에만 title, favicon 설정 (SEO 아닌 탭 표시용)

#### 수락 기준

- [ ] 불필요한 `"use client"` 가 없음
- [ ] 주요 페이지 로딩 3초 이내

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 주요 페이지 로딩 속도 측정

#### 관련 파일

- `src/app/layout.tsx`
- `src/app/(worker)/loading.tsx`
- `src/app/(admin)/loading.tsx`

---

### Task 014: 배포 및 모니터링

#### 개요

- **목표:** Vercel 배포 및 기본 모니터링 설정
- **예상 소요 시간:** 2~3시간
- **관련 기능:** 배포, 운영
- **의존성:** Task 013

#### 구현 사항

- [ ] Vercel 프로젝트 설정
- [ ] 환경 변수 설정 (Supabase URL, Key 등)
- [ ] 프로덕션 빌드 테스트
- [ ] 커스텀 도메인 설정 (선택)
- [ ] Vercel Analytics 설정 (선택)
- [ ] 에러 로깅 체계 구축 (console → 구조화된 로깅)

#### 수락 기준

- [ ] Vercel에 정상 배포됨
- [ ] 프로덕션 환경에서 모든 기능 정상 동작
- [ ] 환경 변수가 올바르게 설정됨

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 배포된 URL에서 전체 E2E 테스트 수행
- [ ] 프로덕션 환경에서 로그인/주요 기능 동작 확인

#### 관련 파일

- `vercel.json`
- `.env.production`
- `next.config.ts`

---

### Task 015: 대시보드 통계 및 차트 (관리자용)

#### 개요

- **목표:** 관리자 대시보드에 통계 차트 및 인사이트 추가
- **예상 소요 시간:** 4~5시간
- **관련 기능:** 관리자 대시보드
- **의존성:** Task 010

#### 구현 사항

- [ ] 차트 라이브러리 설치 (Recharts 또는 Chart.js)
- [ ] 월별 총 근무시간 추이 차트
- [ ] 근무자별 근무시간 비교 차트
- [ ] 역할별(조교/코칭) 근무시간 분포 차트
- [ ] 월별 급여 지출 추이 차트
- [ ] 대시보드 요약 카드 고도화
  - 전월 대비 증감률 표시
  - 미승인 건수 알림

#### 수락 기준

- [ ] 차트가 실제 데이터 기반으로 렌더링됨
- [ ] 반응형 디자인에서 차트가 깨지지 않음
- [ ] 데이터가 없을 때 적절한 빈 상태 표시

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 대시보드 페이지 로딩 시 차트 렌더링 확인
- [ ] 월 변경 시 차트 데이터 갱신 확인
- [ ] 데이터 없는 상태에서 차트 영역 확인

#### 관련 파일

- `src/components/admin/charts/MonthlyHoursChart.tsx`
- `src/components/admin/charts/WorkerComparisonChart.tsx`
- `src/components/admin/charts/RoleDistributionChart.tsx`
- `src/components/admin/charts/MonthlyPayrollChart.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx`

---

### Task 016: 포트폴리오 문서화 및 데모 데이터 준비

#### 개요

- **목표:** 포트폴리오 제출을 위한 문서화 및 데모 환경 준비
- **예상 소요 시간:** 3~4시간
- **관련 기능:** 문서화, 데모
- **의존성:** Task 014, Task 015

#### 구현 사항

- [ ] README.md 작성
  - 프로젝트 소개 및 스크린샷
  - 기술 스택 및 선택 이유
  - 주요 기능 설명
  - 실행 방법 (로컬 개발 환경)
  - 프로젝트 구조
  - 배포 URL
- [ ] 데모 계정 준비
  - 관리자 데모 계정
  - 근무자 데모 계정
- [ ] 데모 데이터 준비
  - 현실적인 3개월치 근무 데이터
  - 다양한 상태의 근무 기록 (pending, approved, rejected)
  - 확정된 정산과 미확정 정산
- [ ] 스크린샷 촬영 및 GIF 녹화
- [ ] 기술적 의사결정 기록 (ADR 형식, 선택)

#### 수락 기준

- [ ] README.md가 포트폴리오 수준으로 완성됨
- [ ] 데모 계정으로 전체 플로우를 체험할 수 있음
- [ ] 데모 데이터가 현실적이고 충분함

#### 테스트 체크리스트 (Playwright MCP)

- [ ] 데모 계정으로 로그인 → 전체 플로우 확인
- [ ] 데모 데이터가 올바르게 표시되는지 확인

#### 관련 파일

- `README.md`
- `supabase/seed-demo.sql`
- `docs/screenshots/`

---

## 기술 스택 체크리스트

| 기술 | 도입 Phase | 상태 |
|------|-----------|------|
| Next.js 16 (App Router) | Phase 1 | [x] |
| TypeScript strict | Phase 1 | [x] |
| Tailwind CSS v3 | Phase 1 | [x] |
| shadcn/ui (new-york) | Phase 1 | [x] |
| Zod | Phase 1 | [x] |
| React Hook Form | Phase 3 | [x] |
| date-fns | Phase 3 | [x] |
| sonner | Phase 3 | [x] |
| Supabase (Auth + DB + RLS) | Phase 2 | [x] |
| Playwright MCP | Phase 4 | [ ] |
| Recharts / Chart.js | Phase 6 | [ ] |

---

## 품질 체크리스트 (Phase별 완료 기준)

### Phase 1 완료 기준

- [ ] 프로젝트가 `npm run dev`로 정상 실행됨
- [ ] 모든 라우트에 placeholder 페이지 존재
- [ ] TypeScript strict 모드에서 빌드 에러 없음
- [ ] 전체 타입 시스템 정의 완료
- [ ] 더미 데이터 준비 완료

### Phase 2 완료 기준 (인프라)

- [x] Supabase 테이블 4개 생성 및 UNIQUE/INDEX 적용 확인 — 마이그레이션 실제 적용 완료 (2026-03-19)
- [x] RLS 정책이 역할별로 올바르게 동작함 — is_admin() 함수 포함 전체 적용 완료
- [ ] DB trigger (profiles 자동 생성, 확정 월 보호) 동작 확인
- [x] 인증 가드가 역할에 따라 올바르게 리다이렉트함 — 관리자도 /worker/* 접근 허용으로 변경
- [ ] 근무자 계정 생성 (admin.createUser) 정상 동작

### Phase 3 완료 기준 (UI/UX)

- [ ] 모든 화면이 더미 데이터로 정상 렌더링됨
- [ ] 실제 인증 사용자 이름/역할이 레이아웃에 표시됨
- [ ] 폼 유효성 검사 동작 확인
- [ ] 반응형 디자인 적용 확인 (모바일/데스크탑)
- [ ] 공통 컴포넌트 재사용성 확인

### Phase 4 완료 기준 (핵심 로직)

- [ ] 근무 기록 CRUD 정상 동작
- [ ] 시급 스냅샷 저장 정확성 확인 (수동 검산 포함)
- [ ] 승인/반려/승인취소 플로우 정상 동작
- [ ] 월별 급여 정산 정확성 확인
- [ ] CSV 다운로드 정상 동작 (UTF-8 BOM, 한글 정상)
- [ ] 확정 월 수정 차단 동작 확인

### Phase 5 완료 기준 (품질 + 배포 = MVP 완료)

- [ ] 핵심 플로우 3개 E2E 테스트 통과
- [ ] Toast 알림이 모든 사용자 액션에 적용됨
- [ ] 에러 처리가 일관성 있게 적용됨
- [ ] Vercel 배포 완료 및 프로덕션 환경에서 전 기능 정상 동작

### Phase 6 완료 기준 (Post-MVP)

- [ ] 관리자 대시보드에 통계 차트 표시
- [ ] README.md 작성 완료
- [ ] 데모 계정 및 데모 데이터 준비 완료

---

## 주의사항

1. **스냅샷 무결성**: 근무 기록에 저장된 `applied_hourly_rate`와 `calculated_pay`는 시급 변경 시에도 기존 기록이 변경되어서는 안 된다.

2. **상태 전이 규칙**: 허용된 상태 전이만 처리한다.
   - `pending → approved` (관리자 승인)
   - `pending → rejected` (관리자 반려, rejection_reason 필수)
   - `rejected → pending` (근무자 수정 후 재제출)
   - `approved → pending` (관리자 승인 취소, finalized 월이 아닌 경우만)
   - finalized 월의 모든 상태 변경 불가

3. **확정된 정산 보호 구현 방법**: 정산이 `finalized`된 월의 근무 기록은 생성/수정/삭제/상태변경 모두 불가.
   - **앱 레벨**: Server Action에서 해당 월 `payroll_summaries.status` 조회 후 finalized이면 에러 반환
   - **DB 레벨**: trigger로 이중 방어 (RLS만으로는 다른 테이블 참조 로직 구현 부적합)
   - 두 레이어 모두 구현해야 보안 완결

4. **계정 생성 방식**: 이메일/비밀번호 자가 가입(`/signup`) 또는 Google OAuth로 신규 가입 모두 허용. 가입 시 role 기본값은 `worker`. 관리자 권한 부여는 Supabase 대시보드에서 직접 `profiles.role = 'admin'` 변경.

5. **RLS 우선**: 모든 데이터 접근은 Supabase RLS를 통해 서버 수준에서 보호한다. 클라이언트 측 권한 체크만으로는 불충분하다.

6. **TypeScript strict**: `any` 타입 사용 금지. 모든 데이터에 명시적 타입을 부여한다.

7. **인프라 먼저**: Phase 2 (DB + 인증) 완료 후 Phase 3 (UI) 시작. 인증 없이 UI를 만들면 레이아웃/권한 분기를 전면 수정해야 한다.

8. **테스트 필수**: 핵심 비즈니스 로직(급여 계산, 승인/반려, 정산 확정)은 반드시 Playwright MCP E2E 테스트로 검증한다.

---

## 다음 단계

현재 단계: **Phase 6 (Post-MVP)**

다음 작업: Phase 6 부가기능 작업들 (시간 여유 시 진행)

### 잔여 작업 목록

| 우선순위 | 작업 | 관련 Task |
|---------|------|----------|
| 1 | 성능 최적화 (서버/클라이언트 컴포넌트 분리 점검, Suspense 최적화) | Task 013 |
| 2 | 대시보드 통계 및 차트 (관리자용) | Task 015 |
| 3 | 포트폴리오 문서화 및 데모 데이터 준비 | Task 016 |
| - | 근무 기록 입력 시 시급 미설정 처리 | Task 008 잔여 |
| - | admin/workers 목록에서 role='worker' 필터 제거 (현재 모든 프로필 표시) | Task 008 잔여 |

### 최근 완료 이력

#### 2026-03-20
- Task 011 핵심 기능 통합 테스트 완료 (플로우 A/B/C 전체 통과)
- 날짜 버그 수정: `-31` 하드코딩 → 동적 계산 (영향 파일 11개)
- PayrollTable.tsx 확정 취소 버튼 추가
- WorkLogTable.tsx 반려 기록 수정/삭제 버튼 표시 수정
- [id]/edit/page.tsx 반려 기록 edit 페이지 접근 허용
- actions.ts (worker) 반려 기록 수정 시 status pending 복귀 + 반려 정보 초기화
- **Phase 5 (MVP) 완료**

#### 2026-03-19
- Supabase 마이그레이션 실제 적용 (hourly_rates, work_logs, payroll_summaries + RLS)
- 관리자/근무자 역할 분기 수정 (관리자도 /worker/* 접근 가능)
- 시급 CRUD 완성 (등록/수정/삭제, HourlyRateManagerClient.tsx)
- UI/UX 버그 수정 (달력 투명도, 기본 근무 시간, 서버 컴포넌트 import 오류)
- 에러 메시지 디버깅 개선

```
Phase 1 (골격) .............. 완료
  → Task 001: 프로젝트 구조 및 라우팅 설정
  → Task 002: 타입 정의 및 인터페이스 설계

Phase 2 (인프라) ............ 완료 (DB trigger 일부 잔여)
  → Task 006: DB 스키마 및 Supabase 초기 설정 — 마이그레이션 실제 적용 완료
  → Task 007: 인증 시스템 및 권한 관리 — 역할 분기 수정 완료

Phase 3 (UI/UX) ............. 완료
  → Task 003 → Task 004 → Task 005

Phase 4 (핵심 로직) ......... 완료 (시급 미설정 처리 잔여)
  → Task 008 → Task 009 → Task 010-A → Task 010-B

Phase 5 (MVP 완료) .......... 완료 ✅
  → Task 011 (완료) → Task 012 (완료) → Task 014 (완료)

Phase 6 (Post-MVP, 시간 여유 시) ... 진행 예정
  → Task 013 → Task 015 → Task 016
```
