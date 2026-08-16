import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요").min(4, "비밀번호는 4자 이상이어야 합니다"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

// 로그인 스키마의 최소 길이는 4자로 둔다. 기존 계정 중 짧은 비밀번호를 쓰는
// 사람이 있을 수 있고, 여기서 막으면 로그인 자체가 불가능해진다. 새로 만드는
// 계정만 8자 이상을 강제한다.
export const createWorkerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이내여야 합니다"),
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .max(100, "비밀번호는 100자 이내여야 합니다"),
});

export type CreateWorkerValues = z.infer<typeof createWorkerSchema>;
