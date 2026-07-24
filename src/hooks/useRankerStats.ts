import { getRankers } from "../lib/api/nexon";
import type { RankersResponse } from "../lib/api/types";
import { useAsync, type AsyncState } from "./useAsync";

// 랭커 통계(ranker-stats) 조회
export function useRankerStats(matchtype: string | number = 50): AsyncState<RankersResponse> {
  return useAsync<RankersResponse>(() => getRankers(matchtype), [matchtype], true);
}
