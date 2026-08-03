import React from 'react';
import type { MatchSquadPlayer, PlayerStats, RankerStat } from '../../lib/api/types';

// 비교에 쓸 지표. 랭커 통계와 매치 상세가 같은 키를 공유한다.
const METRICS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'goal', label: '골' },
  { key: 'assist', label: '어시' },
  { key: 'effectiveShoot', label: '유효슈팅' },
  { key: 'dribbleSuccess', label: '드리블' },
  { key: 'passSuccess', label: '패스' },
  { key: 'tackle', label: '태클' },
];

interface PlayerBenchmarkRowProps {
  player: MatchSquadPlayer;
  rankerStat: RankerStat | undefined;
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const MetricCell: React.FC<{
  label: string;
  mine: number;
  ranker: number | null;
}> = ({ label, mine, ranker }) => {
  const hasRanker = ranker !== null;
  const delta = hasRanker ? mine - ranker : 0;
  const tone = !hasRanker
    ? 'text-[#8A99AD]'
    : delta > 0
    ? 'text-[#00FF87]'
    : delta < 0
    ? 'text-[#FF4B4B]'
    : 'text-[#C3CAAC]';

  return (
    <div className="bg-[#182029] rounded-lg px-2 py-1.5 border border-[#2D333B] text-center">
      <p className="text-[9px] text-[#8A99AD] uppercase font-data">{label}</p>
      <p className={`text-xs font-bold font-data ${tone}`}>{formatValue(mine)}</p>
      <p className="text-[9px] text-[#8A99AD] font-data">
        랭커 {hasRanker ? formatValue(ranker) : '—'}
      </p>
    </div>
  );
};

export const PlayerBenchmarkRow: React.FC<PlayerBenchmarkRowProps> = ({ player, rankerStat }) => {
  const sampleSize = rankerStat?.status.matchCount ?? 0;

  return (
    <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={player.image}
            alt={player.name}
            className="w-9 h-9 object-contain bg-[#182029] rounded-lg border border-[#2D333B] flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.visibility = 'hidden';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{player.name}</span>
              <span className="bg-[#232B34] text-[#C3CAAC] text-[9px] px-1.5 rounded font-data border border-[#2D333B]">
                {player.position}
              </span>
            </div>
            <p className="font-data text-[10px] text-[#8A99AD]">
              {player.season.split(' (')[0]}
              {player.grade > 0 && ` · +${player.grade}`}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="font-data text-xs text-[#B9F600] font-bold">
            ★ {player.rating.toFixed(1)}
          </span>
          <p className="text-[9px] text-[#8A99AD] font-data">
            {sampleSize > 0 ? `랭커 표본 ${sampleSize}경기` : '랭커 표본 없음'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {METRICS.map((metric) => (
          <MetricCell
            key={metric.key}
            label={metric.label}
            mine={player.stats[metric.key]}
            ranker={rankerStat ? rankerStat.status[metric.key] : null}
          />
        ))}
      </div>
    </div>
  );
};
