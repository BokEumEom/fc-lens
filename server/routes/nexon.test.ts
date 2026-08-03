import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nexonRouter } from './nexon';

import rawMatchDetail from '../lib/__fixtures__/match-detail.json';
import rawTrades from '../lib/__fixtures__/trade.json';
import rawRankerStats from '../lib/__fixtures__/ranker-stats.json';

const OUID = 'test-ouid';
const API_KEY = 'env_key';

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/nexon', nexonRouter);
  return instance;
}

/** 넥슨 도메인별 응답을 지정한다. 지정하지 않은 경로는 404로 응답한다. */
function mockNexon(routes: Record<string, unknown>, status = 200) {
  return vi.fn(async (url: string) => {
    // 정적 메타는 항상 최소 형태로 응답 (meta 캐시 적재용)
    if (url.includes('/static/fconline/meta/')) {
      const body = url.includes('spid.json')
        ? [{ id: 866200145, name: '카제미루' }]
        : url.includes('spposition.json')
          ? [{ spposition: 25, desc: 'LM' }]
          : url.includes('seasonid.json')
            ? [{ seasonId: 866, className: '26 TOTS', seasonImg: '' }]
            : [{ matchtype: 52, desc: '감독모드' }];
      return { ok: true, status: 200, json: async () => body } as unknown as Response;
    }

    const hit = Object.keys(routes).find((k) => url.includes(k));
    if (!hit) {
      return { ok: false, status: 404, json: async () => ({ error: { name: 'NOT_MOCKED' } }) } as unknown as Response;
    }
    return { ok: status < 400, status, json: async () => routes[hit] } as unknown as Response;
  });
}

