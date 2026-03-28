import type { PayrollOverview } from "@/types";

// 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 추가
const BOM = "\uFEFF";

// 월별 정산 데이터를 CSV 문자열로 변환
export function generatePayrollCsv(
  overviews: PayrollOverview[],
  year: number,
  month: number
): string {
  const header = [
    "이름",
    "총 근무시간",
    "총 급여",
    "승인 건수",
    "대기 건수",
    "정산 상태",
  ].join(",");

  const rows = overviews.map((o) => {
    const status = o.status === "finalized" ? "확정" : "초안";
    return [
      o.workerName,
      o.totalHours,
      o.totalPay,
      o.approvedLogCount,
      o.pendingLogCount,
      status,
    ].join(",");
  });

  const title = `급여정산_${year}년_${month}월`;
  // 파일 첫 행에 타이틀 포함
  const content = [title, header, ...rows].join("\n");

  return BOM + content;
}

// CSV 파일명 생성
export function generatePayrollCsvFilename(
  year: number,
  month: number
): string {
  return `급여정산_${year}년_${month}월.csv`;
}
