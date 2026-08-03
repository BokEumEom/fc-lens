// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MatchHistoryList } from './MatchHistoryList';
import type { MatchSummary } from '../../lib/api/types';

function match(matchId: string, result: '승' | '무' | '패'): MatchSummary {
  return {
    matchId,
    matchDate: '2026-01-01T12:00:00',
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
    myGoalScorers: [{ name: '카제미루', goals: 2, rating: 8.1 }],
    oppGoalScorers: [],
    controller: 'pad',
  };
}

const matches = [match('m1', '승'), match('m2', '패'), match('m3', '무'), match('m4', '승')];

function renderList(overrides = {}) {
  const onOpenDetail = vi.fn();
  render(
    <MatchHistoryList
      matches={matches}
      loading={false}
      error={null}
      onOpenDetail={onOpenDetail}
      {...overrides}
    />
  );
  return { onOpenDetail };
}

describe('MatchHistoryList', () => {
  it('기본은 전체 매치를 보여준다', () => {
    renderList();
    expect(screen.getAllByText(/^상대m/)).toHaveLength(4);
  });

  it('승리 필터는 승리 경기만 남긴다', () => {
    renderList();
    fireEvent.click(screen.getByText('승리'));

    expect(screen.getAllByText(/^상대m/)).toHaveLength(2);
    expect(screen.getByText('상대m1')).toBeDefined();
    expect(screen.queryByText('상대m2')).toBeNull();
  });

  it('무승부·패배 필터도 각각 동작한다', () => {
    renderList();

    fireEvent.click(screen.getByText('무승부'));
    expect(screen.getAllByText(/^상대m/)).toHaveLength(1);
    expect(screen.getByText('상대m3')).toBeDefined();

    fireEvent.click(screen.getByText('패배'));
    expect(screen.getByText('상대m2')).toBeDefined();
  });

  it('필터 결과가 없으면 안내를 보여준다', () => {
    render(
      <MatchHistoryList
        matches={[match('m1', '승')]}
        loading={false}
        error={null}
        onOpenDetail={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('패배'));

    expect(screen.getByText(/표시할 매치 기록이 없습니다/)).toBeDefined();
  });

  it('상세 토글은 해당 카드만 펼친다', () => {
    renderList();

    expect(screen.queryByText(/슈팅 유효율/)).toBeNull();
    fireEvent.click(screen.getAllByText('상세')[0]);

    expect(screen.getAllByText(/슈팅 유효율/)).toHaveLength(1);
    expect(screen.getByText('접기')).toBeDefined();
  });

  it('전술 분석을 누르면 매치 ID로 콜백한다', () => {
    const { onOpenDetail } = renderList();

    fireEvent.click(screen.getAllByText('전술 분석')[0]);

    expect(onOpenDetail).toHaveBeenCalledWith('m1');
  });

  it('득점자가 없으면 "득점 없음"으로 표기한다', () => {
    renderList();
    // 상대팀 득점자는 비어 있다
    expect(screen.getAllByText('득점 없음').length).toBeGreaterThan(0);
  });

  it('에러가 있으면 목록 대신 에러를 보여준다', () => {
    renderList({ error: '매치 기록을 불러오지 못했습니다.' });

    expect(screen.getByText('매치 기록을 불러오지 못했습니다.')).toBeDefined();
    expect(screen.queryByText('상대m1')).toBeNull();
  });
});
