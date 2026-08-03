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

// match-detail과 ranker-stats가 공유하는 선수 스탯 어휘.
// 두 응답이 같은 키를 쓰므로 "내 선수 vs 랭커 평균"을 그대로 비교할 수 있다.
export interface PlayerStats {
  shoot: number;
  effectiveShoot: number;
  goal: number;
  assist: number;
  dribbleTry: number;
  dribbleSuccess: number;
  passTry: number;
  passSuccess: number;
  block: number;
  tackle: number;
}

export interface MatchSquadPlayer {
  spId: number;
  name: string;
  season: string;
  position: string;
  spPosition: number;
  grade: number;
  goals: number;
  assists: number;
  rating: number;
  image: string;
  stats: PlayerStats;
}

export interface MatchTeam {
  ouid: string;
  nickname: string;
  result: MatchResult;
  score: number;
  possession: number;
  totalShots: number;
  effectiveShots: number;
  passSuccessRate: number;
  tackleSuccessRate: number;
  controller: string;
  averageRating: number;
  squad: MatchSquadPlayer[];
}

// 서버가 넥슨 원본(matchInfo[])을 teams[]로 정규화하고
// 선수명/포지션/시즌을 정적 메타에서 조인해 내려준다.
export interface MatchDetailResponse {
  matchId: string;
  matchDate: string;
  /** 서버가 matchtype 메타로 변환한 사람이 읽는 이름 */
  matchType: string;
  teams: MatchTeam[];
}

// 선수명/시즌/이미지는 서버가 정적 메타에서 조인한 값이다.
export interface TradeRecord {
  tradeDate: string;
  saleSn: string;
  spid: number;
  grade: number;
  value: number;
  name: string;
  season: string;
  image: string;
}

export interface TradeResponse {
  tradeType: string;
  totalCount: number;
  trades: TradeRecord[];
}

// ranker-stats: 지정한 선수를 TOP 10,000 랭커가 썼을 때의 20경기 집계.
// 랭커 유저 순위표가 아니다 (PLAN.md "랭킹 탭 재정의" 참고).
export interface RankerStat {
  spid: number;
  spPosition: number;
  name: string;
  season: string;
  position: string;
  image: string;
  status: PlayerStats & { matchCount: number };
}

export interface RankerStatsResponse {
  matchType: string;
  stats: RankerStat[];
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
