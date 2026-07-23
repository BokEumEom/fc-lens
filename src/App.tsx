import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Player, TabType } from './types';
import { PLAYERS } from './data/mockData';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { PlayerSearchView } from './components/PlayerSearchView';
import { PlayerDetailView } from './components/PlayerDetailView';
import { SquadAnalysisView } from './components/SquadAnalysisView';
import { RankerView } from './components/RankerView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>('');

  // Favorites state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fclens_favorite_players');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (playerId: string) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId];
      try {
        localStorage.setItem('fclens_favorite_players', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }
      return updated;
    });
  };

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

  const handleNavigateTab = (tab: 'search' | 'squad' | 'ranker') => {
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeTab === 'home' && (
              <HomeView
                players={PLAYERS}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectPlayer={handleSelectPlayer}
                onNavigateTab={handleNavigateTab}
                onFilterSeason={handleFilterSeason}
              />
            )}

            {activeTab === 'search' && (
              <PlayerSearchView
                players={PLAYERS}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
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

            {activeTab === 'detail' && selectedPlayer && (
              <PlayerDetailView
                player={selectedPlayer}
                allPlayers={PLAYERS}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onBack={handleBackFromDetail}
                onSelectPlayer={handleSelectPlayer}
              />
            )}
          </motion.div>
        </AnimatePresence>
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
