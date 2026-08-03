// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from './client';

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function errorResponse(status: number, body?: unknown) {
  return {
    ok: false,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('not json');
      return body;
    },
  } as unknown as Response;
}

function lastCall() {
  const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
  return mock.mock.calls.at(-1) as [string, RequestInit];
}

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => okResponse({ ok: true })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('넥슨 키 비노출', () => {
    it('GET 요청에 어떤 헤더도 붙이지 않는다 (키는 서버 env 전용)', async () => {
      await apiGet('/nexon/account', { nickname: 'a' });

      const [, init] = lastCall();
      // fetch(url) 단일 인자 호출이거나, 헤더가 없어야 한다
      expect(init?.headers).toBeUndefined();
    });

    it('localStorage에 키를 저장하지 않는다', async () => {
      await apiGet('/nexon/account', { nickname: 'a' });
      expect(localStorage.getItem('fconline_nexon_api_key')).toBeNull();
    });
  });

  describe('쿼리 문자열', () => {
    it('동일 오리진 /api 경로로 요청한다', async () => {
      await apiGet('/nexon/account', { nickname: '두치와뿌꾸' });
      expect(lastCall()[0]).toBe('/api/nexon/account?nickname=%EB%91%90%EC%B9%98%EC%99%80%EB%BF%8C%EA%BE%B8');
    });

    it('undefined와 빈 문자열 파라미터는 제외한다', async () => {
      await apiGet('/nexon/user-matches', { ouid: 'o1', nickname: undefined, matchtype: '' });
      expect(lastCall()[0]).toBe('/api/nexon/user-matches?ouid=o1');
    });

    it('파라미터가 없으면 물음표를 붙이지 않는다', async () => {
      await apiGet('/nexon/status');
      expect(lastCall()[0]).toBe('/api/nexon/status');
    });

    it('0과 false는 유효한 값으로 유지한다', async () => {
      await apiGet('/nexon/x', { limit: 0, flag: false });
      expect(lastCall()[0]).toContain('limit=0');
      expect(lastCall()[0]).toContain('flag=false');
    });
  });

  describe('에러 처리', () => {
    it('서버 메시지를 그대로 Error에 담는다', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => errorResponse(400, { message: 'players 파라미터가 필요합니다.' }))
      );

      await expect(apiGet('/nexon/ranker-stats')).rejects.toThrow(
        'players 파라미터가 필요합니다.'
      );
    });

    it('본문 파싱에 실패해도 상태 코드로 안내한다', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => errorResponse(502)));

      await expect(apiGet('/nexon/account')).rejects.toThrow('요청 실패 (HTTP 502)');
    });
  });

});
