import React, { useState } from 'react';
import { Player } from '../types';
import { POPULAR_SEASONS, formatBP } from '../data/mockData';

interface HomeViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onNavigateTab: (tab: 'search' | 'squad' | 'ranker' | 'nexon') => void;
  onFilterSeason: (seasonId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  players,
  onSelectPlayer,
  onNavigateTab,
  onFilterSeason,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = searchTerm.trim()
    ? players.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const trendingPlayers = players.slice(0, 4); // top 4 trending

  return (
    <div className="pb-24 pt-2 space-y-6">
      {/* Hero Search Section */}
      <section className="relative px-4 pt-4 pb-2">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">
            Find Your Edge
          </h1>
          <p className="text-xs text-[#C3CAAC]">Analyze 45,000+ players and managers</p>
        </div>

        {/* Search Bar & Auto-suggestions */}
        <div className="relative z-30 mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C3CAAC]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search Player, Squad Analysis..."
              className="w-full bg-[#232B34] border border-[#2D333B] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600] focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C3CAAC] hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Autocomplete Popup */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#161A1E] border border-[#2D333B] rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-[#2D333B]/50 max-h-64 overflow-y-auto no-scrollbar">
              {searchResults.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    onSelectPlayer(player);
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#232B34] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#2D333B]"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">{player.name}</div>
                      <div className="text-[11px] text-[#C3CAAC]">
                        {player.position} • {player.season} • {player.club}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#B9F600]">{player.ovr} OVR</div>
                    <div className="text-[10px] text-[#DBE3F0] font-data">
                      {formatBP(player.bpPrice)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Category Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onNavigateTab('search')}
            className="bg-[#B9F600] text-[#263500] font-data text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-sm hover:brightness-105 active:scale-95 transition-all"
          >
            Player Search
          </button>
          <button
            onClick={() => onNavigateTab('squad')}
            className="bg-[#232B34] border border-[#2D333B] text-white font-data text-xs px-4 py-2 rounded-full whitespace-nowrap hover:bg-[#2e353f] transition-all"
          >
            Squad Analysis
          </button>
          <button
            onClick={() => onNavigateTab('nexon')}
            className="bg-[#232B34] border border-[#B9F600]/40 text-[#B9F600] font-data text-xs px-4 py-2 rounded-full whitespace-nowrap hover:bg-[#2e353f] transition-all flex items-center gap-1 font-bold"
          >
            <span className="material-symbols-outlined text-[14px]">sports_esports</span>
            NEXON Open API
          </button>
          <button
            onClick={() => onNavigateTab('ranker')}
            className="bg-[#232B34] border border-[#2D333B] text-white font-data text-xs px-4 py-2 rounded-full whitespace-nowrap hover:bg-[#2e353f] transition-all"
          >
            Manager Search
          </button>
        </div>
      </section>

      {/* Meta Trend Summary Card */}
      <section className="px-4">
        <div className="bg-[#161A1E] border border-[#2D333B] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest block mb-0.5">
                LIVE META TREND
              </span>
              <h2 className="text-lg font-bold text-white">4-2-3-1 Offensive</h2>
            </div>
            <div className="bg-[#00FF87]/10 text-[#00FF87] px-2 py-1 rounded flex items-center gap-1 font-data text-xs">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>58.4%</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#C3CAAC]">Avg. Win Rate</span>
                <span className="font-data text-white font-semibold">56%</span>
              </div>
              <div className="w-full h-2 bg-[#2E353F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B9F600] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(185,246,0,0.5)]"
                  style={{ width: '56%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#C3CAAC]">Usage Intensity</span>
                <span className="font-data text-white font-semibold">72%</span>
              </div>
              <div className="w-full h-2 bg-[#2E353F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#014BAD] rounded-full transition-all duration-500"
                  style={{ width: '72%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Seasons Carousel */}
      <section>
        <div className="px-4 flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-white">Popular Seasons</h2>
          <button
            onClick={() => onNavigateTab('search')}
            className="font-data text-xs text-[#B9F600] font-semibold hover:underline"
          >
            VIEW ALL
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar pb-1">
          {POPULAR_SEASONS.map((season) => (
            <div
              key={season.id}
              onClick={() => {
                onFilterSeason(season.id);
                onNavigateTab('search');
              }}
              className="flex-shrink-0 w-32 group cursor-pointer"
            >
              <div className="aspect-square bg-[#232B34] rounded-xl overflow-hidden border border-[#2D333B] relative transition-transform group-hover:scale-105">
                <img
                  src={season.img}
                  alt={season.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-2 left-2">
                  <span className="text-xl font-black text-white italic tracking-tighter">
                    {season.tag}
                  </span>
                </div>
              </div>
              <p className="font-data text-[11px] text-center mt-2 text-[#C3CAAC] group-hover:text-[#B9F600] transition-colors truncate">
                {season.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Players */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-white">Trending Players</h2>
          <div className="flex gap-1.5">
            <button
              onClick={() => onNavigateTab('search')}
              className="p-1.5 text-[#C3CAAC] bg-[#182029] hover:text-white rounded border border-[#2D333B]"
              aria-label="Sort options"
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
            </button>
            <button
              onClick={() => onNavigateTab('search')}
              className="p-1.5 text-[#C3CAAC] bg-[#182029] hover:text-white rounded border border-[#2D333B]"
              aria-label="Filter list"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {trendingPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="bg-[#161A1E] border border-[#2D333B] rounded-xl p-3 flex items-center justify-between hover:border-[#B9F600]/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#2D333B] group-hover:border-[#B9F600] transition-colors bg-[#232B34] flex-shrink-0">
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#2E353F] px-1 rounded border border-[#2D333B]">
                    <span className="font-data text-[9px] font-bold text-white">
                      {player.season}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm text-white group-hover:text-[#B9F600] transition-colors">
                    {player.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-data text-[11px] text-[#C3CAAC]">
                      {player.position}
                    </span>
                    <span className="text-[#C3CAAC] opacity-30">•</span>
                    <span className="font-data text-[11px] text-[#B9F600]">
                      OVR {player.ovr}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-data text-xs font-semibold text-white">
                  {formatBP(player.bpPrice)}
                </p>
                <p
                  className={`font-data text-[11px] font-bold mt-0.5 ${
                    player.priceTrendPercent >= 0 ? 'text-[#00FF87]' : 'text-[#FF4B4B]'
                  }`}
                >
                  {player.priceTrendPercent >= 0 ? '▲' : '▼'}{' '}
                  {Math.abs(player.priceTrendPercent)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <button
        onClick={() => onNavigateTab('squad')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-[#B9F600] text-[#263500] rounded-full shadow-lg shadow-[#B9F600]/20 flex items-center justify-center z-30 transition-transform active:scale-90 hover:scale-105"
        aria-label="Build Squad"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>

      {/* Footer Branding */}
      <footer className="bg-[#070F17] border-t border-[#2D333B] px-4 py-8 mt-8">
        <div className="mb-4">
          <span className="text-base font-bold text-white">FC LENS</span>
          <p className="text-xs text-[#C3CAAC] mt-1">
            Professional Grade Sports Analytics for FC Online.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-[#C3CAAC] mb-6">
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">Data Methodology</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Brand Info</a></li>
          </ul>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
        <p className="font-data text-[10px] text-[#C3CAAC]/50">
          © 2026 FC Lens. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
