import type { HourlyRate } from "@/types";

export const mockHourlyRates: HourlyRate[] = [
  // ─── 김조교 시급 ────────────────────────────────────────────────────────
  {
    id: "hr-001-uuid-0000-000000000001",
    workerId: "worker-001-uuid-0000-000000000001",
    roleType: "assistant",
    rate: 15000,
    effectiveFrom: "2026-01-01",
    createdBy: "admin-001-uuid-0000-000000000000",
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // ─── 이조교 시급 ────────────────────────────────────────────────────────
  {
    id: "hr-002-uuid-0000-000000000002",
    workerId: "worker-002-uuid-0000-000000000002",
    roleType: "assistant",
    rate: 15000,
    effectiveFrom: "2026-01-01",
    createdBy: "admin-001-uuid-0000-000000000000",
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // ─── 박코치 시급 ────────────────────────────────────────────────────────
  {
    id: "hr-003-uuid-0000-000000000003",
    workerId: "worker-003-uuid-0000-000000000003",
    roleType: "coaching",
    rate: 18000,
    effectiveFrom: "2026-01-01",
    createdBy: "admin-001-uuid-0000-000000000000",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // 박코치 3월부터 시급 인상 이력 예시
  {
    id: "hr-004-uuid-0000-000000000004",
    workerId: "worker-003-uuid-0000-000000000003",
    roleType: "coaching",
    rate: 20000,
    effectiveFrom: "2026-03-01",
    createdBy: "admin-001-uuid-0000-000000000000",
    createdAt: "2026-02-28T12:00:00.000Z",
  },
];
