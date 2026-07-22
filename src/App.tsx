import React, { useState } from 'react';
import { Player, TabType } from './types';
import { PLAYERS } from './data/mockData';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { PlayerSearchView } from './components/PlayerSearchView';
import { PlayerDetailView } from './components/PlayerDetailView';
import { SquadAnalysisView } from './components/SquadAnalysisView';
import { RankerView } from './components/RankerView';
import { NexonUserView } from './components/NexonUserView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>('');

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    if (activeTab !== 'detail') {
      setPreviousTab(activeTab);
    }
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setActiveTab(previousTab);
    setSelectedPlayer(null);
  };

  const handleNavigateTab = (tab: 'search' | 'squad' | 'ranker' | 'nexon') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterSeason = (seasonId: string) => {
    setSeasonFilter(seasonId);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'ANALYTICAL EDGE';
      case 'search':
        return 'PLAYER SEARCH';
      case 'squad':
        return 'SQUAD ANALYSIS';
      case 'ranker':
        return 'META RANKINGS';
      case 'nexon':
        return 'NEXON OPEN API';
      case 'detail':
        return 'PLAYER PROFILE';
      default:
        return 'FC ONLINE';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#DBE3F0] font-sans antialiased max-w-md mx-auto sm:max-w-xl md:max-w-4xl relative border-x border-[#2D333B]/40 shadow-2xl">
      {/* Top Navigation Header */}
      <TopHeader
        title="FC LENS"
        subtitle={getSubTitle()}
        players={PLAYERS}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-120px)] pb-28 sm:pb-24">
        {activeTab === 'home' && (
          <HomeView
            players={PLAYERS}
            onSelectPlayer={handleSelectPlayer}
            onNavigateTab={handleNavigateTab}
            onFilterSeason={handleFilterSeason}
          />
        )}

        {activeTab === 'search' && (
          <PlayerSearchView
            players={PLAYERS}
            onSelectPlayer={handleSelectPlayer}
            initialSeason={seasonFilter}
          />
        )}

        {activeTab === 'squad' && (
          <SquadAnalysisView
            allPlayers={PLAYERS}
            onSelectPlayerDetail={handleSelectPlayer}
          />
        )}

        {activeTab === 'ranker' && (
          <RankerView
            players={PLAYERS}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {activeTab === 'nexon' && <NexonUserView />}

        {activeTab === 'detail' && selectedPlayer && (
          <PlayerDetailView
            player={selectedPlayer}
            allPlayers={PLAYERS}
            onBack={handleBackFromDetail}
            onSelectPlayer={handleSelectPlayer}
          />
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <BottomNav
        activeTab={activeTab === 'detail' ? previousTab : activeTab}
        setActiveTab={(tab) => {
          setSeasonFilter('');
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
