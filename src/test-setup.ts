// jsdom은 window.scrollTo를 구현하지 않아 탭 전환 시 "Not implemented" 경고가 발생한다.
// 테스트 대상이 아니므로 조용히 대체한다.
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}
