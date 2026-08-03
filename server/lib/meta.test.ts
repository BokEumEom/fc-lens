import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SPID = 866200145; // 시즌 866 + 선수 200145
const SEASON_IMG = 'https://example.test/season/866.png';

function mockMetaEndpoints() {
  return vi.fn(async (url: string) => {
    const body = url.includes('spid.json')
      ? [{ id: SPID, name: '카제미루' }]
      : url.includes('spposition.json')
        ? [{ spposition: 25, desc: 'LM' }]
        : url.includes('seasonid.json')
          ? [{ seasonId: 866, className: '26 TOTS', seasonImg: SEASON_IMG }]
          : [{ matchtype: 52, desc: '감독모드' }];

    return { ok: true, json: async () => body } as unknown as Response;
  });
}

// 모듈 수준 캐시를 쓰므로 테스트마다 모듈을 새로 불러온다.
async function freshMeta() {
  vi.resetModules();
  return import('./meta');
}

describe('meta 캐시', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockMetaEndpoints());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('4개 정적 메타를 적재한다', async () => {
    const { ensureMetaLoaded, getPlayerName, getPositionName, getMatchTypeName } =
      await freshMeta();
    const meta = await ensureMetaLoaded();

    expect(getPlayerName(meta, SPID)).toBe('카제미루');
    expect(getPositionName(meta, 25)).toBe('LM');
    expect(getMatchTypeName(meta, 52)).toBe('감독모드');
  });

  it('두 번째 호출은 네트워크를 다시 타지 않는다', async () => {
    const { ensureMetaLoaded } = await freshMeta();

    await ensureMetaLoaded();
    const callsAfterFirst = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await ensureMetaLoaded();

    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      callsAfterFirst
    );
  });

  it('동시 호출은 하나의 in-flight 프라미스를 공유한다', async () => {
    const { ensureMetaLoaded } = await freshMeta();

    await Promise.all([ensureMetaLoaded(), ensureMetaLoaded(), ensureMetaLoaded()]);

    // 메타 파일 4개 = 4번. 3배로 늘어나면 프라미스 공유가 깨진 것.
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(4);
  });

  it('실패한 프라미스를 캐싱하지 않아 다음 요청에서 재시도된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503 }) as unknown as Response)
    );
    const { ensureMetaLoaded } = await freshMeta();

    await expect(ensureMetaLoaded()).rejects.toThrow(/정적 메타데이터 조회 실패/);

    // 복구된 뒤에는 성공해야 한다
    vi.stubGlobal('fetch', mockMetaEndpoints());
    await expect(ensureMetaLoaded()).resolves.toBeDefined();
  });

  it('시즌은 spid / 1_000_000으로 도출한다', async () => {
    const { ensureMetaLoaded, getSeasonName, getSeasonImageUrl } = await freshMeta();
    const meta = await ensureMetaLoaded();

    expect(getSeasonName(meta, SPID)).toBe('26 TOTS');
    expect(getSeasonImageUrl(meta, SPID)).toBe(SEASON_IMG);
  });

  it('메타에 없는 값은 식별 가능한 대체 문자열을 돌려준다', async () => {
    const { ensureMetaLoaded, getPlayerName, getPositionName, getMatchTypeName, getSeasonName } =
      await freshMeta();
    const meta = await ensureMetaLoaded();

    expect(getPlayerName(meta, 111)).toContain('111');
    expect(getPositionName(meta, 99)).toBe('99');
    expect(getMatchTypeName(meta, 77)).toContain('77');
    expect(getSeasonName(meta, 111)).toBe('');
  });

  it('이미지 URL은 spid 기반 CDN 경로를 만든다', async () => {
    const { getPlayerImageUrl, getPlayerActionImageUrl } = await freshMeta();

    expect(getPlayerImageUrl(SPID)).toBe(
      `https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p${SPID}.png`
    );
    expect(getPlayerActionImageUrl(SPID)).toContain('playersAction');
  });
});
