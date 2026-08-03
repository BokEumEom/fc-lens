// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OwnerView } from './OwnerView';
import type { OwnerData } from '../hooks/useOwnerData';

function makeOwner(overrides: Partial<OwnerData> = {}): OwnerData {
  return {
    nickname: '',
    account: null,
    accountLoading: false,
    accountError: null,
    recentMatchIds: [],
    searchOwner: vi.fn(),
    matchType: '50',
    setMatchType: vi.fn(),
    matchesSummary: null,
    matches: [],
    matchesLoading: false,
    matchesError: null,
    liveMatch: null,
    liveLoading: false,
    refreshLive: vi.fn(),
    selectedMatchId: null,
    selectMatch: vi.fn(),
    matchDetail: null,
    matchDetailLoading: false,
    matchDetailError: null,
    myTeam: null,
    opponentTeam: null,
    tradeType: 'buy',
    setTradeType: vi.fn(),
    trades: [],
    tradesLoading: false,
    tradesError: null,
    ...overrides,
  };
}

const account = {
  ouid: 'o1',
  nickname: '테스트구단주',
  level: 100,
  maxDivision: '챌린저 3',
  divisionCode: 1300,
  achievementDate: '2021-04-16T14:09:03',
};

function renderView(owner: OwnerData) {
  const onOpenMatchDetail = vi.fn();
  const onCopyOuid = vi.fn();
  render(
    <OwnerView owner={owner} onOpenMatchDetail={onOpenMatchDetail} onCopyOuid={onCopyOuid} />
  );
  return { onOpenMatchDetail, onCopyOuid };
}

describe('OwnerView', () => {
  it('처음 방문하면 검색 안내를 보여준다 (남의 데이터를 먼저 띄우지 않는다)', () => {
    renderView(makeOwner());

    expect(screen.getByText('구단주를 검색해보세요')).toBeDefined();
    expect(screen.queryByText('역대 최고 등급')).toBeNull();
  });

  it('조회 중에는 로딩 상태를 보여준다', () => {
    renderView(makeOwner({ nickname: '테스트구단주', accountLoading: true }));

    expect(screen.getByText(/넥슨 Open API 조회 중/)).toBeDefined();
    expect(screen.queryByText('구단주를 검색해보세요')).toBeNull();
  });

  it('조회 실패 시 에러와 안내를 보여준다', () => {
    renderView(makeOwner({ nickname: '없는사람', accountError: '구단주를 찾을 수 없습니다.' }));

    expect(screen.getByText('구단주를 찾을 수 없습니다.')).toBeDefined();
    expect(screen.getByText(/정확한 닉네임인지 확인/)).toBeDefined();
  });

  it('계정을 불러오면 카드와 매치 영역을 보여준다', () => {
    renderView(makeOwner({ nickname: '테스트구단주', account }));

    expect(screen.getByText('테스트구단주')).toBeDefined();
    expect(screen.getByText('챌린저 3')).toBeDefined();
    expect(screen.getByText('최근 매치 전적')).toBeDefined();
  });

  it('OUID 복사 버튼이 콜백을 호출한다', () => {
    const { onCopyOuid } = renderView(makeOwner({ nickname: '테스트구단주', account }));

    fireEvent.click(screen.getByText('OUID 복사'));

    expect(onCopyOuid).toHaveBeenCalledWith('o1');
  });

  it('매치 타입 필터가 공식 메타 기준 코드로 동작한다', () => {
    const setMatchType = vi.fn();
    renderView(makeOwner({ nickname: '테스트구단주', account, setMatchType }));

    // 52는 볼타 라이브가 아니라 감독모드다
    fireEvent.click(screen.getByText('감독모드'));

    expect(setMatchType).toHaveBeenCalledWith('52');
  });

  it('검색어를 입력하면 searchOwner를 호출한다', () => {
    const searchOwner = vi.fn();
    const { container } = render(
      <OwnerView
        owner={makeOwner({ searchOwner })}
        onOpenMatchDetail={vi.fn()}
        onCopyOuid={vi.fn()}
      />
    );

    fireEvent.change(container.querySelector('input')!, { target: { value: '새구단주' } });
    fireEvent.submit(container.querySelector('form')!);

    expect(searchOwner).toHaveBeenCalledWith('새구단주');
  });

  it('예시 닉네임을 누르면 즉시 검색한다', () => {
    const searchOwner = vi.fn();
    renderView(makeOwner({ searchOwner }));

    fireEvent.click(screen.getByText('감스트'));

    expect(searchOwner).toHaveBeenCalledWith('감스트');
  });
});
