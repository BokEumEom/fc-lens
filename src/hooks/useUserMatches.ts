import { getUserMatches, type UserMatchesParams } from "../lib/api/nexon";
import type { UserMatchesResponse } from "../lib/api/types";
import { useAsync, type AsyncState } from "./useAsync";

// 구단주 최근 매치 집계 조회 (nickname 또는 ouid 가 있을 때만 실행)
export function useUserMatches(params: UserMatchesParams): AsyncState<UserMatchesResponse> {
  const { nickname, ouid, matchtype, limit } = params;
  const enabled = Boolean(nickname?.trim() || ouid);
  return useAsync<UserMatchesResponse>(
    () => getUserMatches(params),
    [nickname, ouid, matchtype, limit],
    enabled
  );
}
