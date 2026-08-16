"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { WorkLogForm } from "@/components/worker/WorkLogForm";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccess, showError } from "@/lib/toast";
import { createWorkLog } from "@/app/(worker)/worker/work-logs/actions";
import type { WorkLogFormValues } from "@/lib/validations/work-log";

export default function WorkerWorkLogNewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: WorkLogFormValues) => {
    setIsLoading(true);
    try {
      const result = await createWorkLog(data);
      if (result.success) {
        showSuccess("근무 기록이 제출되었습니다", "관리자 승인을 기다려주세요");
        router.push("/worker/work-logs");
      } else {
        showError("제출에 실패했습니다", result.error ?? "잠시 후 다시 시도해주세요");
      }
    } catch {
      showError("제출에 실패했습니다", "잠시 후 다시 시도해주세요");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="근무 기록 입력" description="근무 일시와 역할을 입력해주세요" />

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <WorkLogForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
