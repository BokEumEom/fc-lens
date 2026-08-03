import React from 'react';
import type { LiveMatch } from '../../lib/api/types';

export const LiveMatchCard: React.FC<{
  liveData: LiveMatch | null;
  loading: boolean;
  onRefresh: () => void;
}> = ({ liveData, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="bg-[#182029] p-4 rounded-2xl border border-red-500/30 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-[#232B34] rounded" />
          <div className="h-4 w-24 bg-[#232B34] rounded" />
        </div>
        <div className="h-16 bg-[#232B34] rounded-xl" />
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="bg-[#161A1E] p-3 rounded-2xl border border-[#2D333B] flex items-center justify-between gap-3 text-xs font-data">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
          </span>
          <div>
            <span className="text-[#C3CAAC] font-bold">진행 중인 실시간 경기 없음</span>
            <span className="text-[10px] text-[#8A99AD] ml-2 hidden sm:inline">
              (게임 플레이 중 실시간 스코어 연동)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 bg-[#232B34] hover:bg-[#2d3642] text-[#C3CAAC] hover:text-white rounded-xl text-[11px] border border-[#2D333B] flex items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">refresh</span>
            <span>조회</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#1E1112] via-[#1A1822] to-[#111A1A] p-4 rounded-2xl border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] space-y-3 relative overflow-hidden font-data animate-in fade-in">
      {/* Background Watermark */}
      <div className="absolute right-[-15px] top-[-15px] text-red-500/10 text-8xl font-black pointer-events-none select-none">
        LIVE
      </div>

      {/* Live Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/30 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-1">
            🔴 LIVE MATCH IN PROGRESS
          </span>
          <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
            {liveData.period} {liveData.currentMinute}'
          </span>
          <span className="text-[10px] text-[#C3CAAC] hidden md:inline">
            ({liveData.matchType})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-2 py-1 bg-[#232B34] hover:bg-red-500/20 text-[#C3CAAC] hover:text-red-300 rounded-lg text-[10px] border border-[#2D333B] flex items-center gap-1 transition-all"
            title="실시간 경기 정보 갱신"
          >
            <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
            <span>실시간 갱신</span>
          </button>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="grid grid-cols-12 gap-2 items-center bg-[#0F1318]/80 p-3 rounded-xl border border-red-500/30 relative z-10">
        {/* My Team */}
        <div className="col-span-5 text-right space-y-1">
          <p className="text-xs font-black text-[#B9F600] truncate">{liveData.myTeam.nickname}</p>
          <div className="text-[10px] text-[#C3CAAC] flex items-center justify-end gap-2">
            <span>슈팅 {liveData.myTeam.effectiveShots}/{liveData.myTeam.shots}</span>
            <span>점유 {liveData.myTeam.possession}%</span>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="col-span-2 text-center">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl py-1 px-2 text-center shadow-[0_0_10px_rgba(239,68,68,0.4)]">
            <span className="text-xl font-black text-white font-headline tracking-widest">
              {liveData.myTeam.score} : {liveData.opponentTeam.score}
            </span>
          </div>
          <p className="text-[9px] text-red-400 font-bold mt-1 uppercase animate-pulse">LIVE</p>
        </div>

        {/* Opponent Team */}
        <div className="col-span-5 text-left space-y-1">
          <p className="text-xs font-black text-sky-400 truncate">{liveData.opponentTeam.nickname}</p>
          <div className="text-[10px] text-[#C3CAAC] flex items-center justify-start gap-2">
            <span>점유 {liveData.opponentTeam.possession}%</span>
            <span>슈팅 {liveData.opponentTeam.effectiveShots}/{liveData.opponentTeam.shots}</span>
          </div>
        </div>
      </div>

      {/* Possession Progress Bar */}
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between text-[10px] text-[#C3CAAC]">
          <span className="text-[#B9F600] font-bold">내 팀 점유율 {liveData.myTeam.possession}%</span>
          <span className="text-sky-400 font-bold">상대팀 점유율 {liveData.opponentTeam.possession}%</span>
        </div>
        <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
          <div className="bg-[#B9F600] h-full transition-all duration-500" style={{ width: `${liveData.myTeam.possession}%` }} />
          <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${liveData.opponentTeam.possession}%` }} />
        </div>
      </div>

      {/* Real-time Events Log */}
      {liveData.recentEvents && liveData.recentEvents.length > 0 && (
        <div className="bg-[#0F1318]/60 p-2.5 rounded-xl border border-[#2D333B] space-y-1.5 relative z-10">
          <p className="text-[10px] font-bold text-red-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">bolt</span>
            실시간 주요 타임라인 이벤트 (Live Feed)
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {liveData.recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-[#182029] border border-[#2D333B] text-white flex items-center gap-1"
              >
                <span className="font-bold text-red-400">{evt.minute}'</span>
                <span>{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
