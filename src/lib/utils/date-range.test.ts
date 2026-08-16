import { describe, it, expect, afterEach, vi } from "vitest";
import { getDaysInMonth, getMonthRange, getToday, toDateString } from "./date-range";

describe("getDaysInMonth", () => {
  it("월별 일수를 반환한다", () => {
    expect(getDaysInMonth(2026, 1)).toBe(31);
    expect(getDaysInMonth(2026, 4)).toBe(30);
    expect(getDaysInMonth(2026, 12)).toBe(31);
  });

  it("2월은 윤년 여부에 따라 다르다", () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2024, 2)).toBe(29);
    // 100으로 나뉘지만 400으로 안 나뉘는 해는 평년
    expect(getDaysInMonth(1900, 2)).toBe(28);
    expect(getDaysInMonth(2000, 2)).toBe(29);
  });
});

describe("getMonthRange", () => {
  it("월의 첫날과 말일을 반환한다", () => {
    expect(getMonthRange(2026, 8)).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });
  });

  it("한 자리 월은 0으로 패딩한다", () => {
    expect(getMonthRange(2026, 1)).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });

  it("2월 말일이 잘리지 않는다", () => {
    expect(getMonthRange(2026, 2).endDate).toBe("2026-02-28");
    expect(getMonthRange(2024, 2).endDate).toBe("2024-02-29");
  });

  it("12월이 다음 해로 넘어가지 않는다", () => {
    expect(getMonthRange(2026, 12)).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-31",
    });
  });

  // 이 프로젝트에서 실제로 있었던 버그.
  // toISOString()을 쓰면 KST 8/31 00:00이 UTC 8/30 15:00이 되어
  // 말일이 30일로 계산되고, 31일의 근무 기록이 조회에서 빠졌다.
  it("31일로 끝나는 달의 말일이 UTC 변환으로 밀리지 않는다", () => {
    for (const m of [1, 3, 5, 7, 8, 10, 12]) {
      expect(getMonthRange(2026, m).endDate).toBe(`2026-${String(m).padStart(2, "0")}-31`);
    }
  });
});

describe("toDateString / getToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("로컬 시각 기준 YYYY-MM-DD를 만든다", () => {
    expect(toDateString(new Date(2026, 7, 16))).toBe("2026-08-16");
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  // 마이페이지의 유효 시급 조회 기준일 버그.
  // toISOString().slice(0,10)이면 KST 오전 9시 이전에 어제 날짜가 나온다.
  it("자정 직후에도 오늘 날짜를 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 16, 0, 30));
    expect(getToday()).toBe("2026-08-16");
  });

  it("자정 직전에도 오늘 날짜를 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 16, 23, 59));
    expect(getToday()).toBe("2026-08-16");
  });
});
