// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MatchView } from './MatchView';
import type { MatchDetailResponse, MatchSummary, MatchTeam } from '../lib/api/types';

function summary(matchId: string, result: '승' | '무' | '패' = '승'): MatchSummary {
  return {
    matchId,
    matchDate: '2026-01-02T09:05:00',
    matchType: '감독모드',
    result,
    score: '2 : 1',
    myGoals: 2,
    opponentGoals: 1,
    opponentNickname: `상대${matchId}`,
    possession: 55,
    shots: 8,
    effectiveShots: 4,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    myGoalScorers: [],
    oppGoalScorers: [],
    controller: 'pad',
  };
}

function team(nickname: string): MatchTeam {
  return {
    ouid: 'o1',
    nickname,
    result: '승',
    score: 2,
    possession: 55,
    totalShots: 8,
    effectiveShots: 4,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    controller: 'pad',
    averageRating: 7,
    squad: [],
  };
}

const detail: MatchDetailResponse = {
  matchId: 'm1',
  matchDate: '2026-01-02T09:05:00',
  matchType: '감독모드',
  teams: [team('나'), team('상대')],
};

function renderView(overrides = {}) {
  const onSelectMatch = vi.fn();
  render(
    <MatchView
      matches={[summary('m1'), summary('m2', '패')]}
      selectedMatchId="m1"
      onSelectMatch={onSelectMatch}
      matchDetail={detail}
      myTeam={detail.teams[0]}
      loading={false}
      error={null}
      ownerNickname="테스트구단주"
      {...overrides}
    />
  );
  return { onSelectMatch };
}

describe('MatchView', () => {
  it('최근 매치를 빠른 선택으로 나열한다', () => {
    renderView();

    expect(screen.getByText(/최근 매치 \(테스트구단주\)/)).toBeDefined();
    expect(screen.getByText(/vs\s*상대m1/)).toBeDefined();
    expect(screen.getByText(/vs\s*상대m2/)).toBeDefined();
  });

  it('매치를 누르면 선택 콜백을 호출한다', () => {
    const { onSelectMatch } = renderView();

    fireEvent.click(screen.getByText(/vs\s*상대m2/));

    expect(onSelectMatch).toHaveBeenCalledWith('m2');
  });

  it('구단주 미조회 시 안내를 보여준다', () => {
    renderView({ matches: [], matchDetail: null, myTeam: null });

    expect(screen.getByText(/구단주 탭에서 구단주를 검색/)).toBeDefined();
  });

  it('로딩 중에는 상세 대신 진행 표시를 보여준다', () => {
    renderView({ loading: true });

    expect(screen.getByText(/불러오는 중/)).toBeDefined();
    expect(screen.queryByText('2 : 2')).toBeNull();
  });

  it('에러가 있으면 상세 대신 에러를 보여준다', () => {
    renderView({ error: '매치 상세를 불러오지 못했습니다.' });

    expect(screen.getByText('매치 상세를 불러오지 못했습니다.')).toBeDefined();
  });

  it('내 팀 기준으로 스쿼드 평점을 보여준다 (teams[0]이 아니라)', () => {
    const myTeam = team('내구단');
    renderView({
      matchDetail: { ...detail, teams: [team('상대구단'), myTeam] },
      myTeam,
    });

    expect(screen.getByText(/선수별 경기 평점 \(내구단\)/)).toBeDefined();
  });

  it('매치 기록이 없으면 빠른 선택 영역을 숨긴다', () => {
    renderView({ matches: [] });
    expect(screen.queryByText(/최근 매치 \(/)).toBeNull();
  });
});
