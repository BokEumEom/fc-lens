// 백엔드 프록시(/api/*) 응답 DTO 타입.
// 참고: SPEC.md 및 server/routes/nexon.ts

export interface AccountInfo {
  ouid: string;
  nickname: string;
  level: number;
  maxDivision: string;
  divisionCode: number;
  achievementDate: string;
}

export interface AccountResponse {
  account: AccountInfo;
  recentMatchIds: string[];
}

export interface GoalScorer {
  name: string;
  goals: number;
  rating: number;
}

export type MatchResult = "승" | "무" | "패";

export interface MatchSummary {
  matchId: string;
  matchDate: string;
  matchType: string;
  result: MatchResult;
  score: string;
  myGoals: number;
  opponentGoals: number;
  opponentNickname: string;
  possession: number;
  shots: number;
  effectiveShots: number;
  passSuccessRate: number;
  tackleSuccessRate: number;
  myGoalScorers: GoalScorer[];
  oppGoalScorers: GoalScorer[];
  controller: string;
}

export interface MatchesSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: string;
  avgGoals: string;
  avgPossession: string;
}

export interface UserMatchesResponse {
  ouid: string;
  matchType: string;
  summary: MatchesSummary;
  matches: MatchSummary[];
}

export interface LiveTeam {
  ouid: string;
  nickname: string;
  score: number;
  possession: number;
  shots: number;
  effectiveShots: number;
  color: string;
  scorers: { minute: number; name: string }[];
}

export interface LiveEvent {
  minute: number;
  type: string;
  player: string;
  team: string;
  text: string;
}

export interface LiveMatch {
  matchId: string;
  matchType: string;
  currentMinute: number;
  period: string;
  stadium: string;
  myTeam: LiveTeam;
  opponentTeam: LiveTeam;
  recentEvents: LiveEvent[];
}

export interface LiveMatchResponse {
  isPlaying: boolean;
  message?: string;
  liveMatch?: LiveMatch;
}

export interface MatchDetailResponse {
  matchId: string;
  matchDate: string;
  matchType: number;
  matchInfo: unknown[];
}

export interface TradeRecord {
  tradeDate?: string;
  saleSn?: string;
  spid?: number;
  grade?: number;
  value?: number;
  [key: string]: unknown;
}

export interface TradeResponse {
  tradeType: string;
  totalCount: number;
  trades: TradeRecord[];
}

// ranker-stats 응답 스키마는 실제 응답 확인 후 확정 (SPEC: TOP 10,000 랭커 사용 선수 20경기)
export interface RankerStat {
  [key: string]: unknown;
}

export interface RankersResponse {
  matchType: string;
  rankers: RankerStat[];
}

export interface MetadataResponse<T = unknown> {
  type: string;
  data: T;
  count?: number;
}

export interface ImagesResponse {
  spId: string;
  seasonId: string;
  playerPortraitUrl: string;
  playerActionShotUrl: string;
  seasonBadgeUrl: string;
}

export interface StatusResponse {
  configured: boolean;
  docsUrl: string;
  endpoints: { id: number; name: string; path: string }[];
}

export interface VerifyKeyResponse {
  valid: boolean;
  error?: string;
}
