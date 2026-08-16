import { defineConfig } from "vitest/config";
import { config } from "dotenv";

// .env.local을 읽어 통합 테스트에 Supabase 접속 정보를 넘긴다.
config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // 통합 테스트는 실제 DB를 건드리므로 순차 실행한다.
    fileParallelism: false,
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
    },
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
