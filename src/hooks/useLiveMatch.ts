import { getLiveMatch, type LiveMatchParams } from "../lib/api/nexon";
import type { LiveMatchResponse } from "../lib/api/types";
import { useAsync, type AsyncState } from "./useAsync";

// 실시간(최근 20분 내) 경기 조회 (nickname 또는 ouid 가 있을 때만 실행)
export function useLiveMatch(params: LiveMatchParams): AsyncState<LiveMatchResponse> {
  const { nickname, ouid } = params;
  const enabled = Boolean(nickname?.trim() || ouid);
  return useAsync<LiveMatchResponse>(() => getLiveMatch(params), [nickname, ouid], enabled);
}
