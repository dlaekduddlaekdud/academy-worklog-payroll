import { z } from "zod";

// HH:mm 형식 검증용 정규식
const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

// 시간 문자열을 분 단위 숫자로 변환
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const workLogFormSchema = z
  .object({
    workDate: z
      .string()
      .min(1, "근무일을 선택해주세요")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "근무일을 선택해주세요"),
    startTime: z
      .string()
      .min(1, "시작 시간을 선택해주세요")
      .regex(timeRegex, "시작 시간을 선택해주세요"),
    endTime: z
      .string()
      .min(1, "종료 시간을 선택해주세요")
      .regex(timeRegex, "종료 시간을 선택해주세요"),
    roleType: z.enum(["assistant", "coaching"], {
      error: "역할을 선택해주세요",
    }),
    memo: z.string().max(200, "메모는 200자 이내로 작성해주세요").optional(),
  })
  // endTime이 startTime보다 이후여야 함
  .refine((data) => timeToMinutes(data.endTime) > timeToMinutes(data.startTime), {
    message: "종료 시간은 시작 시간 이후여야 합니다",
    path: ["endTime"],
  });

export type WorkLogFormValues = z.infer<typeof workLogFormSchema>;
