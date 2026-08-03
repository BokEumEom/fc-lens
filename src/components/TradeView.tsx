import React from 'react';
import type { TradeRecord } from '../lib/api/types';
import type { TradeType } from '../hooks/useOwnerData';

const BP_PER_EOK = 100_000_000;
const FALLBACK_PLAYER_IMAGE =
  'https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102143.png';

interface TradeViewProps {
  trades: TradeRecord[];
  tradeType: TradeType;
  onChangeTradeType: (tradeType: TradeType) => void;
  loading: boolean;
  error: string | null;
  ownerNickname: string;
}

function formatTradeDate(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatBp(value: number): string {
  return `${(value / BP_PER_EOK).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억 BP`;
}

const TRADE_TABS: { key: TradeType; label: string; icon: string }[] = [
  { key: 'buy', label: '구매 내역', icon: 'shopping_cart' },
  { key: 'sell', label: '판매 내역', icon: 'sell' },
];

export const TradeView: React.FC<TradeViewProps> = ({
  trades,
  tradeType,
  onChangeTradeType,
  loading,
  error,
  ownerNickname,
}) => {
  const isBuy = tradeType === 'buy';

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#161A1E] p-4 rounded-2xl border border-[#2D333B]">
        <div>
          <h2 className="text-sm font-bold text-white font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-[#B9F600] text-lg">receipt_long</span>
            이적시장 거래 내역
          </h2>
          <p className="text-[11px] text-[#8A99AD] mt-0.5 font-data">
            {ownerNickname} · 최근 20건
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0B0E11] p-1 rounded-xl border border-[#2D333B]">
          {TRADE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChangeTradeType(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-data text-xs font-bold transition-all active:scale-95 ${
                tradeType === tab.key
                  ? 'bg-[#B9F600] text-[#141F00]'
                  : 'text-[#C3CAAC] hover:text-white hover:bg-[#232B34]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[76px] bg-[#161A1E] border border-[#2D333B] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#FF4B4B]/10 border border-[#FF4B4B]/40 rounded-2xl p-4 text-xs text-[#FF4B4B] font-data">
          {error}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-[#2D333B] text-4xl">receipt_long</span>
          <p className="text-xs text-[#8A99AD] mt-2 font-data">
            {isBuy ? '구매' : '판매'} 내역이 없습니다.
          </p>
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <div className="space-y-2">
          {trades.map((item) => (
            <div
              key={item.saleSn}
              className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-3.5 flex items-center justify-between hover:border-[#B9F600]/40 transition-all font-data"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-[#232B34] border border-[#2D333B]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_PLAYER_IMAGE;
                    }}
                  />
                  {item.grade > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-[#182029] text-[#B9F600] border border-[#B9F600]/60 text-[9px] font-bold px-1 rounded">
                      +{item.grade}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    {item.season && (
                      <span className="bg-[#232B34] text-[#B9F600] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#2D333B]">
                        {item.season}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8A99AD] mt-0.5">
                    {formatTradeDate(item.tradeDate)}
                  </p>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    isBuy
                      ? 'bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30'
                      : 'bg-[#FF4B4B]/15 text-[#FF4B4B] border border-[#FF4B4B]/30'
                  }`}
                >
                  {isBuy ? '구매 완료' : '판매 완료'}
                </span>
                <p className="text-xs font-bold text-white">{formatBp(item.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
