// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, getStoredApiKey, setStoredApiKey } from './client';

const KEY_STORAGE = 'fconline_nexon_api_key';

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

  describe('API 키 저장', () => {
    it('저장·조회·해제가 동작한다', () => {
      expect(getStoredApiKey()).toBe('');

      setStoredApiKey('test_key');
      expect(getStoredApiKey()).toBe('test_key');
      expect(localStorage.getItem(KEY_STORAGE)).toBe('test_key');

      setStoredApiKey('');
      expect(getStoredApiKey()).toBe('');
      expect(localStorage.getItem(KEY_STORAGE)).toBeNull();
    });

    it('앞뒤 공백을 제거하고 저장한다', () => {
      setStoredApiKey('  spaced  ');
      expect(getStoredApiKey()).toBe('spaced');
    });

    it('공백만 있는 값은 해제로 처리한다', () => {
      setStoredApiKey('key');
      setStoredApiKey('   ');
      expect(getStoredApiKey()).toBe('');
    });
  });

  describe('헤더 주입', () => {
    it('저장된 키가 있으면 x-nxopen-api-key를 실어 보낸다', async () => {
      setStoredApiKey('my_key');
      await apiGet('/nexon/account', { nickname: 'a' });

      const [, init] = lastCall();
      expect(init.headers).toMatchObject({ 'x-nxopen-api-key': 'my_key' });
    });

    it('키가 없으면 헤더를 붙이지 않는다 (서버 환경변수 키로 폴백)', async () => {
      await apiGet('/nexon/account', { nickname: 'a' });

      const [, init] = lastCall();
      expect(init.headers).not.toHaveProperty('x-nxopen-api-key');
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

  describe('apiPost', () => {
    it('JSON 본문과 Content-Type을 함께 보낸다', async () => {
      await apiPost('/nexon/verify-key', { apiKey: 'k' });

      const [url, init] = lastCall();
      expect(url).toBe('/api/nexon/verify-key');
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
      expect(init.body).toBe(JSON.stringify({ apiKey: 'k' }));
    });

    it('본문이 없으면 body를 생략한다', async () => {
      await apiPost('/nexon/x');
      expect(lastCall()[1].body).toBeUndefined();
    });
  });
});
