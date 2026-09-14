import { defineConfig } from 'vitest/config';

/*
 * 순수 로직(features/*\/domain)만 테스트 대상으로 삼는다.
 * 화면 컴포넌트(.tsx)는 RN 전용 렌더러 설정이 없어서 여기서 다루지 않는다
 * (제작플랜 8번: "E2E·컴포넌트 스냅샷은 MVP엔 과함, 채점 로직 단위 테스트만 필수").
 */
export default defineConfig({
  test: {
    include: ['features/**/domain/**/*.test.ts'],
  },
});
