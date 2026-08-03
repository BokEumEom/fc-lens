import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // 서버(순수 함수)는 node, 훅/컴포넌트는 jsdom이 필요하다.
    // 파일 상단 `// @vitest-environment jsdom` 주석으로 개별 전환한다.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['{src,server}/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
      exclude: [
        'src/main.tsx',
        'src/test-setup.ts',
        // 서버 부트스트랩(Vite 미들웨어 부착 + listen)은 통합 실행 자체라 단위 검증 대상이 아니다.
        'server/index.ts',
        '**/__fixtures__/**',
        '**/*.test.{ts,tsx}',
      ],
      // 프로젝트 규칙: 최소 80% 커버리지. 미달 시 test:coverage가 실패한다.
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
