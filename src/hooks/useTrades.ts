import { getTrades, type TradeParams } from "../lib/api/nexon";
import type { TradeResponse } from "../lib/api/types";
import { useAsync, type AsyncState } from "./useAsync";

// 이적시장 거래(구매/판매) 내역 조회 (nickname 또는 ouid 가 있을 때만 실행)
export function useTrades(params: TradeParams): AsyncState<TradeResponse> {
  const { nickname, ouid, tradetype } = params;
  const enabled = Boolean(nickname?.trim() || ouid);
  return useAsync<TradeResponse>(() => getTrades(params), [nickname, ouid, tradetype], enabled);
}
