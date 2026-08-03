// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MatchScoreboard } from './MatchScoreboard';
import type { MatchDetailResponse, MatchTeam } from '../../lib/api/types';

function team(overrides: Partial<MatchTeam> = {}): MatchTeam {
  return {
    ouid: 'o1',
    nickname: '홈구단',
    result: '승',
    score: 3,
    possession: 60,
    totalShots: 10,
    effectiveShots: 5,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    controller: 'pad',
    averageRating: 7.2,
    squad: [],
    ...overrides,
  };
}

function detail(teams: MatchTeam[]): MatchDetailResponse {
  return {
    matchId: 'm1',
    matchDate: '2026-01-02T09:05:00',
    matchType: '감독모드',
    teams,
  };
}

describe('MatchScoreboard', () => {
  it('양 팀 스코어와 매치 타입을 보여준다', () => {
    render(
      <MatchScoreboard
        detail={detail([team(), team({ nickname: '원정구단', score: 1, result: '패' })])}
      />
    );

    expect(screen.getByText('3 : 1')).toBeDefined();
    expect(screen.getByText('홈구단')).toBeDefined();
    expect(screen.getByText('원정구단')).toBeDefined();
    expect(screen.getByText('감독모드')).toBeDefined();
  });

  it('네 가지 비교 지표를 모두 그린다', () => {
    render(<MatchScoreboard detail={detail([team(), team()])} />);

    expect(screen.getByText('점유율')).toBeDefined();
    expect(screen.getByText('유효슈팅 / 총슈팅')).toBeDefined();
    expect(screen.getByText('패스 성공률')).toBeDefined();
    expect(screen.getByText('태클 성공률')).toBeDefined();
  });

  it('유효슈팅 비율을 총슈팅 기준으로 계산한다', () => {
    const { container } = render(
      <MatchScoreboard
        detail={detail([
          team({ effectiveShots: 5, totalShots: 10 }),
          team({ effectiveShots: 2, totalShots: 8 }),
        ])}
      />
    );

    const widths = Array.from(container.querySelectorAll('[style*="width"]')).map(
      (el) => (el as HTMLElement).style.width
    );
    expect(widths).toContain('50%'); // 5/10
    expect(widths).toContain('25%'); // 2/8
  });

  it('총슈팅이 0이어도 0으로 나누지 않는다', () => {
    expect(() =>
      render(
        <MatchScoreboard detail={detail([team({ effectiveShots: 0, totalShots: 0 }), team()])} />
      )
    ).not.toThrow();
  });

  it('팀이 한쪽뿐이면 아무것도 그리지 않는다', () => {
    const { container } = render(<MatchScoreboard detail={detail([team()])} />);
    expect(container.firstChild).toBeNull();
  });
});
