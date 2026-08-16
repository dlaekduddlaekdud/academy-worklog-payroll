import { type Page, expect } from "@playwright/test";

export const WORKER_EMAIL = process.env.TEST_WORKER_EMAIL!;
export const WORKER_PASSWORD = process.env.TEST_WORKER_PASSWORD!;
export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL!;
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD!;

export const hasCredentials = Boolean(
  WORKER_EMAIL && WORKER_PASSWORD && ADMIN_EMAIL && ADMIN_PASSWORD
);

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("example@email.com").fill(email);
  await page.getByPlaceholder("비밀번호 입력").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL(/\/(worker|admin)\//, { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}

/**
 * 근무 기록을 제출한다. 메모에 고유 문자열을 넣어 이후 단계에서 이 기록을 찾는다.
 * 날짜 입력이 캘린더 팝오버라 오늘 날짜 셀을 클릭한다.
 */
export async function submitWorkLog(page: Page, startTime: string, endTime: string) {
  await page.goto("/worker/work-logs/new");

  // 날짜 버튼의 접근성 이름은 FormLabel에서 온다("근무일"). 표시 텍스트가 아니다.
  await page.getByRole("button", { name: "근무일" }).click();

  // 캘린더 셀은 gridcell 안의 버튼이고, 이름이 "2026년 8월 16일 토요일" 형식이다.
  // 팝오버가 완전히 열린 뒤에 클릭해야 한다.
  const grid = page.getByRole("grid");
  await grid.waitFor({ state: "visible" });

  // 오늘 칸만 접근성 이름 앞에 "Today, "가 붙으므로 ^로 고정하면 안 된다.
  const now = new Date();
  const dayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  await grid.getByRole("button", { name: new RegExp(dayLabel) }).click();

  await page.getByRole("textbox", { name: "시작 시간" }).fill(startTime);
  await page.getByRole("textbox", { name: "종료 시간" }).fill(endTime);

  await page.getByRole("combobox", { name: "역할" }).click();
  await page.getByRole("option", { name: "조교" }).click();

  await page.getByRole("button", { name: "근무 기록 제출" }).click();

  // 제출 확인 다이얼로그
  await expect(page.getByText("근무 기록을 제출하시겠습니까?")).toBeVisible();
  await page.getByRole("button", { name: "제출", exact: true }).click();

  await page.waitForURL(/\/worker\/work-logs$/, { timeout: 15000 });
}

/**
 * 목록 테이블에는 메모 칼럼이 없어서 근무 시간으로 행을 찾는다.
 * spec마다 다른 시간대를 쓰면 서로 섞이지 않는다.
 */
export function rowByTime(page: Page, startTime: string, endTime: string) {
  // 근무자 화면은 "09:15 ~ 13:15", 관리자 화면은 "09:15~13:15"로 표기가 다르다.
  const pattern = new RegExp(`${startTime}\\s*~\\s*${endTime}`);
  return page.getByRole("row").filter({ hasText: pattern });
}
