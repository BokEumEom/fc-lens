import React, { useState, useMemo } from 'react';
import { Player, FilterOptions } from '../types';
import { formatBP } from '../data/mockData';

interface PlayerSearchViewProps {
  players: Player[];
  favoriteIds: string[];
  onToggleFavorite: (playerId: string) => void;
  onSelectPlayer: (player: Player) => void;
  initialSeason?: string;
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({
  players,
  favoriteIds,
  onToggleFavorite,
  onSelectPlayer,
  initialSeason = '',
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Comparison basket
  const [compareList, setCompareList] = useState<Player[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const toggleCompare = (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    if (compareList.some((p) => p.id === player.id)) {
      setCompareList(compareList.filter((p) => p.id !== player.id));
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], player]);
      } else {
        setCompareList([...compareList, player]);
      }
    }
  };

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

    if (onlyFavorites) {
      result = result.filter((p) => favoriteIds.includes(p.id));
    }

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
  }, [players, filters, onlyFavorites, favoriteIds]);

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

        <button
          onClick={() => setOnlyFavorites(!onlyFavorites)}
          className={`px-3.5 py-1.5 rounded-full font-data text-xs font-bold flex items-center gap-1.5 flex-shrink-0 border transition-all ${
            onlyFavorites
              ? 'bg-[#FFD700]/25 text-[#FFD700] border-[#FFD700]/80 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
              : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-[#FFD700]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: onlyFavorites ? "'FILL' 1" : "'FILL' 0" }}>
            star
          </span>
          ★ 즐겨찾기 ({favoriteIds.length})
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
        {displayedPlayers.map((player) => {
          const isComparing = compareList.some((p) => p.id === player.id);
          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`glass-card rounded-xl p-3.5 flex items-center gap-3.5 group hover:border-[#B9F600]/50 transition-all cursor-pointer relative ${
                isComparing ? 'border-[#38BDF8] bg-[#38BDF8]/5 shadow-[0_0_12px_rgba(56,189,248,0.2)]' : ''
              }`}
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

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(player.id);
                      }}
                      className={`p-1 rounded-lg transition-all ${
                        favoriteIds.includes(player.id)
                          ? 'text-[#FFD700] bg-[#FFD700]/15 border border-[#FFD700]/50'
                          : 'text-[#8A99AD] hover:text-[#FFD700] bg-[#232B34] border border-[#2D333B]'
                      }`}
                      title={favoriteIds.includes(player.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: favoriteIds.includes(player.id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>

                    <button
                      onClick={(e) => toggleCompare(e, player)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold font-data flex items-center gap-1 transition-all ${
                        isComparing
                          ? 'bg-[#38BDF8] text-[#032838]'
                          : 'bg-[#232B34] text-[#38BDF8] border border-[#38BDF8]/40 hover:bg-[#38BDF8]/20'
                      }`}
                      title="비교 목록에 추가"
                    >
                      <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
                      <span>{isComparing ? '선택됨' : '비교'}</span>
                    </button>

                    <div className="text-right ml-1">
                      <span className="text-2xl font-black text-white leading-none font-headline">
                        {player.ovr}
                      </span>
                      <div className="text-[9px] font-data text-[#C3CAAC] uppercase tracking-wider">
                        OVR
                      </div>
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
          );
        })}

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

      {/* Floating Comparison Tray */}
      {compareList.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto bg-[#182029]/95 border border-[#38BDF8]/60 backdrop-blur-xl rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined text-[#38BDF8] text-xl flex-shrink-0">
              compare_arrows
            </span>
            <div className="flex items-center gap-2">
              {compareList.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-1 bg-[#232B34] px-2 py-1 rounded-lg border border-[#2D333B]">
                  <img src={p.image} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs font-bold text-white max-w-[70px] truncate">{p.name}</span>
                  <button
                    onClick={(e) => toggleCompare(e, p)}
                    className="text-zinc-400 hover:text-white ml-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
              {compareList.length < 2 && (
                <span className="text-[11px] text-[#C3CAAC] animate-pulse">
                  +1명 더 선택하세요
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-[#C3CAAC] hover:text-white px-1"
            >
              초기화
            </button>
            <button
              disabled={compareList.length < 2}
              onClick={() => {
                if (compareList.length === 2) {
                  setShowCompareModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-data transition-all flex items-center gap-1 ${
                compareList.length === 2
                  ? 'bg-[#38BDF8] text-[#032838] shadow-[0_0_12px_rgba(56,189,248,0.4)] active:scale-95'
                  : 'bg-[#232B34] text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>VS 비교보기</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Player Comparison Modal */}
      {showCompareModal && compareList.length === 2 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#12161C] border border-[#38BDF8]/60 w-full max-w-md rounded-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(56,189,248,0.2)]">
            <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38BDF8]">compare_arrows</span>
                <h3 className="text-base font-bold text-white font-headline">선수 Stats Side-by-Side 비교</h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-[#C3CAAC] hover:text-white p-1 rounded-lg bg-[#232B34]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Players VS Cards */}
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Player 1 */}
              <div className="col-span-5 bg-[#182029] border border-[#B9F600] rounded-xl p-2.5 text-center space-y-1">
                <img
                  src={compareList[0].image}
                  alt={compareList[0].name}
                  className="w-12 h-12 rounded-full object-cover mx-auto border border-[#B9F600] bg-[#232B34]"
                />
                <span className="bg-[#B9F600] text-[#141F00] px-1.5 py-0.5 rounded text-[9px] font-bold">
                  {compareList[0].season}
                </span>
                <h4 className="text-xs font-bold text-white truncate">{compareList[0].name}</h4>
                <p className="text-[10px] text-[#B9F600] font-black">OVR {compareList[0].ovr}</p>
              </div>

              <div className="col-span-2 text-center font-black text-sm text-[#38BDF8]">VS</div>

              {/* Player 2 */}
              <div className="col-span-5 bg-[#182029] border border-[#38BDF8] rounded-xl p-2.5 text-center space-y-1">
                <img
                  src={compareList[1].image}
                  alt={compareList[1].name}
                  className="w-12 h-12 rounded-full object-cover mx-auto border border-[#38BDF8] bg-[#232B34]"
                />
                <span className="bg-[#38BDF8] text-[#032838] px-1.5 py-0.5 rounded text-[9px] font-bold">
                  {compareList[1].season}
                </span>
                <h4 className="text-xs font-bold text-white truncate">{compareList[1].name}</h4>
                <p className="text-[10px] text-[#38BDF8] font-black">OVR {compareList[1].ovr}</p>
              </div>
            </div>

            {/* Detailed Stats Comparison Table */}
            <div className="glass-card rounded-xl overflow-hidden border border-[#2D333B] font-data text-xs">
              <div className="bg-[#232B34] p-2 text-center font-bold text-white uppercase text-[10px] tracking-wider">
                능력치 상세 비교표
              </div>
              <div className="divide-y divide-[#2D333B]">
                {[
                  { label: 'OVR 종합', p1: compareList[0].ovr, p2: compareList[1].ovr },
                  { label: 'PAC (스피드)', p1: compareList[0].pac, p2: compareList[1].pac },
                  { label: 'SHO (슈팅)', p1: compareList[0].sho, p2: compareList[1].sho },
                  { label: 'PAS (패스)', p1: compareList[0].pas, p2: compareList[1].pas },
                  { label: 'DRI (드리블)', p1: compareList[0].dri, p2: compareList[1].dri },
                  { label: 'DEF (수비)', p1: compareList[0].def, p2: compareList[1].def },
                  { label: 'PHY (피지컬)', p1: compareList[0].phy, p2: compareList[1].phy },
                  { label: 'Weak Foot (약발)', p1: compareList[0].weakFoot, p2: compareList[1].weakFoot },
                  { label: 'Skill Moves (개인기)', p1: compareList[0].skillMoves, p2: compareList[1].skillMoves },
                  { label: '급여 (Salary)', p1: compareList[0].salary, p2: compareList[1].salary },
                  { label: '시세 (BP)', p1: formatBP(compareList[0].bpPrice), p2: formatBP(compareList[1].bpPrice), rawP1: compareList[0].bpPrice, rawP2: compareList[1].bpPrice },
                ].map((row, idx) => {
                  const val1 = typeof row.p1 === 'number' ? row.p1 : row.rawP1 || 0;
                  const val2 = typeof row.p2 === 'number' ? row.p2 : row.rawP2 || 0;
                  const p1Wins = val1 > val2;
                  const p2Wins = val2 > val1;

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 p-2.5 items-center transition-all ${
                        p1Wins
                          ? 'bg-gradient-to-r from-[#B9F600]/10 via-transparent to-transparent'
                          : p2Wins
                          ? 'bg-gradient-to-l from-[#38BDF8]/10 via-transparent to-transparent'
                          : 'hover:bg-[#232B34]/40'
                      }`}
                    >
                      <div className="col-span-4 text-left">
                        {p1Wins ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#B9F600]/20 text-[#B9F600] border border-[#B9F600]/60 rounded-lg shadow-[0_0_12px_rgba(185,246,0,0.25)] font-black text-xs">
                            <span>{row.p1}</span>
                            {typeof row.p1 === 'number' && typeof row.p2 === 'number' && (
                              <span className="text-[9px] bg-[#B9F600]/30 text-[#B9F600] px-1 rounded font-bold">
                                +{row.p1 - row.p2}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#8A99AD] font-semibold text-xs px-2.5 py-1 inline-block">
                            {row.p1}
                          </span>
                        )}
                      </div>
                      <div className="col-span-4 text-center text-[#C3CAAC] text-[10px] font-bold uppercase truncate">
                        {row.label}
                      </div>
                      <div className="col-span-4 text-right">
                        {p2Wins ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/60 rounded-lg shadow-[0_0_12px_rgba(56,189,248,0.25)] font-black text-xs">
                            {typeof row.p1 === 'number' && typeof row.p2 === 'number' && (
                              <span className="text-[9px] bg-[#38BDF8]/30 text-[#38BDF8] px-1 rounded font-bold">
                                +{row.p2 - row.p1}
                              </span>
                            )}
                            <span>{row.p2}</span>
                          </span>
                        ) : (
                          <span className="text-[#8A99AD] font-semibold text-xs px-2.5 py-1 inline-block">
                            {row.p2}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSelectPlayer(compareList[0]);
                  setShowCompareModal(false);
                }}
                className="flex-1 py-2 bg-[#B9F600]/20 hover:bg-[#B9F600]/30 text-[#B9F600] border border-[#B9F600]/40 rounded-xl font-data text-xs font-bold"
              >
                {compareList[0].name} 상세페이지
              </button>
              <button
                onClick={() => {
                  onSelectPlayer(compareList[1]);
                  setShowCompareModal(false);
                }}
                className="flex-1 py-2 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] border border-[#38BDF8]/40 rounded-xl font-data text-xs font-bold"
              >
                {compareList[1].name} 상세페이지
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
