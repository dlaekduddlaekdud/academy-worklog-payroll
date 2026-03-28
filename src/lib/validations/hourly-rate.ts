import { z } from "zod";

export const hourlyRateFormSchema = z.object({
  workerId: z.string().min(1, "근무자를 선택해주세요"),
  roleType: z.enum(["assistant", "coaching"], {
    error: "역할을 선택해주세요",
  }),
  rate: z
    .number({ error: "시급을 입력해주세요" })
    .min(0, "시급은 0원 이상이어야 합니다")
    .max(999999, "시급은 999,999원 이하여야 합니다"),
  effectiveFrom: z
    .string()
    .min(1, "적용 시작일을 선택해주세요")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "적용 시작일을 선택해주세요"),
});

export type HourlyRateFormValues = z.infer<typeof hourlyRateFormSchema>;
