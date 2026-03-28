import type { PayrollSummary } from "@/types";

export const mockPayrollSummaries: PayrollSummary[] = [
  // ─── 2월 정산 (finalized) ───────────────────────────────────────────────
  {
    id: "ps-001-uuid-0000-000000000001",
    workerId: "worker-001-uuid-0000-000000000001",
    year: 2026,
    month: 2,
    totalHours: 8.0,
    totalPay: 120000,
    status: "finalized",
    finalizedAt: "2026-03-05T10:00:00.000Z",
    finalizedBy: "admin-001-uuid-0000-000000000000",
  },
  {
    id: "ps-002-uuid-0000-000000000002",
    workerId: "worker-002-uuid-0000-000000000002",
    year: 2026,
    month: 2,
    // 반려된 기록 제외, 승인된 기록만 합산
    totalHours: 3.5,
    totalPay: 52500,
    status: "finalized",
    finalizedAt: "2026-03-05T10:00:00.000Z",
    finalizedBy: "admin-001-uuid-0000-000000000000",
  },
  {
    id: "ps-003-uuid-0000-000000000003",
    workerId: "worker-003-uuid-0000-000000000003",
    year: 2026,
    month: 2,
    totalHours: 9.5,
    totalPay: 171000,
    status: "finalized",
    finalizedAt: "2026-03-05T10:00:00.000Z",
    finalizedBy: "admin-001-uuid-0000-000000000000",
  },

  // ─── 3월 정산 (draft) ───────────────────────────────────────────────────
  {
    id: "ps-004-uuid-0000-000000000004",
    workerId: "worker-001-uuid-0000-000000000001",
    year: 2026,
    month: 3,
    totalHours: 4.0,
    totalPay: 60000,
    status: "draft",
    finalizedAt: null,
    finalizedBy: null,
  },
  {
    id: "ps-005-uuid-0000-000000000005",
    workerId: "worker-002-uuid-0000-000000000002",
    year: 2026,
    month: 3,
    totalHours: 4.0,
    totalPay: 60000,
    status: "draft",
    finalizedAt: null,
    finalizedBy: null,
  },
  {
    id: "ps-006-uuid-0000-000000000006",
    workerId: "worker-003-uuid-0000-000000000003",
    year: 2026,
    month: 3,
    // 3월 시급 인상 후 기록이므로 20000원 기준 (work_logs의 appliedHourlyRate 기준)
    totalHours: 7.0,
    totalPay: 126000,
    status: "draft",
    finalizedAt: null,
    finalizedBy: null,
  },
];
