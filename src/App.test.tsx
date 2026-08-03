// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as api from './lib/api/nexon';

const OUID = 'owner-ouid';

function stubApi() {
  vi.spyOn(api, 'getAccount').mockResolvedValue({
    account: {
      ouid: OUID,
      nickname: '테스트구단주',
      level: 100,
      maxDivision: '챌린저 3',
      divisionCode: 1300,
      achievementDate: '2021-04-16T14:09:03',
    },
    recentMatchIds: [],
  } as never);
  vi.spyOn(api, 'getUserMatches').mockResolvedValue({
    ouid: OUID,
    matchType: '50',
    summary: null,
    matches: [],
  } as never);
  vi.spyOn(api, 'getLiveMatch').mockResolvedValue({ isPlaying: false } as never);
  vi.spyOn(api, 'getTrades').mockResolvedValue({
    tradeType: 'buy',
    totalCount: 0,
    trades: [],
  } as never);
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    stubApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('구단주 탭으로 시작한다', () => {
    render(<App />);

    expect(screen.getByText('OWNER ANALYSIS')).toBeDefined();
    expect(screen.getByText('구단주를 검색해보세요')).toBeDefined();
  });

  it('탭을 바꾸면 부제와 화면이 함께 바뀐다', async () => {
    render(<App />);

    fireEvent.click(screen.getByText('이적'));
    await waitFor(() => expect(screen.getByText('TRANSFER HISTORY')).toBeDefined());

    fireEvent.click(screen.getByText('랭킹'));
    await waitFor(() => expect(screen.getByText('RANKER BENCHMARK')).toBeDefined());

    fireEvent.click(screen.getByText('매치'));
    await waitFor(() => expect(screen.getByText('MATCH DETAIL')).toBeDefined());
  });



  it('넥슨 API 키 입력 UI를 노출하지 않는다 (키는 서버 env 전용)', () => {
    render(<App />);

    expect(screen.queryByText('API 키 설정')).toBeNull();
    expect(screen.queryByText('넥슨 Open API 키')).toBeNull();
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it('마지막 구단주가 있으면 바로 조회한다', async () => {
    localStorage.setItem('fclens_last_owner', '테스트구단주');
    render(<App />);

    await waitFor(() => expect(screen.getByText('테스트구단주')).toBeDefined());
    expect(api.getAccount).toHaveBeenCalledWith('테스트구단주');
  });

  it('탭을 오가도 조회한 데이터가 유지된다', async () => {
    localStorage.setItem('fclens_last_owner', '테스트구단주');
    render(<App />);
    await waitFor(() => expect(api.getAccount).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('이적'));
    await waitFor(() => expect(screen.getByText('TRANSFER HISTORY')).toBeDefined());
    fireEvent.click(screen.getByText('구단주'));
    await waitFor(() => expect(screen.getByText('테스트구단주')).toBeDefined());

    // 뷰가 재마운트돼도 상태는 App의 훅이 소유하므로 재조회하지 않는다
    expect(api.getAccount).toHaveBeenCalledTimes(1);
  });
});
