"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WorkLogForm } from "@/components/worker/WorkLogForm"
import { showSuccess, showError } from "@/lib/toast"
import { updateWorkLog } from "@/app/(worker)/worker/work-logs/actions"
import type { WorkLogFormValues } from "@/lib/validations/work-log"

interface WorkLogEditFormProps {
  id: string
  defaultValues: WorkLogFormValues
}

export function WorkLogEditForm({ id, defaultValues }: WorkLogEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: WorkLogFormValues) => {
    setIsLoading(true)
    try {
      const result = await updateWorkLog(id, data)
      if (result.success) {
        showSuccess("근무 기록이 수정되었습니다", "관리자 승인을 기다려주세요")
        router.push("/worker/work-logs")
      } else {
        showError("수정에 실패했습니다", result.error ?? "잠시 후 다시 시도해주세요")
      }
    } catch {
      showError("수정에 실패했습니다", "잠시 후 다시 시도해주세요")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <WorkLogForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      defaultValues={defaultValues}
    />
  )
}
