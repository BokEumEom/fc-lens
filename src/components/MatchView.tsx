import React from 'react';
import type { MatchDetailResponse, MatchSummary } from '../lib/api/types';
import { MatchScoreboard } from './match/MatchScoreboard';
import { MatchSquadRatings } from './match/MatchSquadRatings';

interface MatchViewProps {
  matches: MatchSummary[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  matchDetail: MatchDetailResponse | null;
  loading: boolean;
  error: string | null;
  ownerNickname: string;
}

function resultColor(result: string): string {
  if (result === '승') return 'text-[#00FF87]';
  if (result === '패') return 'text-[#FF4B4B]';
  return 'text-amber-400';
}

export const MatchView: React.FC<MatchViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  matchDetail,
  loading,
  error,
  ownerNickname,
}) => (
  <div className="space-y-4 animate-in fade-in">
    {matches.length > 0 && (
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-data text-xs text-white font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[#B9F600] text-sm">history</span>
            최근 매치 ({ownerNickname})
          </span>
          <span className="text-[10px] text-[#C3CAAC]">선택하면 상세를 불러옵니다</span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {matches.map((m) => {
            const isSelected = selectedMatchId === m.matchId;

            return (
              <button
                key={m.matchId}
                onClick={() => onSelectMatch(m.matchId)}
                className={`px-3 py-2 rounded-xl border text-xs font-data transition-all flex flex-col items-start min-w-[140px] whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#B9F600] text-[#141F00] font-bold border-[#B9F600] shadow-[0_0_10px_rgba(185,246,0,0.2)]'
                    : 'bg-[#182029] text-[#C3CAAC] border-[#2D333B] hover:text-white hover:bg-[#232B34]'
                }`}
              >
                <div className="flex items-center justify-between w-full text-[11px]">
                  <span className={`font-bold ${isSelected ? 'text-[#141F00]' : resultColor(m.result)}`}>
                    [{m.result}] {m.score}
                  </span>
                  <span className="text-[9px] opacity-75">
                    {new Date(m.matchDate).toLocaleDateString().slice(5)}
                  </span>
                </div>
                <span className="text-[10px] truncate max-w-[120px] mt-0.5 opacity-90">
                  vs {m.opponentNickname}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    )}

    {loading && (
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center text-xs text-[#C3CAAC] space-y-2">
        <span className="material-symbols-outlined text-[#B9F600] text-3xl animate-spin">sync</span>
        <p className="font-bold text-white">매치 상세와 스쿼드 기록을 불러오는 중...</p>
      </div>
    )}

    {!loading && error && (
      <div className="bg-[#93000A]/30 border border-[#FF4B4B]/60 rounded-2xl p-6 text-center text-xs text-white">
        {error}
      </div>
    )}

    {!loading && !error && !matchDetail && (
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-[#2D333B] text-4xl">sports_score</span>
        <p className="text-xs text-[#8A99AD] mt-2 font-data">
          구단주 탭에서 구단주를 검색하면 매치 기록이 표시됩니다.
        </p>
      </div>
    )}

    {!loading && matchDetail && (
      <div className="space-y-4">
        <MatchScoreboard detail={matchDetail} />
        {matchDetail.teams[0] && <MatchSquadRatings team={matchDetail.teams[0]} />}
      </div>
    )}
  </div>
);
