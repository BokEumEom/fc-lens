import React from 'react';
import type { MatchDetailResponse, MatchTeam } from '../lib/api/types';
import { useRankerStats, statKey } from '../hooks/useRankerStats';
import { PlayerBenchmarkRow } from './meta/PlayerBenchmarkRow';

interface MetaViewProps {
  matchDetail: MatchDetailResponse | null;
  myTeam: MatchTeam | null;
  matchType: string;
  matchLoading: boolean;
}

/**
 * 메타(랭커 벤치마크) 탭.
 *
 * `/fconline/v1/ranker-stats`는 랭커 순위표가 아니라 "지정한 선수를 TOP 10,000
 * 랭커가 썼을 때의 20경기 집계"를 돌려준다. 그래서 이 화면은 선택된 매치의
 * 내 스쿼드(spid + spPosition)를 그대로 넘겨 내 실적과 랭커 평균을 비교한다.
 * 스쿼드 전체가 한 번의 요청으로 처리된다.
 */
export const MetaView: React.FC<MetaViewProps> = ({
  matchDetail,
  myTeam,
  matchType,
  matchLoading,
}) => {
  // 출전하지 않은 교체 명단은 스탯이 전부 0이라 비교 의미가 없다(평점 0으로 식별).
  const squad = (myTeam?.squad ?? []).filter((p) => p.rating > 0);
  const benchCount = (myTeam?.squad.length ?? 0) - squad.length;
  const { stats, loading, error } = useRankerStats(squad, matchType);

  // 랭커 평균을 넘어선 선수 수 (골/어시/유효슈팅 합계 기준)
  const outperformed = squad.filter((p) => {
    const ranker = stats.get(statKey(p.spId, p.spPosition));
    if (!ranker) return false;
    const mine = p.stats.goal + p.stats.assist + p.stats.effectiveShoot;
    const avg = ranker.status.goal + ranker.status.assist + ranker.status.effectiveShoot;
    return mine > avg;
  }).length;

  const compared = squad.filter((p) => stats.has(statKey(p.spId, p.spPosition))).length;

  // 넥슨 averageRating은 미출전 선수의 0점까지 포함해 실제보다 낮게 나온다.
  const avgRating = squad.length
    ? squad.reduce((sum, p) => sum + p.rating, 0) / squad.length
    : 0;

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-1">
        <h2 className="text-sm font-bold text-white font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-[#B9F600] text-lg">leaderboard</span>
          랭커 벤치마크
        </h2>
        <p className="text-[11px] text-[#8A99AD] font-data leading-relaxed">
          내가 쓴 선수의 이번 경기 실적을 TOP 10,000 랭커의 경기당 평균과 비교합니다.
        </p>
        {matchDetail && myTeam && (
          <p className="text-[11px] text-[#C3CAAC] font-data pt-1">
            기준 경기: <span className="text-white font-bold">{myTeam.nickname}</span> ·{' '}
            {matchDetail.matchType} · {new Date(matchDetail.matchDate).toLocaleDateString()}
            {benchCount > 0 && (
              <span className="text-[#8A99AD]"> · 미출전 {benchCount}명 제외</span>
            )}
          </p>
        )}
      </div>

      {(matchLoading || loading) && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[104px] bg-[#161A1E] border border-[#2D333B] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {!matchLoading && !loading && !myTeam && (
        <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-[#2D333B] text-4xl">query_stats</span>
          <p className="text-xs text-[#8A99AD] mt-2 font-data">
            구단주 탭에서 구단주를 검색하고 매치를 선택하면 비교가 표시됩니다.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#FF4B4B]/10 border border-[#FF4B4B]/40 rounded-2xl p-4 text-xs text-[#FF4B4B] font-data">
          {error}
        </div>
      )}

      {!matchLoading && !loading && !error && myTeam && squad.length === 0 && (
        <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-[#2D333B] text-4xl">query_stats</span>
          <p className="text-xs text-[#8A99AD] mt-2 font-data">
            이 경기에는 출전 기록이 있는 선수가 없습니다.
          </p>
        </div>
      )}

      {!matchLoading && !loading && !error && myTeam && squad.length > 0 && (
        <>
          <div className="bg-[#182029] border border-[#2D333B] rounded-2xl p-3.5 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-data text-[10px] text-[#C3CAAC] uppercase">비교 선수</p>
              <p className="text-base font-black text-white font-headline">
                {compared}/{squad.length}
              </p>
            </div>
            <div>
              <p className="font-data text-[10px] text-[#C3CAAC] uppercase">랭커 평균 상회</p>
              <p className="text-base font-black text-[#00FF87] font-headline">{outperformed}</p>
            </div>
            <div>
              <p className="font-data text-[10px] text-[#C3CAAC] uppercase">출전 평균 평점</p>
              <p className="text-base font-black text-[#B9F600] font-headline">
                {avgRating.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {squad.map((p) => (
              <PlayerBenchmarkRow
                key={`${p.spId}-${p.spPosition}`}
                player={p}
                rankerStat={stats.get(statKey(p.spId, p.spPosition))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
