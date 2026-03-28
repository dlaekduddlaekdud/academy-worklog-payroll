import type { UserProfile, WorkerSummary } from "@/types";

export const mockProfiles: UserProfile[] = [
  {
    userId: "admin-001-uuid-0000-000000000000",
    email: "admin@academy.com",
    name: "관리자",
    role: "admin",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  // 조교 근무자 1
  {
    userId: "worker-001-uuid-0000-000000000001",
    email: "kim.assist@academy.com",
    name: "김조교",
    role: "worker",
    isActive: true,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  // 조교 근무자 2
  {
    userId: "worker-002-uuid-0000-000000000002",
    email: "lee.assist@academy.com",
    name: "이조교",
    role: "worker",
    isActive: true,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  // 코칭 근무자
  {
    userId: "worker-003-uuid-0000-000000000003",
    email: "park.coach@academy.com",
    name: "박코치",
    role: "worker",
    isActive: true,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
];

// 근무자만 추출한 요약 목록
export const mockWorkerSummaries: WorkerSummary[] = mockProfiles
  .filter((p) => p.role === "worker")
  .map(({ userId, name, email, isActive }) => ({
    userId,
    name,
    email,
    isActive,
  }));
