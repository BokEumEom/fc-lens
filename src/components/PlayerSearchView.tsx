import React, { useState, useMemo } from 'react';
import { Player, FilterOptions } from '../types';
import { formatBP } from '../data/mockData';

interface PlayerSearchViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  initialSeason?: string;
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({
  players,
  onSelectPlayer,
  initialSeason = '',
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const [filters, setFilters] = useState<FilterOptions>({
    searchKeyword: '',
    position: 'ALL',
    season: initialSeason || 'ALL',
    maxSalary: 30,
    minOvr: 100,
    sortOption: 'popularity',
  });

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (filters.searchKeyword.trim()) {
      const q = filters.searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.season.toLowerCase().includes(q)
      );
    }

    if (filters.position !== 'ALL') {
      result = result.filter(
        (p) =>
          p.position === filters.position ||
          p.preferredPositions.includes(filters.position)
      );
    }

    if (filters.season !== 'ALL') {
      result = result.filter((p) => p.season === filters.season);
    }

    if (filters.maxSalary < 30) {
      result = result.filter((p) => p.salary <= filters.maxSalary);
    }

    if (filters.minOvr > 100) {
      result = result.filter((p) => p.ovr >= filters.minOvr);
    }

    // Sort
    if (filters.sortOption === 'price_desc') {
      result.sort((a, b) => b.bpPrice - a.bpPrice);
    } else if (filters.sortOption === 'price_asc') {
      result.sort((a, b) => a.bpPrice - b.bpPrice);
    } else if (filters.sortOption === 'ovr_desc') {
      result.sort((a, b) => b.ovr - a.ovr);
    }

    return result;
  }, [players, filters]);

  const displayedPlayers = filteredPlayers.slice(0, visibleCount);

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C3CAAC]">
          search
        </span>
        <input
          type="text"
          value={filters.searchKeyword}
          onChange={(e) => setFilters({ ...filters, searchKeyword: e.target.value })}
          placeholder="Search by player name, club or season..."
          className="w-full bg-[#232B34] border border-[#2D333B] rounded-xl py-2.5 pl-11 pr-4 text-white text-sm placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
        />
      </div>

      {/* Quick Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
        <button
          onClick={() => setShowFilterModal(true)}
          className="bg-[#B9F600] text-[#141F00] px-3.5 py-1.5 rounded-full font-data text-xs font-bold flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Filters
        </button>

        <div className="h-4 w-[1px] bg-[#2D333B] mx-0.5"></div>

        {['ALL', 'ST', 'LW', 'CAM', 'CM', 'CB', 'GK'].map((pos) => (
          <button
            key={pos}
            onClick={() => setFilters({ ...filters, position: pos })}
            className={`px-3 py-1.5 rounded-full font-data text-xs flex-shrink-0 border transition-all ${
              filters.position === pos
                ? 'bg-[#B9F600]/20 text-[#B9F600] border-[#B9F600]/60'
                : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-white'
            }`}
          >
            Position: {pos}
          </button>
        ))}

        {['ALL', '24TY', 'ICON', 'LN', 'UTOTY', '23HW'].map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ ...filters, season: s })}
            className={`px-3 py-1.5 rounded-full font-data text-xs flex-shrink-0 border transition-all ${
              filters.season === s
                ? 'bg-[#B9F600]/20 text-[#B9F600] border-[#B9F600]/60'
                : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-white'
            }`}
          >
            Season: {s}
          </button>
        ))}
      </div>

      {/* Results Header & Sort Selector */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-base font-bold text-white">Results Found</h2>
          <p className="font-data text-xs text-[#C3CAAC]">
            {filteredPlayers.length} available players
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#141C25] px-2.5 py-1.5 rounded-lg border border-[#2D333B]">
          <span className="font-data text-xs text-[#C3CAAC]">Sort:</span>
          <select
            value={filters.sortOption}
            onChange={(e) =>
              setFilters({ ...filters, sortOption: e.target.value as FilterOptions['sortOption'] })
            }
            className="bg-transparent text-xs font-data text-white font-semibold focus:outline-none cursor-pointer"
          >
            <option value="popularity" className="bg-[#182029]">Popularity</option>
            <option value="price_desc" className="bg-[#182029]">Price: High to Low</option>
            <option value="price_asc" className="bg-[#182029]">Price: Low to High</option>
            <option value="ovr_desc" className="bg-[#182029]">OVR: High to Low</option>
          </select>
        </div>
      </div>

      {/* Player Cards List */}
      <div className="space-y-3">
        {displayedPlayers.map((player) => (
          <div
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className="glass-card rounded-xl p-3.5 flex items-center gap-3.5 group hover:border-[#B9F600]/50 transition-all cursor-pointer"
          >
            <div className="relative w-16 h-16 flex-shrink-0">
              <img
                src={player.image}
                alt={player.name}
                className="w-full h-full object-cover rounded-full border-2 border-[#2D333B] group-hover:border-[#B9F600] transition-colors bg-[#232B34]"
              />
              <div className="absolute -top-1 -right-1 bg-[#B9F600] text-[#141F00] px-1.5 py-0.5 rounded font-data text-[9px] font-bold z-10 shadow-sm">
                {player.season}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="truncate pr-2">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#B9F600] transition-colors">
                    {player.name}
                  </h3>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="bg-[#2E353F] px-2 py-0.5 rounded font-data text-[10px] text-white uppercase font-bold">
                      {player.position}
                    </span>
                    <span className="font-data text-xs text-[#C3CAAC]">
                      Salary: <span className="text-white font-bold">{player.salary}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-black text-white leading-none font-headline">
                    {player.ovr}
                  </span>
                  <div className="text-[9px] font-data text-[#C3CAAC] uppercase tracking-wider">
                    OVR
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-end border-t border-[#2D333B] pt-2">
                <div className="flex flex-col">
                  <span className="font-data text-[9px] text-[#C3CAAC] uppercase">CURRENT PRICE</span>
                  <span className="font-data text-xs font-bold text-white">
                    {formatBP(player.bpPrice)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-0.5 font-data text-[11px] font-bold ${
                    player.priceTrendPercent >= 0 ? 'text-[#00FF87]' : 'text-[#FF4B4B]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {player.priceTrendPercent >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  <span>
                    {player.priceTrendPercent >= 0 ? '+' : ''}
                    {player.priceTrendPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-[#C3CAAC]">
            <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
            <p className="text-sm">No players found matching your criteria.</p>
            <button
              onClick={() =>
                setFilters({
                  searchKeyword: '',
                  position: 'ALL',
                  season: 'ALL',
                  maxSalary: 30,
                  minOvr: 100,
                  sortOption: 'popularity',
                })
              }
              className="mt-3 text-xs text-[#B9F600] font-data underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredPlayers.length && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 6)}
          className="w-full mt-4 py-3 bg-[#232B34] border border-[#2D333B] rounded-xl font-data text-xs font-bold text-[#B9F600] hover:bg-[#2e353f] transition-colors flex items-center justify-center gap-2"
        >
          Load More Results ({filteredPlayers.length - visibleCount} remaining)
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </button>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#161A1E] border border-[#2D333B] w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
              <h3 className="text-base font-bold text-white">Filter Players</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-[#C3CAAC] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Position Selector */}
            <div>
              <label className="text-xs font-data text-[#C3CAAC] uppercase block mb-2">
                Position
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['ALL', 'ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'].map(
                  (pos) => (
                    <button
                      key={pos}
                      onClick={() => setFilters({ ...filters, position: pos })}
                      className={`py-2 rounded-lg font-data text-xs font-semibold border ${
                        filters.position === pos
                          ? 'bg-[#B9F600] text-[#141F00] border-[#B9F600]'
                          : 'bg-[#232B34] text-white border-[#2D333B]'
                      }`}
                    >
                      {pos}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Season Selector */}
            <div>
              <label className="text-xs font-data text-[#C3CAAC] uppercase block mb-2">
                Season
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['ALL', '24TY', 'ICON', 'LN', 'UTOTY', '23HW', '21TY', '22TY'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilters({ ...filters, season: s })}
                    className={`py-2 rounded-lg font-data text-xs font-semibold border ${
                      filters.season === s
                        ? 'bg-[#B9F600] text-[#141F00] border-[#B9F600]'
                        : 'bg-[#232B34] text-white border-[#2D333B]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Salary Slider */}
            <div>
              <div className="flex justify-between text-xs font-data mb-1">
                <span className="text-[#C3CAAC]">Max Salary</span>
                <span className="text-[#B9F600] font-bold">{filters.maxSalary}</span>
              </div>
              <input
                type="range"
                min="15"
                max="30"
                value={filters.maxSalary}
                onChange={(e) => setFilters({ ...filters, maxSalary: Number(e.target.value) })}
                className="w-full accent-[#B9F600]"
              />
            </div>

            {/* Min OVR Slider */}
            <div>
              <div className="flex justify-between text-xs font-data mb-1">
                <span className="text-[#C3CAAC]">Min OVR</span>
                <span className="text-[#B9F600] font-bold">{filters.minOvr}</span>
              </div>
              <input
                type="range"
                min="100"
                max="120"
                value={filters.minOvr}
                onChange={(e) => setFilters({ ...filters, minOvr: Number(e.target.value) })}
                className="w-full accent-[#B9F600]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setFilters({
                    searchKeyword: '',
                    position: 'ALL',
                    season: 'ALL',
                    maxSalary: 30,
                    minOvr: 100,
                    sortOption: 'popularity',
                  })
                }
                className="w-1/3 py-2.5 bg-[#232B34] border border-[#2D333B] text-white rounded-xl text-xs font-data font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-2/3 py-2.5 bg-[#B9F600] text-[#141F00] rounded-xl text-xs font-data font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
