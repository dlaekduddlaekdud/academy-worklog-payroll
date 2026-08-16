import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkLogStatus, PayrollStatus, RoleType } from "@/types";

// 근무 기록 상태별 라벨/색상 설정
const WORK_LOG_STATUS_CONFIG: Record<WorkLogStatus, { label: string; className: string }> = {
  pending: {
    label: "대기중",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200",
  },
  approved: {
    label: "승인",
    className: "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200",
  },
  rejected: {
    label: "반려",
    className: "bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200",
  },
};

// 급여 정산 상태별 라벨/색상 설정
const PAYROLL_STATUS_CONFIG: Record<PayrollStatus, { label: string; className: string }> = {
  draft: {
    label: "초안",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80 border-gray-200",
  },
  finalized: {
    label: "확정",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
  },
};

// 역할 타입별 라벨/색상 설정
const ROLE_TYPE_CONFIG: Record<RoleType, { label: string; className: string }> = {
  assistant: {
    label: "조교",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
  },
  coaching: {
    label: "코칭",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200",
  },
};

interface StatusBadgeProps {
  status: WorkLogStatus | PayrollStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config =
    status in WORK_LOG_STATUS_CONFIG
      ? WORK_LOG_STATUS_CONFIG[status as WorkLogStatus]
      : PAYROLL_STATUS_CONFIG[status as PayrollStatus];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

interface RoleBadgeProps {
  roleType: RoleType;
}

export function RoleBadge({ roleType }: RoleBadgeProps) {
  const config = ROLE_TYPE_CONFIG[roleType];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
