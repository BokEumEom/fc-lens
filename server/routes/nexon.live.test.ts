import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nexonRouter } from './nexon';

const OUID = 'test-ouid';

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/nexon', nexonRouter);
  return instance;
}

function metaResponse(url: string) {
  const body = url.includes('spid.json')
    ? [{ id: 1, name: '선수' }]
    : url.includes('spposition.json')
      ? [{ spposition: 25, desc: 'LM' }]
      : url.includes('seasonid.json')
        ? [{ seasonId: 1, className: 'S', seasonImg: '' }]
        : [{ matchtype: 50, desc: '공식경기' }];
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

/** matchDate를 지금으로부터 N분 전으로 만든다. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function matchDetail(matchDate: string) {
  return {
    matchId: 'm1',
    matchDate,
    matchType: 50,
    matchInfo: [
      {
        ouid: OUID,
        nickname: '나',
        matchDetail: { possession: 60 },
        shoot: { goalTotal: 2, shootTotal: 8, effectiveShootTotal: 4 },
        player: [{ spId: 1, spPosition: 25, status: { goal: 1 } }],
      },
      {
        ouid: 'opp',
        nickname: '상대',
        matchDetail: { possession: 40 },
        shoot: { goalTotal: 1, shootTotal: 5, effectiveShootTotal: 2 },
        player: [],
      },
    ],
  };
}

function mockNexon(routes: Record<string, unknown>, okByPath: Record<string, boolean> = {}) {
  return vi.fn(async (url: string) => {
    if (url.includes('/static/fconline/meta/')) return metaResponse(url);

    const hit = Object.keys(routes).find((k) => url.includes(k));
    if (!hit) {
      return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
    }
    const ok = okByPath[hit] ?? true;
    return {
      ok,
      status: ok ? 200 : 500,
      json: async () => routes[hit],
    } as unknown as Response;
  });
}

describe('GET /live-match', () => {
  beforeEach(() => {
    process.env.NEXON_OPENAPI_KEY = 'env_key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('구단주 식별자가 없으면 400을 준다', async () => {
    const res = await request(app()).get('/api/nexon/live-match');
    expect(res.status).toBe(400);
  });

  it('nickname만 주면 ouid를 먼저 조회한다', async () => {
    const fetchMock = mockNexon({ '/id': { ouid: OUID }, '/user/match': [] });
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app()).get('/api/nexon/live-match?nickname=테스트');

    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/id?nickname='))).toBe(true);
  });

  it('최근 20분 내 경기면 진행 중으로 판단한다', async () => {
    vi.stubGlobal(
      'fetch',
      mockNexon({ '/user/match': ['m1'], '/match-detail': matchDetail(minutesAgo(5)) })
    );

    const res = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);

    expect(res.status).toBe(200);
    expect(res.body.isPlaying).toBe(true);
    expect(res.body.liveMatch.myTeam.nickname).toBe('나');
    expect(res.body.liveMatch.opponentTeam.nickname).toBe('상대');
    expect(res.body.liveMatch.matchType).toBe('공식경기');
  });

  it('20분을 넘긴 경기는 진행 중으로 보지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      mockNexon({ '/user/match': ['m1'], '/match-detail': matchDetail(minutesAgo(45)) })
    );

    const res = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);

    expect(res.body.isPlaying).toBe(false);
  });

  it('경과 시간에 따라 전반/후반을 구분한다', async () => {
    vi.stubGlobal(
      'fetch',
      mockNexon({ '/user/match': ['m1'], '/match-detail': matchDetail(minutesAgo(3)) })
    );
    const firstHalf = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);
    expect(firstHalf.body.liveMatch.period).toBe('전반전');

    vi.stubGlobal(
      'fetch',
      mockNexon({ '/user/match': ['m1'], '/match-detail': matchDetail(minutesAgo(15)) })
    );
    const secondHalf = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);
    expect(secondHalf.body.liveMatch.period).toBe('후반전');
  });

  it('최근 경기가 없으면 안내와 함께 false를 준다', async () => {
    vi.stubGlobal('fetch', mockNexon({ '/user/match': [] }));

    const res = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);

    expect(res.body.isPlaying).toBe(false);
    expect(res.body.message).toContain('최근 경기 내역이 없습니다');
  });

  it('매치 상세 조회에 실패해도 200과 안내를 준다', async () => {
    vi.stubGlobal(
      'fetch',
      mockNexon({ '/user/match': ['m1'], '/match-detail': {} }, { '/match-detail': false })
    );

    const res = await request(app()).get(`/api/nexon/live-match?ouid=${OUID}`);

    expect(res.status).toBe(200);
    expect(res.body.isPlaying).toBe(false);
  });
});

describe('GET /images', () => {
  it('spid와 seasonid로 CDN URL을 조합한다', async () => {
    const res = await request(app()).get('/api/nexon/images?spid=123&seasonid=456');

    expect(res.status).toBe(200);
    expect(res.body.playerPortraitUrl).toContain('/players/p123.png');
    expect(res.body.playerActionShotUrl).toContain('/playersAction/p123.png');
    expect(res.body.seasonBadgeUrl).toContain('/season/456.png');
  });

  it('파라미터가 없으면 기본값을 쓴다', async () => {
    const res = await request(app()).get('/api/nexon/images');

    expect(res.body.spId).toBe('250102143');
    expect(res.body.seasonId).toBe('101');
  });
});

describe('POST /verify-key', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('키가 없으면 400을 준다', async () => {
    const res = await request(app()).post('/api/nexon/verify-key').send({});

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('넥슨이 200을 주면 유효로 판정한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) }) as unknown as Response));

    const res = await request(app()).post('/api/nexon/verify-key').send({ apiKey: 'k' });

    expect(res.body.valid).toBe(true);
  });

  it('넥슨 오류 메시지를 그대로 전달한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      }) as unknown as Response)
    );

    const res = await request(app()).post('/api/nexon/verify-key').send({ apiKey: 'bad' });

    expect(res.body.valid).toBe(false);
    expect(res.body.error).toBe('Invalid API key');
  });
});

describe('GET /metadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('메타 JSON을 그대로 전달한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [{ matchtype: 50, desc: '공식경기' }] }) as unknown as Response)
    );

    const res = await request(app()).get('/api/nexon/metadata?type=matchtype');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ matchtype: 50, desc: '공식경기' }]);
  });

  it('spid는 응답이 커서 일부만 잘라 준다', async () => {
    const big = Array.from({ length: 500 }, (_, i) => ({ id: i, name: `p${i}` }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => big }) as unknown as Response));

    const res = await request(app()).get('/api/nexon/metadata?type=spid');

    expect(res.body.count).toBe(500);
    expect(res.body.data).toHaveLength(100);
  });
});
