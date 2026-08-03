// 넥슨 API 엔드포인트별 타입 지정 함수.
// 컴포넌트는 이 함수(또는 상위 hooks)를 통해서만 데이터를 조회한다.
import { apiGet, apiPost } from "./client";
import type {
  AccountResponse,
  UserMatchesResponse,
  LiveMatchResponse,
  MatchDetailResponse,
  TradeResponse,
  RankerStatsResponse,
  MetadataResponse,
  ImagesResponse,
  StatusResponse,
  VerifyKeyResponse,
} from "./types";

export function getStatus(): Promise<StatusResponse> {
  return apiGet<StatusResponse>("/nexon/status");
}

export function verifyKey(apiKey: string): Promise<VerifyKeyResponse> {
  return apiPost<VerifyKeyResponse>("/nexon/verify-key", { apiKey });
}

export function getAccount(nickname: string): Promise<AccountResponse> {
  return apiGet<AccountResponse>("/nexon/account", { nickname });
}

export interface UserMatchesParams {
  nickname?: string;
  ouid?: string;
  matchtype?: string | number;
  limit?: number;
}

export function getUserMatches(params: UserMatchesParams): Promise<UserMatchesResponse> {
  return apiGet<UserMatchesResponse>("/nexon/user-matches", { ...params });
}

export interface LiveMatchParams {
  nickname?: string;
  ouid?: string;
}

export function getLiveMatch(params: LiveMatchParams): Promise<LiveMatchResponse> {
  return apiGet<LiveMatchResponse>("/nexon/live-match", { ...params });
}

export function getMatchDetail(matchid: string): Promise<MatchDetailResponse> {
  return apiGet<MatchDetailResponse>("/nexon/match-detail", { matchid });
}

export interface RankerStatsPlayer {
  /** 선수 고유 식별자(spid) */
  id: number;
  /** 포지션 코드(spposition) */
  po: number;
}

// 지정한 선수들의 랭커 사용 통계를 한 번에 조회한다(스쿼드 전체 = 1콜).
export function getRankerStats(
  players: RankerStatsPlayer[],
  matchtype: string | number = 50
): Promise<RankerStatsResponse> {
  return apiGet<RankerStatsResponse>("/nexon/ranker-stats", {
    matchtype,
    players: JSON.stringify(players),
  });
}

export interface TradeParams {
  nickname?: string;
  ouid?: string;
  tradetype?: "buy" | "sell";
}

export function getTrades(params: TradeParams): Promise<TradeResponse> {
  return apiGet<TradeResponse>("/nexon/trade", { ...params });
}

export function getMetadata<T = unknown>(type: string): Promise<MetadataResponse<T>> {
  return apiGet<MetadataResponse<T>>("/nexon/metadata", { type });
}

export function getImages(
  spid?: string | number,
  seasonid?: string | number
): Promise<ImagesResponse> {
  return apiGet<ImagesResponse>("/nexon/images", { spid, seasonid });
}

export function askAiAdvisor(prompt: string): Promise<{ advice: string }> {
  return apiPost<{ advice: string }>("/ai-squad-assistant", { prompt });
}
