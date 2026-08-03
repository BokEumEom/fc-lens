// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MatchSquadRatings } from './MatchSquadRatings';
import type { MatchSquadPlayer, MatchTeam } from '../../lib/api/types';

function player(name: string, rating: number, overrides: Partial<MatchSquadPlayer> = {}): MatchSquadPlayer {
  return {
    spId: name.length + rating,
    spPosition: 25,
    name,
    season: '26 TOTS (26 Team Of The Season)',
    position: 'LM',
    grade: 0,
    goals: 0,
    assists: 0,
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
    },
    ...overrides,
  };
}

function team(squad: MatchSquadPlayer[]): MatchTeam {
  return {
    ouid: 'o1',
    nickname: '테스트구단주',
    result: '승',
    score: 2,
    possession: 55,
    totalShots: 5,
    effectiveShots: 3,
    passSuccessRate: 88,
    tackleSuccessRate: 60,
    controller: 'pad',
    averageRating: 7,
    squad,
  };
}

describe('MatchSquadRatings', () => {
  it('평점 내림차순으로 정렬한다 (미출전 0점은 뒤로)', () => {
    render(
      <MatchSquadRatings
        team={team([player('낮음', 6.1), player('미출전', 0), player('높음', 8.4)])}
      />
    );

    const names = screen.getAllByText(/높음|낮음|미출전/).map((el) => el.textContent);
    expect(names).toEqual(['높음', '낮음', '미출전']);
  });

  it('원본 배열을 변형하지 않는다', () => {
    const squad = [player('a', 6), player('b', 8)];
    const original = [...squad];

    render(<MatchSquadRatings team={team(squad)} />);

    expect(squad).toEqual(original);
  });

  it('평점을 소수 한 자리로 표기한다', () => {
    render(<MatchSquadRatings team={team([player('선수', 8)])} />);
    expect(screen.getByText('★ 8.0')).toBeDefined();
  });

  it('시즌은 괄호 앞 약칭만 보여준다', () => {
    render(<MatchSquadRatings team={team([player('선수', 7)])} />);

    expect(screen.getByText('26 TOTS')).toBeDefined();
    expect(screen.queryByText(/Team Of The Season/)).toBeNull();
  });

  it('강화 등급이 있으면 포지션 옆에 표기한다', () => {
    render(<MatchSquadRatings team={team([player('선수', 7, { grade: 5 })])} />);
    expect(screen.getByText(/LM.*\+5/)).toBeDefined();
  });

  it('강화 등급이 0이면 표기하지 않는다', () => {
    render(<MatchSquadRatings team={team([player('선수', 7, { grade: 0 })])} />);
    expect(screen.queryByText(/\+0/)).toBeNull();
  });

  it('득점·어시스트를 함께 보여준다', () => {
    render(<MatchSquadRatings team={team([player('선수', 7, { goals: 2, assists: 1 })])} />);
    expect(screen.getByText('2G 1A')).toBeDefined();
  });

  it('구단주 닉네임을 제목에 넣는다', () => {
    render(<MatchSquadRatings team={team([player('선수', 7)])} />);
    expect(screen.getByText(/테스트구단주/)).toBeDefined();
  });
});
