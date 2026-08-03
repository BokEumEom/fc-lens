import React, { useState } from 'react';
import type { GoalScorer, MatchSummary } from '../../lib/api/types';
import { MatchCardSkeleton } from '../common/Skeletons';

type ResultFilter = 'ALL' | 'WIN' | 'DRAW' | 'LOSS';

const FILTERS: { key: ResultFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'WIN', label: '승리' },
  { key: 'DRAW', label: '무승부' },
  { key: 'LOSS', label: '패배' },
];

const RESULT_TO_FILTER: Record<string, ResultFilter> = { 승: 'WIN', 무: 'DRAW', 패: 'LOSS' };

interface MatchHistoryListProps {
  matches: MatchSummary[];
  loading: boolean;
  error: string | null;
  onOpenDetail: (matchId: string) => void;
}

function accentClasses(result: string): { border: string; badge: string } {
  if (result === '승') {
    return {
      border: 'border-l-4 border-l-[#00FF87] bg-[#00FF87]/5',
      badge: 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87]',
    };
  }
  if (result === '패') {
    return {
      border: 'border-l-4 border-l-[#FF4B4B] bg-[#FF4B4B]/5',
      badge: 'bg-[#FF4B4B]/20 border-[#FF4B4B] text-[#FF4B4B]',
    };
  }
  return {
    border: 'border-l-4 border-l-amber-400 bg-amber-400/5',
    badge: 'bg-amber-400/20 border-amber-400 text-amber-300',
  };
}

const ScorerPills: React.FC<{
  label: string;
  scorers: GoalScorer[];
  tone: 'my' | 'opp';
}> = ({ label, scorers, tone }) => {
  const isMy = tone === 'my';
  const pill = isMy
    ? 'bg-[#00FF87]/15 text-[#00FF87] border-[#00FF87]/30'
    : 'bg-[#FF4B4B]/15 text-[#FF4B4B] border-[#FF4B4B]/30';
  const badge = isMy ? 'bg-[#00FF87] text-[#141F00]' : 'bg-[#FF4B4B] text-white';

  return (
    <div className="flex items-center gap-2 bg-[#161A1E] px-2.5 py-1.5 rounded-xl border border-[#2D333B]">
      <span className="text-[10px] text-[#C3CAAC] font-bold min-w-[55px] flex items-center gap-1">
        <span className={isMy ? 'text-[#00FF87]' : 'text-[#FF4B4B]'}>⚽</span> {label}
      </span>
      <div className="flex flex-wrap gap-1.5 items-center">
        {scorers.length > 0 ? (
          scorers.map((gs, idx) => (
            <span
              key={`${gs.name}-${idx}`}
              className={`px-2 py-0.5 border rounded-lg text-[10px] font-bold flex items-center gap-1 ${pill}`}
            >
              <span>{gs.name}</span>
              <span className={`${badge} text-[9px] px-1.5 py-0.2 rounded-full font-black`}>
                {gs.goals}골
              </span>
            </span>
          ))
        ) : (
          <span className="text-[10px] text-[#8A99AD] italic">득점 없음</span>
        )}
      </div>
    </div>
  );
};

