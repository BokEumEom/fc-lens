import React from 'react';
import type { MatchTeam } from '../../lib/api/types';

interface MatchSquadRatingsProps {
  team: MatchTeam;
}

// 출전하지 않은 선수(평점 0)는 뒤로 보내고, 나머지는 평점 내림차순.
function byRatingDesc(a: { rating: number }, b: { rating: number }): number {
  return b.rating - a.rating;
}

export const MatchSquadRatings: React.FC<MatchSquadRatingsProps> = ({ team }) => {
  const squad = [...team.squad].sort(byRatingDesc);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-white font-headline">
        선수별 경기 평점 ({team.nickname})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {squad.map((p) => (
          <div
            key={p.spId}
            className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={p.image}
                alt={p.name}
                className="w-10 h-10 object-contain bg-[#182029] rounded-lg border border-[#2D333B] flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.visibility = 'hidden';
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.season && (
                    <span className="bg-[#B9F600] text-[#141F00] text-[9px] font-bold px-1 rounded font-data whitespace-nowrap">
                      {p.season.split(' (')[0]}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white truncate">{p.name}</span>
                </div>
                <p className="font-data text-[10px] text-[#C3CAAC]">
                  {p.position}
                  {p.grade > 0 && ` • +${p.grade}`}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pl-2">
              <span className="font-data text-xs text-[#B9F600] font-bold">
                ★ {p.rating.toFixed(1)}
              </span>
              <p className="text-[10px] text-[#C3CAAC] font-data">
                {p.goals}G {p.assists}A
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
