// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetaView } from './MetaView';
import * as api from '../lib/api/nexon';
import type { MatchDetailResponse, MatchSquadPlayer, MatchTeam } from '../lib/api/types';

function player(
  spId: number,
  rating: number,
  stats: Partial<MatchSquadPlayer['stats']> = {}
): MatchSquadPlayer {
  return {
    spId,
    spPosition: 25,
    name: `선수${spId}`,
    season: '26 TOTS (26 Team Of The Season)',
    position: 'LM',
    grade: 0,
    goals: stats.goal ?? 0,
    assists: stats.assist ?? 0,
    rating,
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
      ...stats,
    },
  };
}

function makeTeam(squad: MatchSquadPlayer[]): MatchTeam {
  return {
    ouid: 'me',
    nickname: '테스트구단주',
    result: '승',
    score: 2,
    possession: 55,
    totalShots: 5,
    effectiveShots: 3,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    controller: 'pad',
    averageRating: 4.2, // 미출전 0점이 섞인 넥슨 원본값
    squad,
  };
}

const detail: MatchDetailResponse = {
  matchId: 'm1',
  matchDate: '2026-01-01T12:00:00',
  matchType: '감독모드',
  teams: [],
};

function rankerStat(spid: number, goal: number, matchCount = 20) {
  return {
    spid,
    spPosition: 25,
    name: `선수${spid}`,
    season: '',
    position: 'LM',
    image: '',
    status: {
      shoot: 0,
      effectiveShoot: 0,
      goal,
      assist: 0,
      dribbleTry: 0,
      dribbleSuccess: 0,
      passTry: 0,
      passSuccess: 0,
      block: 0,
      tackle: 0,
      matchCount,
    },
  };
}

describe('MetaView', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getRankerStats').mockResolvedValue({ matchType: '50', stats: [] } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('구단주 미선택 시 안내를 보여준다', () => {
    render(<MetaView matchDetail={null} myTeam={null} matchType="50" matchLoading={false} />);

    expect(screen.getByText(/구단주를 검색하고 매치를 선택/)).toBeDefined();
  });

  it('미출전 선수(평점 0)를 비교에서 제외하고 그 수를 알린다', async () => {
    const team = makeTeam([player(1, 7.5), player(2, 6.8), player(3, 0), player(4, 0)]);
    render(<MetaView matchDetail={detail} myTeam={team} matchType="50" matchLoading={false} />);

    await waitFor(() => expect(api.getRankerStats).toHaveBeenCalled());

    // 출전 2명만 조회 대상
    expect(api.getRankerStats).toHaveBeenCalledWith(
      [
        { id: 1, po: 25 },
        { id: 2, po: 25 },
      ],
      '50'
    );
    expect(screen.getByText(/미출전 2명 제외/)).toBeDefined();
  });

  it('출전 선수 기준으로 평균 평점을 계산한다 (넥슨 averageRating은 과소 집계)', async () => {
    const team = makeTeam([player(1, 8.0), player(2, 6.0), player(3, 0)]);
    render(<MetaView matchDetail={detail} myTeam={team} matchType="50" matchLoading={false} />);

    // (8.0 + 6.0) / 2 = 7.0 — 원본 averageRating 4.2가 아니라
    await waitFor(() => expect(screen.getByText('7.0')).toBeDefined());
    expect(screen.queryByText('4.2')).toBeNull();
  });

  it('랭커 평균을 넘어선 선수 수를 집계한다', async () => {
    vi.spyOn(api, 'getRankerStats').mockResolvedValue({
      matchType: '50',
      stats: [rankerStat(1, 0.2), rankerStat(2, 0.5)],
    } as never);

    // 선수1은 1골(랭커 0.2) → 상회, 선수2는 0골(랭커 0.5) → 미달
    const team = makeTeam([player(1, 8.0, { goal: 1 }), player(2, 6.0, { goal: 0 })]);
    render(<MetaView matchDetail={detail} myTeam={team} matchType="50" matchLoading={false} />);

    await waitFor(() => expect(screen.getByText('2/2')).toBeDefined()); // 비교 선수
    const outperformed = screen.getByText('랭커 평균 상회').parentElement;
    expect(outperformed?.textContent).toContain('1');
  });

  it('랭커 표본 경기 수를 노출해 신뢰도를 판단할 수 있게 한다', async () => {
    vi.spyOn(api, 'getRankerStats').mockResolvedValue({
      matchType: '50',
      stats: [rankerStat(1, 0.2, 3)],
    } as never);

    render(
      <MetaView
        matchDetail={detail}
        myTeam={makeTeam([player(1, 8.0)])}
        matchType="50"
        matchLoading={false}
      />
    );

    await waitFor(() => expect(screen.getByText(/랭커 표본 3경기/)).toBeDefined());
  });

  it('랭커 통계가 없는 선수는 표본 없음으로 표시한다', async () => {
    render(
      <MetaView
        matchDetail={detail}
        myTeam={makeTeam([player(1, 8.0)])}
        matchType="50"
        matchLoading={false}
      />
    );

    await waitFor(() => expect(screen.getByText(/랭커 표본 없음/)).toBeDefined());
  });

  it('출전 선수가 없으면 비교 대신 안내를 보여준다', async () => {
    render(
      <MetaView
        matchDetail={detail}
        myTeam={makeTeam([player(1, 0), player(2, 0)])}
        matchType="50"
        matchLoading={false}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(/출전 기록이 있는 선수가 없습니다/)).toBeDefined()
    );
    expect(api.getRankerStats).not.toHaveBeenCalled();
  });

  it('조회 실패 시 에러를 보여준다', async () => {
    vi.spyOn(api, 'getRankerStats').mockRejectedValue(new Error('rate limit'));

    render(
      <MetaView
        matchDetail={detail}
        myTeam={makeTeam([player(1, 8.0)])}
        matchType="50"
        matchLoading={false}
      />
    );

    await waitFor(() => expect(screen.getByText('rate limit')).toBeDefined());
  });
});
