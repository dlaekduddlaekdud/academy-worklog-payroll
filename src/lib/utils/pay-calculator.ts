// "HH:mm" 형식 시간 문자열을 분 단위로 변환
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// 시작/종료 시간을 받아 소수점 근무 시간 반환 (예: 1.5 = 90분)
export function calculateDurationHours(startTime: string, endTime: string): number {
  const totalMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (totalMinutes <= 0) return 0;
  // 소수점 2자리로 반올림
  return Math.round((totalMinutes / 60) * 100) / 100;
}

// 근무 시간과 시급으로 급여 계산 (원 단위 반올림)
export function calculatePay(durationHours: number, hourlyRate: number): number {
  return Math.round(durationHours * hourlyRate);
}
