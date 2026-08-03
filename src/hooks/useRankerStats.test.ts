// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statKey, useRankerStats } from './useRankerStats';
import * as api from '../lib/api/nexon';
import type { MatchSquadPlayer } from '../lib/api/types';

function player(spId: number, spPosition: number): MatchSquadPlayer {
  return {
    spId,
    spPosition,
    name: `선수 ${spId}`,
    season: '',
    position: 'LM',
    grade: 0,
    goals: 0,
    assists: 0,
    rating: 7,
    image: '',
    stats: {
      shoot: 0,
      effectiveShoot: 0,
      goal: 0,
      assist: 0,
      dribbleTry: 0,
      dribbleSuccess: 0,
      passTry: 0,
      passSuccess: 0,
      block: 0,
      tackle: 0,
    },
  };
}

function rankerStat(spid: number, spPosition: number) {
  return {
    spid,
    spPosition,
    name: `선수 ${spid}`,
    season: '',
    position: 'LM',
    image: '',
    status: {
      shoot: 1,
      effectiveShoot: 1,
      goal: 0.5,
      assist: 0.2,
      dribbleTry: 3,
      dribbleSuccess: 2,
      passTry: 10,
      passSuccess: 8,
      block: 0,
      tackle: 1,
      matchCount: 20,
    },
  };
}

describe('statKey', () => {
  it('spid와 포지션 조합을 구분한다', () => {
    // 같은 선수라도 포지션이 다르면 통계가 다르다
    expect(statKey(100, 25)).not.toBe(statKey(100, 24));
    expect(statKey(100, 25)).toBe(statKey(100, 25));
  });
});

describe('useRankerStats', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getRankerStats').mockResolvedValue({
      matchType: '50',
      stats: [rankerStat(1, 25), rankerStat(2, 24)],
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('빈 스쿼드면 요청하지 않는다', () => {
    const { result } = renderHook(() => useRankerStats([], '50'));

    expect(api.getRankerStats).not.toHaveBeenCalled();
    expect(result.current.stats.size).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('스쿼드 전체를 한 번의 요청으로 조회한다', async () => {
    const squad = [player(1, 25), player(2, 24), player(3, 28)];
    renderHook(() => useRankerStats(squad, '50'));

    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalledTimes(1));
    expect(api.getRankerStats).toHaveBeenCalledWith(
      [
        { id: 1, po: 25 },
        { id: 2, po: 24 },
        { id: 3, po: 28 },
      ],
      '50'
    );
  });

  it('spid+포지션을 키로 하는 Map을 반환한다', async () => {
    const { result } = renderHook(() => useRankerStats([player(1, 25)], '50'));

    await waitFor(() => expect(result.current.stats.size).toBe(2));
    expect(result.current.stats.get(statKey(1, 25))?.status.matchCount).toBe(20);
    expect(result.current.stats.get(statKey(1, 24))).toBeUndefined();
  });

  it('내용이 같은 새 배열로 리렌더되어도 재조회하지 않는다', async () => {
    const { rerender } = renderHook(({ squad }) => useRankerStats(squad, '50'), {
      initialProps: { squad: [player(1, 25)] },
    });
    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalledTimes(1));

    // 부모 리렌더로 매번 새 배열이 내려오는 상황
    rerender({ squad: [player(1, 25)] });
    rerender({ squad: [player(1, 25)] });

    expect(api.getRankerStats).toHaveBeenCalledTimes(1);
  });

  it('스쿼드가 실제로 바뀌면 재조회한다', async () => {
    const { rerender } = renderHook(({ squad }) => useRankerStats(squad, '50'), {
      initialProps: { squad: [player(1, 25)] },
    });
    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalledTimes(1));

    rerender({ squad: [player(1, 25), player(2, 24)] });

    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalledTimes(2));
  });

  it('매치 타입이 바뀌면 재조회한다', async () => {
    const squad = [player(1, 25)];
    const { rerender } = renderHook(({ matchType }) => useRankerStats(squad, matchType), {
      initialProps: { matchType: '50' },
    });
    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalledTimes(1));

    rerender({ matchType: '52' });

    await waitFor(() =>
      expect(api.getRankerStats).toHaveBeenCalledWith(expect.anything(), '52')
    );
  });

  it('rate limit 등 실패 시 에러를 노출하고 결과를 비운다', async () => {
    vi.spyOn(api, 'getRankerStats').mockRejectedValue(
      new Error('넥슨 API 호출이 일시적으로 제한되었습니다.')
    );

    const { result } = renderHook(() => useRankerStats([player(1, 25)], '50'));

    await waitFor(() =>
      expect(result.current.error).toBe('넥슨 API 호출이 일시적으로 제한되었습니다.')
    );
    expect(result.current.stats.size).toBe(0);
    expect(result.current.loading).toBe(false);
  });
});
