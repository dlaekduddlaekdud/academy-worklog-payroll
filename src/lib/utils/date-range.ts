/**
 * 월 경계 날짜 계산.
 *
 * Date 객체를 ISO 문자열로 바꾸면(toISOString) UTC로 변환되므로,
 * KST(UTC+9)에서는 날짜가 하루 밀린다. 예를 들어 new Date(2026, 8, 0)은
 * KST 8/31 00:00이지만 toISOString()은 "2026-08-30T15:00:00Z"를 반환해
 * 말일이 30일로 계산된다. 그래서 아래 함수들은 모두 로컬 시각 기준의
 * getFullYear/getMonth/getDate만 사용하고 문자열은 직접 조립한다.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** 해당 월의 일수. month는 1~12. */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 로컬 시각 기준 YYYY-MM-DD. */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 오늘 날짜를 로컬 시각 기준 YYYY-MM-DD로. */
export function getToday(): string {
  return toDateString(new Date());
}

/**
 * 해당 월의 시작일·종료일을 YYYY-MM-DD로 반환. month는 1~12.
 * getMonthRange(2026, 8) -> { startDate: "2026-08-01", endDate: "2026-08-31" }
 */
export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const mm = pad(month);
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${pad(getDaysInMonth(year, month))}`,
  };
}
