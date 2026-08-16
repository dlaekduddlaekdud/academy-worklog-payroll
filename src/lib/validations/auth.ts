import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요").min(4, "비밀번호는 4자 이상이어야 합니다"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const createWorkerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이내여야 합니다"),
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(4, "비밀번호는 4자 이상이어야 합니다")
    .max(100, "비밀번호는 100자 이내여야 합니다"),
});

export type CreateWorkerValues = z.infer<typeof createWorkerSchema>;
