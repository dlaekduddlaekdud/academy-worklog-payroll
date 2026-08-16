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
 * 반려 흐름. 반려 사유가 근무자에게 전달되는지까지 확인한다.
 * 반려 사유는 근무자가 무엇을 고쳐야 하는지 아는 유일한 단서다.
 */
test.skip(!hasCredentials, "TEST_* 계정 정보가 없으면 건너뛴다");

test("관리자가 반려하면 근무자에게 사유가 보인다", async ({ page }) => {
  const START = "14:30";
  const END = "18:30";
  const reason = "시간 기록을 다시 확인해주세요";

  await login(page, WORKER_EMAIL, WORKER_PASSWORD);
  await submitWorkLog(page, START, END);

  await logout(page);
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin/work-logs");

  const row = rowByTime(page, START, END).first();
  await row.getByRole("button", { name: "반려" }).click();

  await expect(page.getByText("근무 기록 반려")).toBeVisible();
  await page.getByPlaceholder("반려 사유를 입력해주세요").fill(reason);
  await page.getByRole("button", { name: "반려 처리" }).click();

  // 반려 처리가 끝날 때까지 기다린 뒤 로그아웃한다.
  await expect(row).not.toContainText("대기중", { timeout: 15000 });

  await logout(page);
  await login(page, WORKER_EMAIL, WORKER_PASSWORD);
  await page.goto("/worker/work-logs");

  await expect(page.getByRole("tab", { name: /반려 \((?!0\))/ })).toBeVisible({ timeout: 15000 });
});
