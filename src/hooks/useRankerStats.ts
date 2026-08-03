import { useEffect, useState } from "react";
import { getRankerStats } from "../lib/api/nexon";
import type { MatchSquadPlayer, RankerStat } from "../lib/api/types";

export interface RankerStatsState {
  stats: Map<number, RankerStat>;
  loading: boolean;
  error: string | null;
}

// spid + 포지션 조합이 비교의 키다. 같은 선수라도 포지션이 다르면 통계가 다르다.
export function statKey(spid: number, spPosition: number): number {
  return spid * 100 + spPosition;
}

/**
 * 주어진 스쿼드 선수들의 랭커 사용 통계를 조회한다.
 * 스쿼드 전체를 한 번의 요청으로 처리하므로 넥슨 rate limit에 걸리지 않는다.
 */
export function useRankerStats(
  squad: MatchSquadPlayer[],
  matchType: string
): RankerStatsState {
  const [stats, setStats] = useState<Map<number, RankerStat>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 요청 대상이 실제로 바뀔 때만 재조회하도록 원시값으로 축약한다.
  const squadKey = squad.map((p) => `${p.spId}:${p.spPosition}`).join(",");

  useEffect(() => {
    if (!squadKey) {
      setStats(new Map());
      setError(null);
      return;
    }

    const players = squadKey.split(",").map((entry) => {
      const [id, po] = entry.split(":");
      return { id: Number(id), po: Number(po) };
    });

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRankerStats(players, matchType)
      .then((data) => {
        if (cancelled) return;
        setStats(new Map(data.stats.map((s) => [statKey(s.spid, s.spPosition), s])));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStats(new Map());
        setError(err instanceof Error ? err.message : "랭커 통계를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [squadKey, matchType]);

  return { stats, loading, error };
}
