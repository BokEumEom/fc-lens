import React from 'react';
import type { MatchDetailResponse } from '../../lib/api/types';

interface MatchScoreboardProps {
  detail: MatchDetailResponse;
}

interface StatBarProps {
  label: string;
  homeText: string;
  awayText: string;
  homeRatio: number;
  awayRatio: number;
  homeColor: string;
  awayColor: string;
}

const StatBar: React.FC<StatBarProps> = ({
  label,
  homeText,
  awayText,
  homeRatio,
  awayRatio,
  homeColor,
  awayColor,
}) => (
  <div>
    <div className="flex justify-between text-[11px] text-[#C3CAAC] mb-1 font-data">
      <span>{homeText}</span>
      <span className="text-white font-bold uppercase">{label}</span>
      <span>{awayText}</span>
    </div>
    <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
      <div className={`${homeColor} h-full`} style={{ width: `${homeRatio}%` }} />
      <div className={`${awayColor} h-full`} style={{ width: `${awayRatio}%` }} />
    </div>
  </div>
);

function shotRatio(effective: number, total: number): number {
  return (effective / (total || 1)) * 100;
}

export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ detail }) => {
  const [home, away] = detail.teams;
  if (!home || !away) return null;

  return (
    <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="text-center space-y-1">
        <span className="font-data text-[10px] text-[#B9F600] uppercase tracking-wider font-bold">
          {detail.matchType}
        </span>
        <p className="text-[11px] text-[#C3CAAC]">{new Date(detail.matchDate).toLocaleString()}</p>
      </div>

      <div className="flex items-center justify-around py-3 border-y border-[#2D333B]">
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-white">{home.nickname}</p>
          <span className="bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40 text-[10px] font-bold px-2 py-0.5 rounded font-data">
            {home.result}
          </span>
        </div>

        <div className="text-center font-headline font-black text-3xl text-[#B9F600]">
          {home.score} : {away.score}
        </div>

        <div className="text-center space-y-1">
          <p className="text-base font-bold text-white">{away.nickname}</p>
          <span className="bg-[#FF4B4B]/20 text-[#FF4B4B] border border-[#FF4B4B]/40 text-[10px] font-bold px-2 py-0.5 rounded font-data">
            {away.result}
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-1 text-xs">
        <StatBar
          label="점유율"
          homeText={`${home.possession}%`}
          awayText={`${away.possession}%`}
          homeRatio={home.possession}
          awayRatio={away.possession}
          homeColor="bg-[#B9F600]"
          awayColor="bg-[#3D4754]"
        />
        <StatBar
          label="유효슈팅 / 총슈팅"
          homeText={`${home.effectiveShots}/${home.totalShots}`}
          awayText={`${away.effectiveShots}/${away.totalShots}`}
          homeRatio={shotRatio(home.effectiveShots, home.totalShots)}
          awayRatio={shotRatio(away.effectiveShots, away.totalShots)}
          homeColor="bg-[#00FF87]"
          awayColor="bg-[#FF4B4B]"
        />
        <StatBar
          label="패스 성공률"
          homeText={`${home.passSuccessRate}%`}
          awayText={`${away.passSuccessRate}%`}
          homeRatio={home.passSuccessRate}
          awayRatio={away.passSuccessRate}
          homeColor="bg-[#B9F600]"
          awayColor="bg-[#3D4754]"
        />
        <StatBar
          label="태클 성공률"
          homeText={`${home.tackleSuccessRate}%`}
          awayText={`${away.tackleSuccessRate}%`}
          homeRatio={home.tackleSuccessRate}
          awayRatio={away.tackleSuccessRate}
          homeColor="bg-[#00FF87]"
          awayColor="bg-[#FF4B4B]"
        />
      </div>
    </div>
  );
};
