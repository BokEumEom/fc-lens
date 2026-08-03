// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOwnerData } from './useOwnerData';
import * as api from '../lib/api/nexon';

const OUID = 'owner-ouid';

const account = {
  account: {
    ouid: OUID,
    nickname: '테스트구단주',
    level: 100,
    maxDivision: '챌린저 3',
    divisionCode: 1300,
    achievementDate: '2021-04-16T14:09:03',
  },
  recentMatchIds: ['m1', 'm2'],
};

function team(ouid: string, nickname: string) {
  return {
    ouid,
    nickname,
    result: '승' as const,
    score: 2,
    possession: 55,
    totalShots: 5,
    effectiveShots: 3,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    controller: 'pad',
    averageRating: 4.2,
    squad: [],
  };
}

function stubApi() {
  vi.spyOn(api, 'getAccount').mockResolvedValue(account as never);
  vi.spyOn(api, 'getUserMatches').mockResolvedValue({
    ouid: OUID,
    matchType: '50',
    summary: { totalMatches: 1, wins: 1, losses: 0, draws: 0, winRate: '100.0%', avgGoals: '2.0', avgPossession: '55%' },
    matches: [],
  } as never);
  vi.spyOn(api, 'getLiveMatch').mockResolvedValue({ isPlaying: false } as never);
  vi.spyOn(api, 'getTrades').mockResolvedValue({ tradeType: 'buy', totalCount: 0, trades: [] } as never);
  vi.spyOn(api, 'getMatchDetail').mockResolvedValue({
    matchId: 'm1',
    matchDate: '2026-01-01T00:00:00',
    matchType: '감독모드',
    // 상대팀이 먼저 오는 실제 상황을 재현한다 (넥슨 원본 순서)
    teams: [team('other-ouid', '상대'), team(OUID, '테스트구단주')],
  } as never);
}

describe('useOwnerData', () => {
  beforeEach(() => {
    localStorage.clear();
    stubApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('저장된 구단주가 없으면 조회하지 않는다', async () => {
    const { result } = renderHook(() => useOwnerData(''));

    expect(result.current.nickname).toBe('');
    expect(api.getAccount).not.toHaveBeenCalled();
    expect(result.current.accountLoading).toBe(false);
  });

  it('마지막으로 조회한 구단주를 이어서 불러온다', async () => {
    localStorage.setItem('fclens_last_owner', '테스트구단주');
    const { result } = renderHook(() => useOwnerData(''));

    expect(result.current.nickname).toBe('테스트구단주');
    await waitFor(() => expect(result.current.account).not.toBeNull());
    expect(api.getAccount).toHaveBeenCalledWith('테스트구단주');
  });

  it('검색하면 닉네임을 저장한다', async () => {
    const { result } = renderHook(() => useOwnerData(''));

    act(() => result.current.searchOwner('  새구단주  '));

    await waitFor(() => expect(result.current.nickname).toBe('새구단주'));
    expect(localStorage.getItem('fclens_last_owner')).toBe('새구단주');
  });

  it('빈 검색어는 무시한다', async () => {
    const { result } = renderHook(() => useOwnerData(''));

    act(() => result.current.searchOwner('   '));

    expect(result.current.nickname).toBe('');
    expect(localStorage.getItem('fclens_last_owner')).toBeNull();
  });

  it('계정 조회 후 매치·이적을 ouid로 이어서 조회한다', async () => {
    const { result } = renderHook(() => useOwnerData(''));
    act(() => result.current.searchOwner('테스트구단주'));

    await waitFor(() => expect(result.current.account?.ouid).toBe(OUID));
    await waitFor(() => expect(api.getUserMatches).toHaveBeenCalled());

    expect(api.getUserMatches).toHaveBeenCalledWith(
      expect.objectContaining({ ouid: OUID, matchtype: '50' })
    );
    expect(api.getTrades).toHaveBeenCalledWith(
      expect.objectContaining({ ouid: OUID, tradetype: 'buy' })
    );
  });

  it('계정 조회 실패 시 에러를 노출하고 파생 데이터를 비운다', async () => {
    vi.spyOn(api, 'getAccount').mockRejectedValue(new Error('구단주를 찾을 수 없습니다.'));

    const { result } = renderHook(() => useOwnerData(''));
    act(() => result.current.searchOwner('없는구단주'));

    await waitFor(() => expect(result.current.accountError).toBe('구단주를 찾을 수 없습니다.'));
    expect(result.current.account).toBeNull();
    expect(result.current.matches).toEqual([]);
  });

  it('ouid로 내 팀을 식별한다 (teams[0]이 상대일 수 있다)', async () => {
    const { result } = renderHook(() => useOwnerData(''));
    act(() => result.current.searchOwner('테스트구단주'));

    await waitFor(() => expect(result.current.matchDetail).not.toBeNull());

    expect(result.current.matchDetail!.teams[0].ouid).toBe('other-ouid');
    expect(result.current.myTeam?.ouid).toBe(OUID);
    expect(result.current.opponentTeam?.ouid).toBe('other-ouid');
  });

  it('구단주가 바뀌면 첫 매치를 자동 선택한다', async () => {
    const { result } = renderHook(() => useOwnerData(''));
    act(() => result.current.searchOwner('테스트구단주'));

    await waitFor(() => expect(result.current.selectedMatchId).toBe('m1'));
    expect(api.getMatchDetail).toHaveBeenCalledWith('m1');
  });

  it('매치 타입을 바꾸면 매치 기록만 다시 조회한다', async () => {
    const { result } = renderHook(() => useOwnerData(''));
    act(() => result.current.searchOwner('테스트구단주'));
    await waitFor(() => expect(api.getUserMatches).toHaveBeenCalled());

    const accountCalls = (api.getAccount as ReturnType<typeof vi.fn>).mock.calls.length;
    act(() => result.current.setMatchType('52'));

    await waitFor(() =>
      expect(api.getUserMatches).toHaveBeenCalledWith(expect.objectContaining({ matchtype: '52' }))
    );
    // 계정은 다시 조회하지 않아야 한다
    expect((api.getAccount as ReturnType<typeof vi.fn>).mock.calls.length).toBe(accountCalls);
  });

  it('API 키가 바뀌면 계정을 다시 조회한다', async () => {
    localStorage.setItem('fclens_last_owner', '테스트구단주');
    const { rerender } = renderHook(({ key }) => useOwnerData(key), {
      initialProps: { key: '' },
    });

    await waitFor(() => expect(api.getAccount).toHaveBeenCalledTimes(1));
    rerender({ key: 'new-api-key' });

    await waitFor(() => expect(api.getAccount).toHaveBeenCalledTimes(2));
  });

  it('언마운트 후 도착한 응답은 상태에 반영하지 않는다', async () => {
    let resolveAccount: (v: unknown) => void = () => {};
    vi.spyOn(api, 'getAccount').mockReturnValue(
      new Promise((resolve) => {
        resolveAccount = resolve;
      }) as never
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('fclens_last_owner', '테스트구단주');
    const { unmount } = renderHook(() => useOwnerData(''));
    unmount();

    await act(async () => {
      resolveAccount(account);
    });

    // cancelled 가드가 없으면 언마운트된 컴포넌트 setState 경고가 난다
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
