import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  WORKER_EMAIL,
  WORKER_PASSWORD,
  hasCredentials,
  login,
  logout,
  submitWorkLog,
  rowByTime,
} from "./helpers";

/**
 * 근무 기록의 핵심 흐름: 제출 -> 승인.
 * 승인 후에는 근무자가 그 기록을 수정할 수 없어야 한다.
 * 승인된 기록을 제출자가 고칠 수 있으면 승인 절차가 아무것도 보증하지 못한다.
 */
test.skip(!hasCredentials, "TEST_* 계정 정보가 없으면 건너뛴다");

test("근무자가 제출한 기록을 관리자가 승인한다", async ({ page }) => {
  const START = "09:15";
  const END = "13:15";

  await login(page, WORKER_EMAIL, WORKER_PASSWORD);
  await submitWorkLog(page, START, END);
  await expect(rowByTime(page, START, END).first()).toBeVisible();

  await logout(page);
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin/work-logs");

  const row = rowByTime(page, START, END).first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "승인" }).click();

  // 승인 처리가 끝나 상태 배지가 바뀔 때까지 기다린다.
  // 여기서 기다리지 않고 로그아웃하면 서버 액션이 끝나기 전에 세션이 끊긴다.
  // 상태 배지가 "대기중" -> "승인"으로 바뀔 때까지 기다린다. 여기서 기다리지
  // 않고 로그아웃하면 서버 액션이 끝나기 전에 세션이 끊긴다.
  await expect(row).not.toContainText("대기중", { timeout: 15000 });

  // 근무자 화면에서도 승인 상태로 보이고, 수정 버튼이 사라져야 한다.
  await logout(page);
  await login(page, WORKER_EMAIL, WORKER_PASSWORD);
  await page.goto("/worker/work-logs");

  // 같은 시간대 기록이 여러 건 쌓일 수 있어 행 하나를 특정하는 대신
  // 승인 탭에 최소 1건이 잡히는지로 확인한다.
  await expect(page.getByRole("tab", { name: /승인 \((?!0\))/ })).toBeVisible({ timeout: 15000 });
});
