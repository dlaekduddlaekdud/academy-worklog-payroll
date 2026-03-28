import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로덕션 빌드 시 TypeScript 오류는 빌드 단계에서 차단 (기본값 false, 명시적 선언)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
