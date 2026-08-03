// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TradeView } from './TradeView';
import type { TradeRecord } from '../lib/api/types';

function trade(overrides: Partial<TradeRecord> = {}): TradeRecord {
  return {
    tradeDate: '2026-01-02T09:05:00',
    saleSn: 'sn-1',
    spid: 866200145,
    grade: 5,
    value: 1_960_000_000_000,
    name: '폴 스콜스',
    season: 'CU (Champions of Europe)',
    image: 'https://example.test/p866200145.png',
    ...overrides,
  };
}

function renderView(overrides = {}) {
  const onChangeTradeType = vi.fn();
  render(
    <TradeView
      trades={[trade()]}
      tradeType="buy"
      onChangeTradeType={onChangeTradeType}
      loading={false}
      error={null}
      ownerNickname="테스트구단주"
      {...overrides}
    />
  );
  return { onChangeTradeType };
}

describe('TradeView', () => {
  it('BP 금액을 억 단위로 표기한다', () => {
    renderView();
    // 1,960,000,000,000 BP = 19,600억
    expect(screen.getByText('19,600억 BP')).toBeDefined();
  });

  it('소수점 이하는 한 자리까지만 남긴다', () => {
    renderView({ trades: [trade({ value: 155_000_000 })] });
    expect(screen.getByText('1.6억 BP')).toBeDefined();
  });

  it('거래 일시를 사람이 읽는 형식으로 표기한다', () => {
    renderView();
    expect(screen.getByText('2026.01.02 09:05')).toBeDefined();
  });

  it('날짜를 해석할 수 없으면 원본을 그대로 보여준다', () => {
    renderView({ trades: [trade({ tradeDate: '알 수 없음' })] });
    expect(screen.getByText('알 수 없음')).toBeDefined();
  });

  it('선수명·시즌·강화 등급을 함께 보여준다', () => {
    renderView();

    expect(screen.getByText('폴 스콜스')).toBeDefined();
    expect(screen.getByText('CU (Champions of Europe)')).toBeDefined();
    expect(screen.getByText('+5')).toBeDefined();
  });

  it('강화 등급이 0이면 배지를 숨긴다', () => {
    renderView({ trades: [trade({ grade: 0 })] });
    expect(screen.queryByText('+0')).toBeNull();
  });

  it('거래 구분에 따라 라벨이 바뀐다', () => {
    const { onChangeTradeType } = renderView();
    expect(screen.getByText('구매 완료')).toBeDefined();

    fireEvent.click(screen.getByText('판매 내역'));
    expect(onChangeTradeType).toHaveBeenCalledWith('sell');
  });

  it('판매 모드에서는 판매 완료로 표기한다', () => {
    renderView({ tradeType: 'sell' });
    expect(screen.getByText('판매 완료')).toBeDefined();
  });

  it('내역이 없으면 안내를 보여준다', () => {
    renderView({ trades: [] });
    expect(screen.getByText(/구매 내역이 없습니다/)).toBeDefined();
  });

  it('에러가 있으면 목록 대신 에러를 보여준다', () => {
    renderView({ error: '거래 내역을 불러오지 못했습니다.' });

    expect(screen.getByText('거래 내역을 불러오지 못했습니다.')).toBeDefined();
    expect(screen.queryByText('폴 스콜스')).toBeNull();
  });

  it('로딩 중에는 목록을 그리지 않는다', () => {
    renderView({ loading: true });
    expect(screen.queryByText('폴 스콜스')).toBeNull();
  });
});
