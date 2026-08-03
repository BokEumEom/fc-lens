import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabType } from './types';
import { useOwnerData } from './hooks/useOwnerData';
import { useToast } from './hooks/useToast';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/common/Toast';
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

  const toast = useToast();
  const owner = useOwnerData();

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
        <span className="block font-data text-[10px] text-[#B9F600] uppercase tracking-widest font-bold">
          OFFICIAL NEXON OPEN API
        </span>

        {/*
          탭 전환 애니메이션. 데이터는 App의 훅(useOwnerData)이 소유하므로
          뷰가 재마운트돼도 조회 결과는 유지된다.
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
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
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={navigateTab} />
    </div>
  );
}
