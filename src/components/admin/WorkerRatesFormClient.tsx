"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HourlyRateForm } from "@/components/admin/HourlyRateForm";
import { showSuccess, showError } from "@/lib/toast";
import { createHourlyRate } from "@/app/(admin)/admin/workers/actions";
import type { HourlyRateFormValues } from "@/lib/validations/hourly-rate";

interface WorkerRatesFormClientProps {
  workerId: string;
}

export function WorkerRatesFormClient({ workerId }: WorkerRatesFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (data: HourlyRateFormValues) => {
    startTransition(async () => {
      const result = await createHourlyRate(data);
      if (result.success) {
        showSuccess("시급이 등록되었습니다");
        router.refresh();
      } else {
        showError("시급 등록에 실패했습니다", result.error ?? "");
      }
    });
  };

  return <HourlyRateForm workerId={workerId} onSubmit={handleSubmit} isLoading={isPending} />;
}
