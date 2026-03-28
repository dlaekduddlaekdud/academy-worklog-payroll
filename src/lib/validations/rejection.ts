import { z } from "zod";

export const rejectionReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "반려 사유를 입력해주세요")
    .max(500, "반려 사유는 500자 이내로 작성해주세요"),
});

export type RejectionReasonValues = z.infer<typeof rejectionReasonSchema>;
