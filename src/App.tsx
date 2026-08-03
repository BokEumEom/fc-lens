import React, { useState } from 'react';
import { TabType } from './types';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { NexonUserView, NexonTab } from './components/NexonUserView';

/** 하단 탭 → NexonUserView 내부 섹션 */
const TAB_TO_SECTION: Record<TabType, NexonTab> = {
  owner: 'account',
  match: 'match',
  trade: 'trade',
  ranker: 'ranker',
};

/** NexonUserView 내부 이동 → 하단 탭 (역방향) */
const SECTION_TO_TAB: Record<NexonTab, TabType> = {
  account: 'owner',
  match: 'match',
  trade: 'trade',
  ranker: 'ranker',
};

const TAB_SUBTITLES: Record<TabType, string> = {
  owner: 'OWNER ANALYSIS',
  match: 'MATCH DETAIL',
  trade: 'TRANSFER HISTORY',
  ranker: 'META RANKINGS',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('owner');

  const navigateTab = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#DBE3F0] font-sans antialiased max-w-md mx-auto sm:max-w-xl md:max-w-4xl relative border-x border-[#2D333B]/40 shadow-2xl">
      <TopHeader title="FC LENS" subtitle={TAB_SUBTITLES[activeTab]} />

      {/*
        NexonUserView는 탭을 바꿔도 언마운트하지 않는다.
        재마운트하면 조회한 구단주/매치/이적 데이터가 초기화되고 API를 다시 호출하게 된다.
        (Phase 3c에서 OwnerView/MatchView/TradeView로 분리하고 상태를 App으로 끌어올린 뒤
         화면 전환 애니메이션을 복원한다.)
      */}
      <main className="min-h-[calc(100vh-120px)] pb-28 sm:pb-24">
        <NexonUserView
          activeSubTab={TAB_TO_SECTION[activeTab]}
          onChangeSubTab={(section) => navigateTab(SECTION_TO_TAB[section])}
        />
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={navigateTab} />
    </div>
  );
}
