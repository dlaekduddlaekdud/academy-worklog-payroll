import { describe, it, expect } from "vitest";
import { calculateDurationHours, calculatePay } from "./pay-calculator";

describe("calculateDurationHours", () => {
  it("근무 시간을 소수점 시간으로 반환한다", () => {
    expect(calculateDurationHours("09:00", "18:00")).toBe(9);
    expect(calculateDurationHours("09:00", "10:30")).toBe(1.5);
    expect(calculateDurationHours("13:15", "14:00")).toBe(0.75);
  });

  it("소수점 2자리로 반올림한다", () => {
    // 20분 = 0.3333... -> 0.33
    expect(calculateDurationHours("09:00", "09:20")).toBe(0.33);
    // 50분 = 0.8333... -> 0.83
    expect(calculateDurationHours("09:00", "09:50")).toBe(0.83);
  });

  it("시작과 종료가 같으면 0이다", () => {
    expect(calculateDurationHours("09:00", "09:00")).toBe(0);
  });

  // 자정을 넘기는 근무는 현재 지원하지 않는다(README 알려진 한계).
  // 검증에서 걸러지지만, 계산 함수에 들어와도 음수 급여가 나오지 않아야 한다.
  it("종료가 시작보다 이르면 0을 반환한다", () => {
    expect(calculateDurationHours("22:00", "02:00")).toBe(0);
    expect(calculateDurationHours("23:59", "00:00")).toBe(0);
  });

  it("자정 경계값을 처리한다", () => {
    expect(calculateDurationHours("00:00", "23:59")).toBe(23.98);
  });
});

describe("calculatePay", () => {
  it("시간과 시급을 곱해 원 단위로 반올림한다", () => {
    expect(calculatePay(9, 12000)).toBe(108000);
    expect(calculatePay(1.5, 15000)).toBe(22500);
  });

  it("1원 미만은 반올림한다", () => {
    // 0.33 * 12000 = 3960
    expect(calculatePay(0.33, 12000)).toBe(3960);
    // 0.83 * 11000 = 9130
    expect(calculatePay(0.83, 11000)).toBe(9130);
  });

  it("근무 시간이 0이면 급여도 0이다", () => {
    expect(calculatePay(0, 12000)).toBe(0);
  });
});
