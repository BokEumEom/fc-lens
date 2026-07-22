import React, { useState } from 'react';
import { Player } from '../types';
import { formatBP } from '../data/mockData';

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionLabel: string;
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  positionLabel,
  players,
  onSelectPlayer,
}) => {
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<string>('RECOMMENDED');

  if (!isOpen) return null;

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.club.toLowerCase().includes(search.toLowerCase()) ||
      p.season.toLowerCase().includes(search.toLowerCase());

    if (filterPos === 'RECOMMENDED') {
      return (
        matchesSearch &&
        (p.position === positionLabel || p.preferredPositions.includes(positionLabel))
      );
    }
    if (filterPos === 'ALL') return matchesSearch;
    return matchesSearch && (p.position === filterPos || p.preferredPositions.includes(filterPos));
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#161A1E] border border-[#2D333B] w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Select Player for {positionLabel}</h3>
            <p className="text-xs text-[#C3CAAC]">Pick the best player for this slot</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#C3CAAC] hover:text-white p-1 rounded-lg hover:bg-[#232B34]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#C3CAAC] text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player name, club..."
            className="w-full bg-[#232B34] border border-[#2D333B] rounded-xl py-2 pl-9 pr-3 text-white text-xs placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
          />
        </div>

        {/* Filter Quick Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['RECOMMENDED', 'ALL', 'ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'].map(
            (pos) => (
              <button
                key={pos}
                onClick={() => setFilterPos(pos)}
                className={`px-3 py-1 rounded-full font-data text-[11px] font-semibold whitespace-nowrap border transition-all ${
                  filterPos === pos
                    ? 'bg-[#B9F600] text-[#141F00] border-[#B9F600]'
                    : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B]'
                }`}
              >
                {pos}
              </button>
            )
          )}
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 min-h-[250px]">
          {filtered.map((player) => (
            <div
              key={player.id}
              onClick={() => {
                onSelectPlayer(player);
                onClose();
              }}
              className="p-3 bg-[#182029] border border-[#2D333B] hover:border-[#B9F600] rounded-xl flex items-center justify-between cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#2D333B] bg-[#232B34]"
                />
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-[#B9F600] transition-colors">
                    {player.name}
                  </div>
                  <div className="text-[11px] text-[#C3CAAC]">
                    {player.season} • {player.position} • Salary {player.salary}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-[#B9F600]">{player.ovr} OVR</div>
                <div className="font-data text-[10px] text-white">{formatBP(player.bpPrice)}</div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#C3CAAC] text-xs">
              No matching players found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