describe('nexonRouter', () => {
  beforeEach(() => {
    process.env.NEXON_OPENAPI_KEY = API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('API 키 처리', () => {
    it('키가 없으면 400과 안내 메시지를 준다', async () => {
      process.env.NEXON_OPENAPI_KEY = '';
      const res = await request(app()).get('/api/nexon/account?nickname=abc');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('NEXON_OPENAPI_KEY');
    });

    it('예시 키(test_nxapi_key_here)는 미설정으로 취급한다', async () => {
      process.env.NEXON_OPENAPI_KEY = 'test_nxapi_key_here';
      const res = await request(app()).get('/api/nexon/account?nickname=abc');

      expect(res.status).toBe(400);
    });

    it('클라이언트가 헤더로 키를 넘겨도 무시하고 환경변수 키만 쓴다', async () => {
      const fetchMock = mockNexon({ '/id': { ouid: OUID }, '/user/basic': {}, '/maxdivision': {}, '/user/match': [] });
      vi.stubGlobal('fetch', fetchMock);

      await request(app())
        .get('/api/nexon/account?nickname=abc')
        .set('x-nxopen-api-key', 'header_key');

      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(init.headers).toMatchObject({ 'x-nxopen-api-key': API_KEY });
    });

    it('환경변수 키가 없으면 헤더를 넘겨도 400이다', async () => {
      process.env.NEXON_OPENAPI_KEY = '';

      const res = await request(app())
        .get('/api/nexon/account?nickname=abc')
        .set('x-nxopen-api-key', 'header_key');

      expect(res.status).toBe(400);
    });

    it('status는 키 설정 여부와 엔드포인트 목록을 알려준다', async () => {
      const res = await request(app()).get('/api/nexon/status');

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.endpoints.map((e: { path: string }) => e.path)).toContain(
        '/api/nexon/ranker-stats'
      );
    });
  });

  describe('GET /account', () => {
    it('nickname이 없으면 400을 준다 (기본 구단주로 대체하지 않는다)', async () => {
      const res = await request(app()).get('/api/nexon/account');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('nickname');
    });

    it('공백만 있는 nickname도 거부한다', async () => {
      const res = await request(app()).get('/api/nexon/account?nickname=%20%20');
      expect(res.status).toBe(400);
    });

    it('계정과 최근 매치 ID를 반환한다', async () => {
      vi.stubGlobal(
        'fetch',
        mockNexon({
          '/id': { ouid: OUID },
          '/user/basic': { nickname: '테스트', level: 100 },
          '/maxdivision': [{ matchType: 50, division: 1300, achievementDate: '2021-04-16T14:09:03' }],
          '/user/match': ['m1', 'm2'],
        })
      );

      const res = await request(app()).get('/api/nexon/account?nickname=테스트');

      expect(res.status).toBe(200);
      expect(res.body.account.ouid).toBe(OUID);
      expect(res.body.account.maxDivision).toContain('챌린저 3');
      expect(res.body.recentMatchIds).toEqual(['m1', 'm2']);
    });

    it('닉네임 조회 실패는 넥슨 상태 코드로 전달한다', async () => {
      vi.stubGlobal('fetch', mockNexon({ '/id': { error: { message: '없는 구단주' } } }, 404));

      const res = await request(app()).get('/api/nexon/account?nickname=없는사람');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
    });
  });

  describe('GET /match-detail', () => {
    it('matchid가 없으면 400을 준다', async () => {
      const res = await request(app()).get('/api/nexon/match-detail');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('matchid');
    });

    it('원본 matchInfo[]가 아니라 teams[]로 정규화해 응답한다', async () => {
      vi.stubGlobal('fetch', mockNexon({ '/match-detail': rawMatchDetail }));

      const res = await request(app()).get('/api/nexon/match-detail?matchid=m1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('teams');
      expect(res.body).not.toHaveProperty('matchInfo');
      expect(res.body.teams[0].squad.length).toBeGreaterThan(0);
      expect(res.body.matchType).toBe('감독모드');
    });
  });

  describe('GET /ranker-stats', () => {
    it('players가 없으면 넥슨에 보내지 않고 400을 준다', async () => {
      const fetchMock = mockNexon({});
      vi.stubGlobal('fetch', fetchMock);

      const res = await request(app()).get('/api/nexon/ranker-stats?matchtype=50');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('players');
      // 잘못된 요청을 넥슨으로 흘려보내지 않아야 한다 (OPENAPI00004 방지)
      expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('ranker-stats'))).toBe(
        true
      );
    });

    it('잘못된 JSON도 400으로 막는다', async () => {
      const res = await request(app()).get('/api/nexon/ranker-stats?players=not-json');
      expect(res.status).toBe(400);
    });

    it('선수 목록을 넘기면 메타를 조인해 반환한다', async () => {
      vi.stubGlobal('fetch', mockNexon({ '/ranker-stats': rawRankerStats }));
      const players = JSON.stringify([{ id: rawRankerStats[0].spid, po: rawRankerStats[0].spPosition }]);

      const res = await request(app()).get(
        `/api/nexon/ranker-stats?matchtype=52&players=${encodeURIComponent(players)}`
      );

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveLength(rawRankerStats.length);
      expect(res.body.stats[0]).toHaveProperty('name');
      expect(res.body.stats[0].status).toEqual(rawRankerStats[0].status);
    });

    it('429는 rate limit 안내 메시지로 구분한다', async () => {
      vi.stubGlobal(
        'fetch',
        mockNexon({ '/ranker-stats': { error: { name: 'OPENAPI00007' } } }, 429)
      );
      const players = encodeURIComponent(JSON.stringify([{ id: 1, po: 25 }]));

      const res = await request(app()).get(`/api/nexon/ranker-stats?players=${players}`);

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('제한');
      expect(res.body.detail.name).toBe('OPENAPI00007');
    });
  });

  describe('GET /trade', () => {
    it('ouid도 nickname도 없으면 400을 준다', async () => {
      const res = await request(app()).get('/api/nexon/trade');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('OUID');
    });

    it('선수명을 조인해 거래 내역을 반환한다', async () => {
      vi.stubGlobal('fetch', mockNexon({ '/user/trade': rawTrades }));

      const res = await request(app()).get(`/api/nexon/trade?ouid=${OUID}&tradetype=buy`);

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(rawTrades.length);
      expect(res.body.trades[0].name).toBeTruthy();
      expect(res.body.trades[0].image).toContain(
        `/players/p${res.body.trades[0].spid % 1_000_000}.png`
      );
    });
  });

  describe('GET /user-matches', () => {
    it('구단주 식별자가 없으면 400을 준다', async () => {
      const res = await request(app()).get('/api/nexon/user-matches');
      expect(res.status).toBe(400);
    });

    it('매치별 요약과 집계를 함께 반환한다', async () => {
      vi.stubGlobal(
        'fetch',
        mockNexon({ '/user/match': ['m1'], '/match-detail': rawMatchDetail })
      );

      const res = await request(app()).get(`/api/nexon/user-matches?ouid=${OUID}&matchtype=52`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalMatches).toBe(1);
      expect(res.body.matches[0]).toHaveProperty('myGoalScorers');
      expect(res.body.matches[0].matchType).toBe('감독모드');
    });
  });

  describe('GET /metadata', () => {
    it('알 수 없는 type은 400으로 막는다', async () => {
      const res = await request(app()).get('/api/nexon/metadata?type=unknown');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid metadata type');
    });
  });
});
