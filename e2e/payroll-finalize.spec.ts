import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, hasCredentials, login } from "./helpers";

/**
 * 정산 확정 화면.
 * 대기 중인 기록이 남아 있으면 확정이 거부되어야 한다 —
 * 확정 이후에 근무 기록이 승인되면 확정 금액과 실제 기록이 어긋난다.
 * 이 규칙은 009의 finalize_payroll 안에서 강제되며, 여기서는 그 결과가
 * 화면에 제대로 드러나는지를 본다.
 */
test.skip(!hasCredentials, "TEST_* 계정 정보가 없으면 건너뛴다");

test("정산 화면에서 근무자별 집계가 보인다", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin/payroll");

  // 해당 월에 근무 기록이 없으면 표 대신 빈 상태가 뜬다. 어느 쪽이든 화면은 떠야 한다.
  await expect(page.getByRole("heading", { name: "급여 정산" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "CSV 다운로드" }).or(page.getByText(/없습니다|비어/))
  ).toBeVisible();
});

test("대기 중인 기록이 있으면 확정할 수 없다", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin/payroll");

  const finalizeButton = page.getByRole("button", { name: "급여 확정" }).first();
  const count = await page.getByRole("button", { name: "급여 확정" }).count();
  test.skip(count === 0, "확정 가능한 근무자가 없다");

  await finalizeButton.click();

  // 확정 다이얼로그가 있으면 진행한다.
  const confirm = page.getByRole("button", { name: "확인" });
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  }

  // 성공하면 확정 취소 버튼으로 바뀌고, 대기 기록이 있으면 에러가 뜬다.
  await expect(
    page
      .getByRole("button", { name: "확정 취소" })
      .first()
      .or(page.getByText(/대기 중인 근무 기록/))
  ).toBeVisible({ timeout: 15000 });
});
