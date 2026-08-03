// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAccount,
  getLiveMatch,
  getMatchDetail,
  getMetadata,
  getRankerStats,
  getStatus,
  getTrades,
  getUserMatches,
  verifyKey,
} from './nexon';

function lastUrl() {
  const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
  return String((mock.mock.calls.at(-1) as [string, RequestInit])[0]);
}

describe('nexon api 함수', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as unknown as Response)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('각 함수가 지정된 프록시 경로로 요청한다', async () => {
    await getStatus();
    expect(lastUrl()).toBe('/api/nexon/status');

    await getAccount('구단주');
    expect(lastUrl()).toContain('/api/nexon/account?nickname=');

    await getMatchDetail('m1');
    expect(lastUrl()).toBe('/api/nexon/match-detail?matchid=m1');

    await getUserMatches({ ouid: 'o1', matchtype: '52', limit: 10 });
    expect(lastUrl()).toBe('/api/nexon/user-matches?ouid=o1&matchtype=52&limit=10');

    await getLiveMatch({ ouid: 'o1' });
    expect(lastUrl()).toBe('/api/nexon/live-match?ouid=o1');

    await getTrades({ ouid: 'o1', tradetype: 'sell' });
    expect(lastUrl()).toBe('/api/nexon/trade?ouid=o1&tradetype=sell');

    await getMetadata('matchtype');
    expect(lastUrl()).toBe('/api/nexon/metadata?type=matchtype');
  });

  describe('getRankerStats', () => {
    it('players 배열을 JSON 문자열로 직렬화해 보낸다', async () => {
      await getRankerStats([{ id: 1, po: 25 }, { id: 2, po: 24 }], '52');

      const url = new URL(lastUrl(), 'http://localhost');
      expect(url.pathname).toBe('/api/nexon/ranker-stats');
      expect(url.searchParams.get('matchtype')).toBe('52');
      expect(JSON.parse(url.searchParams.get('players')!)).toEqual([
        { id: 1, po: 25 },
        { id: 2, po: 24 },
      ]);
    });

    it('matchtype 기본값은 50이다', async () => {
      await getRankerStats([{ id: 1, po: 25 }]);
      expect(lastUrl()).toContain('matchtype=50');
    });

    it('스쿼드 전체를 한 번의 요청으로 보낸다 (rate limit 회피)', async () => {
      const squad = Array.from({ length: 18 }, (_, i) => ({ id: i + 1, po: 25 }));
      await getRankerStats(squad);

      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
      const url = new URL(lastUrl(), 'http://localhost');
      expect(JSON.parse(url.searchParams.get('players')!)).toHaveLength(18);
    });
  });

  it('verifyKey는 POST로 키를 전달한다', async () => {
    await verifyKey('my_key');

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1) as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/api/nexon/verify-key');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ apiKey: 'my_key' }));
  });
});
