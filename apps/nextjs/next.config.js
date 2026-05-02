/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@repo/api-client'],
  typedRoutes: true,
  experimental: {
    // barrel import (`@/features/.../components`)을 빌드 타임에 직접 파일 경로로 재작성
    // 'use client' 경계를 가로지를 때 트리 셰이킹 정확도 향상
    optimizePackageImports: ['@repo/ui', '@repo/api-client'],
  },
}

export default nextConfig