export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({
  matches,
  loading,
  error,
  onOpenDetail,
}) => {
  const [filter, setFilter] = useState<ResultFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible =
    filter === 'ALL' ? matches : matches.filter((m) => RESULT_TO_FILTER[m.result] === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#C3CAAC] font-data">필터:</span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2 py-0.5 rounded-md font-data text-[10px] transition-all ${
              filter === f.key
                ? 'bg-[#232B34] text-white border border-[#B9F600]'
                : 'text-[#C3CAAC] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <MatchCardSkeleton />}

      {!loading && error && (
        <div className="p-4 text-center text-xs text-[#FF4B4B] bg-[#FF4B4B]/10 rounded-xl border border-[#FF4B4B]/30">
          {error}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="p-6 text-center text-xs text-[#C3CAAC] bg-[#182029] rounded-xl border border-[#2D333B]">
          표시할 매치 기록이 없습니다.
        </div>
      )}

      {!loading &&
        visible.map((m) => {
          const accent = accentClasses(m.result);
          const isExpanded = expandedId === m.matchId;
          const shotAccuracy = m.shots > 0 ? Math.round((m.effectiveShots / m.shots) * 100) : 0;

          return (
            <div
              key={m.matchId}
              className={`p-3.5 rounded-2xl border border-[#2D333B] bg-[#182029] ${accent.border} hover:border-[#B9F600]/60 transition-all space-y-3`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border font-data ${accent.badge}`}
                    >
                      {m.result}
                    </span>
                    <span className="text-sm font-black text-white font-headline">{m.score}</span>
                    <span className="text-xs text-[#C3CAAC]">
                      vs <strong className="text-white">{m.opponentNickname}</strong>
                    </span>
                    <span className="bg-[#232B34] text-[#C3CAAC] text-[9px] px-1.5 py-0.2 rounded font-data border border-[#2D333B]">
                      {m.matchType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#C3CAAC] font-data">
                    <span>
                      📅 {new Date(m.matchDate).toLocaleDateString()}{' '}
                      {new Date(m.matchDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>
                      ⚽ 슈팅 {m.effectiveShots}/{m.shots}
                    </span>
                    <span>📊 점유율 {m.possession}%</span>
                    <span>🎯 패스성공 {m.passSuccessRate}%</span>
                    <span>🎮 {m.controller === 'pad' ? '게임패드' : '키보드'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.matchId)}
                    className={`px-2.5 py-1.5 rounded-xl border font-data text-xs transition-all flex items-center gap-1 ${
                      isExpanded
                        ? 'bg-[#B9F600]/20 border-[#B9F600] text-[#B9F600] font-bold'
                        : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isExpanded ? 'expand_less' : 'analytics'}
                    </span>
                    <span>{isExpanded ? '접기' : '상세'}</span>
                  </button>

                  <button
                    onClick={() => onOpenDetail(m.matchId)}
                    className="px-3 py-1.5 bg-[#232B34] hover:bg-[#B9F600] hover:text-[#141F00] text-white border border-[#2D333B] rounded-xl font-data text-xs transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>전술 분석</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2D333B]/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-data">
                <ScorerPills label="내 팀:" scorers={m.myGoalScorers} tone="my" />
                <ScorerPills label="상대팀:" scorers={m.oppGoalScorers} tone="opp" />
              </div>

              {isExpanded && (
                <div className="p-3 bg-[#13171B] rounded-xl border border-[#2D333B] space-y-3 animate-in fade-in text-xs font-data">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                        <span>점유율</span>
                        <span className="text-white font-bold">
                          {m.possession}% vs {100 - m.possession}%
                        </span>
                      </div>
                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
                        <div className="bg-[#00FF87] h-full" style={{ width: `${m.possession}%` }} />
                        <div
                          className="bg-[#FF4B4B] h-full"
                          style={{ width: `${100 - m.possession}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                        <span>슈팅 유효율</span>
                        <span className="text-[#00FF87] font-bold">
                          {shotAccuracy}% ({m.effectiveShots}/{m.shots})
                        </span>
                      </div>
                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#B9F600] h-full" style={{ width: `${shotAccuracy}%` }} />
                      </div>
                    </div>

                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                        <span>패스 / 태클</span>
                        <span className="text-sky-400 font-bold">
                          패스 {m.passSuccessRate}% | 태클 {m.tackleSuccessRate}%
                        </span>
                      </div>
                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex gap-0.5">
                        <div
                          className="bg-sky-400 h-full"
                          style={{ width: `${m.passSuccessRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#8A99AD] pt-1">
                    <span>
                      경기 ID: <strong className="text-white font-data">{m.matchId}</strong>
                    </span>
                    <button
                      onClick={() => onOpenDetail(m.matchId)}
                      className="text-[#B9F600] hover:underline flex items-center gap-0.5"
                    >
                      <span>상세 라인업 & 선수별 평점</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
