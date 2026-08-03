import React, { useState } from 'react';
import { TabType } from './types';
import { useApiKey } from './hooks/useApiKey';
import { useOwnerData } from './hooks/useOwnerData';
import { useToast } from './hooks/useToast';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/common/Toast';
import { ApiKeyModal } from './components/common/ApiKeyModal';
import { OwnerView } from './components/OwnerView';
import { MatchView } from './components/MatchView';
import { TradeView } from './components/TradeView';
import { MetaView } from './components/MetaView';

const TAB_SUBTITLES: Record<TabType, string> = {
  owner: 'OWNER ANALYSIS',
  match: 'MATCH DETAIL',
  trade: 'TRANSFER HISTORY',
  ranker: 'RANKER BENCHMARK',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('owner');

  const apiKey = useApiKey();
  const toast = useToast();
  // 저장된 키가 바뀌면 구단주 데이터를 다시 조회한다.
  const owner = useOwnerData(apiKey.savedKey);

  const navigateTab = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMatchDetail = (matchId: string) => {
    owner.selectMatch(matchId);
    navigateTab('match');
  };

  const copyOuid = async (ouid: string) => {
    try {
      await navigator.clipboard.writeText(ouid);
      toast.show('OUID를 복사했습니다.');
    } catch {
      toast.show('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#DBE3F0] font-sans antialiased max-w-md mx-auto sm:max-w-xl md:max-w-4xl relative border-x border-[#2D333B]/40 shadow-2xl">
      <TopHeader title="FC LENS" subtitle={TAB_SUBTITLES[activeTab]} />
      <Toast message={toast.message} />

      <main className="min-h-[calc(100vh-120px)] pb-28 sm:pb-24 pt-2 px-4 space-y-5">
        <div className="flex justify-between items-center gap-3">
          <span className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest font-bold">
            OFFICIAL NEXON OPEN API
          </span>
          <button
            onClick={apiKey.openModal}
            className={`px-3 py-1.5 rounded-xl border font-data text-xs flex items-center gap-1.5 transition-all ${
              apiKey.savedKey
                ? 'bg-[#B9F600]/15 border-[#B9F600] text-[#B9F600] font-bold shadow-[0_0_10px_rgba(185,246,0,0.2)]'
                : 'bg-[#161A1E] border-[#2D333B] text-[#C3CAAC] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>{apiKey.savedKey ? '내 API 키 사용 중' : 'API 키 설정'}</span>
          </button>
        </div>

        {activeTab === 'owner' && (
          <OwnerView owner={owner} onOpenMatchDetail={openMatchDetail} onCopyOuid={copyOuid} />
        )}

        {activeTab === 'match' && (
          <MatchView
            matches={owner.matches}
            selectedMatchId={owner.selectedMatchId}
            onSelectMatch={owner.selectMatch}
            matchDetail={owner.matchDetail}
            myTeam={owner.myTeam}
            loading={owner.matchDetailLoading}
            error={owner.matchDetailError}
            ownerNickname={owner.nickname}
          />
        )}

        {activeTab === 'trade' && (
          <TradeView
            trades={owner.trades}
            tradeType={owner.tradeType}
            onChangeTradeType={owner.setTradeType}
            loading={owner.tradesLoading}
            error={owner.tradesError}
            ownerNickname={owner.nickname}
          />
        )}

        {activeTab === 'ranker' && (
          <MetaView
            matchDetail={owner.matchDetail}
            myTeam={owner.myTeam}
            matchType={owner.matchType}
            matchLoading={owner.matchDetailLoading}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={navigateTab} />
      <ApiKeyModal apiKey={apiKey} />
    </div>
  );
}
