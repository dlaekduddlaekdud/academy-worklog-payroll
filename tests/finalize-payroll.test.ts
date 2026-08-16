import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

/**
 * finalize_payroll RPC 통합 테스트.
 *
 * 이 함수는 is_admin()과 auth.uid()에 의존하므로 service_role 키로는
 * 검증할 수 없다. service_role은 auth.uid()가 NULL이라 권한 검사에서
 * 막힌다. 그래서 관리자 계정으로 실제 로그인한 anon 클라이언트를 쓴다.
 * 덕분에 권한 검사까지 함께 검증된다.
 *
 * 테스트 데이터는 매 실행마다 만들고 지운다. seed.sql 데이터에
 * 의존하면 실행 순서에 따라 결과가 달라진다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

const configured = Boolean(url && anonKey && serviceKey && adminEmail && adminPassword);

// 테스트 전용 연/월. 실제 근무 데이터와 겹치지 않는 과거 연도를 쓴다.
const YEAR = 2019;
const MONTH = 7;

describe.skipIf(!configured)("finalize_payroll RPC", () => {
  let admin: SupabaseClient; // 관리자로 로그인한 anon 클라이언트 (rpc 호출용)
  let service: SupabaseClient; // 테스트 데이터 준비/정리용
  let workerId: string;

  beforeAll(async () => {
    service = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    admin = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await admin.auth.signInWithPassword({
      email: adminEmail!,
      password: adminPassword!,
    });
    if (signInError) {
      throw new Error(
        `테스트 관리자 로그인 실패: ${signInError.message}. .env.local의 TEST_ADMIN_* 값을 확인한다.`
      );
    }

    const { data: profile, error } = await service
      .from("profiles")
      .select("user_id")
      .eq("role", "worker")
      .limit(1)
      .single();
    if (error || !profile) {
      throw new Error("근무자 프로필이 없다. supabase/seed.sql을 먼저 실행한다.");
    }
    workerId = profile.user_id;
  });

  afterAll(async () => {
    if (!workerId) return;
    await cleanup();
    await admin.auth.signOut();
  });

  async function cleanup() {
    // 확정 상태면 트리거가 work_logs 삭제를 막으므로 요약을 먼저 지운다.
    await service
      .from("payroll_summaries")
      .delete()
      .eq("worker_id", workerId)
      .eq("year", YEAR)
      .eq("month", MONTH);
    await service
      .from("work_logs")
      .delete()
      .eq("worker_id", workerId)
      .gte("work_date", `${YEAR}-0${MONTH}-01`)
      .lte("work_date", `${YEAR}-0${MONTH}-31`);
  }

  async function addLog(day: number, status: string, hours: number, pay: number) {
    const { error } = await service.from("work_logs").insert({
      worker_id: workerId,
      work_date: `${YEAR}-0${MONTH}-${String(day).padStart(2, "0")}`,
      start_time: "09:00",
      end_time: "13:00",
      duration_hours: hours,
      role_type: "assistant",
      status,
      applied_hourly_rate: 15000,
      calculated_pay: pay,
      submitted_at: new Date().toISOString(),
    });
    if (error) throw new Error(`근무 기록 준비 실패: ${error.message}`);
  }

  async function getSummary() {
    const { data } = await service
      .from("payroll_summaries")
      .select("status, total_hours, total_pay, finalized_by")
      .eq("worker_id", workerId)
      .eq("year", YEAR)
      .eq("month", MONTH)
      .maybeSingle();
    return data;
  }

  it("대기 중인 기록이 있으면 확정되지 않는다", async () => {
    await cleanup();
    await addLog(1, "approved", 4, 60000);
    await addLog(2, "pending", 4, 60000);

    const { error } = await admin.rpc("finalize_payroll", {
      p_worker_id: workerId,
      p_year: YEAR,
      p_month: MONTH,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain("대기 중인 근무 기록");
    // 실패했으면 요약 행이 남으면 안 된다. 단일 트랜잭션이므로 전부 롤백된다.
    expect(await getSummary()).toBeNull();
  });

  it("승인된 기록만 집계해 확정한다", async () => {
    await cleanup();
    await addLog(1, "approved", 4, 60000);
    await addLog(2, "approved", 3.5, 52500);
    await addLog(3, "rejected", 4, 60000); // 집계에서 빠져야 한다

    const { error } = await admin.rpc("finalize_payroll", {
      p_worker_id: workerId,
      p_year: YEAR,
      p_month: MONTH,
    });
    expect(error).toBeNull();

    const summary = await getSummary();
    expect(summary?.status).toBe("finalized");
    expect(Number(summary?.total_hours)).toBe(7.5);
    expect(Number(summary?.total_pay)).toBe(112500);
    // 확정자는 인자가 아니라 auth.uid()에서 온다.
    expect(summary?.finalized_by).not.toBeNull();
  });

  it("확정된 달의 근무 기록은 변경할 수 없다", async () => {
    // 앞 테스트에서 이미 확정된 상태를 이어 쓴다.
    const { error } = await service
      .from("work_logs")
      .update({ duration_hours: 99 })
      .eq("worker_id", workerId)
      .eq("work_date", `${YEAR}-0${MONTH}-01`);

    expect(error).not.toBeNull();
  });

  it("재확정해도 금액이 어긋나지 않는다", async () => {
    const before = await getSummary();

    const { error } = await admin.rpc("finalize_payroll", {
      p_worker_id: workerId,
      p_year: YEAR,
      p_month: MONTH,
    });
    expect(error).toBeNull();

    const after = await getSummary();
    expect(Number(after?.total_pay)).toBe(Number(before?.total_pay));
    expect(after?.status).toBe("finalized");
  });

  it("관리자가 아니면 호출할 수 없다", async () => {
    const anon = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await anon.rpc("finalize_payroll", {
      p_worker_id: workerId,
      p_year: YEAR,
      p_month: MONTH,
    });

    expect(error).not.toBeNull();
  });
});
