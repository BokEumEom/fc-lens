// 넥슨 원본 응답 → 화면이 쓰는 뷰 모델 변환.
//
// 라우트 핸들러에서 분리한 순수 함수 모음이다. 네트워크·Express에 의존하지 않으므로
// 저장된 원본 픽스처로 계약을 검증할 수 있다. 실제로 이 계층의 불일치(matchInfo[] vs
// teams[])가 매치 탭이 빈 화면이던 원인이었다.

import {
  getMatchTypeName,
  getPlayerImageUrl,
  getPlayerName,
  getPositionName,
  getSeasonName,
  type MetaTables,
} from "./meta";

export type MatchResult = "승" | "무" | "패";

// 시도/성공 횟수를 성공률(%)로 변환. 시도가 없으면 0.
// (시도가 없을 때 임의의 기본값을 넣으면 없는 데이터를 지어내는 셈이 된다.)
export function toRate(success?: number, tries?: number): number {
  if (!tries || tries <= 0) return 0;
  return Math.round(((success ?? 0) / tries) * 100);
}

// 넥슨은 승/패를 한글 또는 영문으로 돌려줄 수 있다.
export function normalizeResult(raw: unknown): MatchResult {
  if (raw === "승" || raw === "WIN") return "승";
  if (raw === "패" || raw === "LOSE") return "패";
  return "무";
}

// ------------------------------------------------------------------
// 매치 상세
// ------------------------------------------------------------------

function toSquadPlayer(p: any, meta: MetaTables) {
  const status = p?.status ?? {};
  return {
    spId: p?.spId,
    name: getPlayerName(meta, p?.spId),
    season: getSeasonName(meta, p?.spId),
    position: getPositionName(meta, p?.spPosition),
    spPosition: p?.spPosition,
    grade: p?.spGrade ?? 0,
    goals: status.goal ?? 0,
    assists: status.assist ?? 0,
    rating: status.spRating ?? 0,
    image: getPlayerImageUrl(p?.spId),
    // ranker-stats와 같은 어휘로 맞춰 랭커 평균과 직접 비교할 수 있게 한다.
    stats: {
      shoot: status.shoot ?? 0,
      effectiveShoot: status.effectiveShoot ?? 0,
      goal: status.goal ?? 0,
      assist: status.assist ?? 0,
      dribbleTry: status.dribbleTry ?? 0,
      dribbleSuccess: status.dribbleSuccess ?? 0,
      passTry: status.passTry ?? 0,
      passSuccess: status.passSuccess ?? 0,
      block: status.block ?? 0,
      tackle: status.tackle ?? 0,
    },
  };
}

function toTeam(info: any, meta: MetaTables) {
  return {
    ouid: info?.ouid,
    nickname: info?.nickname,
    result: normalizeResult(info?.matchDetail?.matchResult),
    score: info?.shoot?.goalTotal ?? 0,
    possession: info?.matchDetail?.possession ?? 50,
    totalShots: info?.shoot?.shootTotal ?? 0,
    effectiveShots: info?.shoot?.effectiveShootTotal ?? 0,
    passSuccessRate: toRate(info?.pass?.passSuccess, info?.pass?.passTry),
    tackleSuccessRate: toRate(info?.defence?.tackleSuccess, info?.defence?.tackleTry),
    controller: info?.matchDetail?.controller ?? "pad",
    averageRating: info?.matchDetail?.averageRating ?? 0,
    squad: (info?.player ?? []).map((p: any) => toSquadPlayer(p, meta)),
  };
}

/** 넥슨 match-detail 원본을 teams[] 뷰 모델로 정규화한다. */
export function normalizeMatchDetail(raw: any, meta: MetaTables) {
  return {
    matchId: raw?.matchId,
    matchDate: raw?.matchDate,
    matchType: getMatchTypeName(meta, raw?.matchType),
    teams: (raw?.matchInfo ?? []).map((info: any) => toTeam(info, meta)),
  };
}

// ------------------------------------------------------------------
// 매치 기록 집계 (user-matches)
// ------------------------------------------------------------------

function toGoalScorers(info: any, meta: MetaTables) {
  return (info?.player ?? [])
    .filter((p: any) => (p?.status?.goal ?? 0) > 0)
    .map((p: any) => ({
      name: getPlayerName(meta, p.spId),
      goals: p.status.goal,
      rating: p.status.spRating ?? 0,
    }));
}

/** 매치 1건의 원본을 구단주(ouid) 관점의 요약으로 변환한다. 대상이 없으면 null. */
export function toMatchSummary(raw: any, ouid: string, meta: MetaTables) {
  const infos = raw?.matchInfo ?? [];
  const myInfo = infos.find((i: any) => i?.ouid === ouid) ?? infos[0];
  if (!myInfo) return null;

  const oppInfo = infos.find((i: any) => i !== myInfo) ?? null;
  const myGoals = myInfo.shoot?.goalTotal ?? 0;
  const oppGoals = oppInfo?.shoot?.goalTotal ?? 0;

  return {
    matchId: raw?.matchId,
    matchDate: raw?.matchDate,
    matchType: getMatchTypeName(meta, raw?.matchType),
    result: normalizeResult(myInfo.matchDetail?.matchResult),
    score: `${myGoals} : ${oppGoals}`,
    myGoals,
    opponentGoals: oppGoals,
    opponentNickname: oppInfo?.nickname ?? "상대 구단주",
    possession: myInfo.matchDetail?.possession ?? 50,
    shots: myInfo.shoot?.shootTotal ?? 0,
    effectiveShots: myInfo.shoot?.effectiveShootTotal ?? 0,
    passSuccessRate: toRate(myInfo.pass?.passSuccess, myInfo.pass?.passTry),
    tackleSuccessRate: toRate(myInfo.defence?.tackleSuccess, myInfo.defence?.tackleTry),
    myGoalScorers: toGoalScorers(myInfo, meta),
    oppGoalScorers: toGoalScorers(oppInfo, meta),
    controller: myInfo.matchDetail?.controller ?? "pad",
  };
}

type MatchSummary = NonNullable<ReturnType<typeof toMatchSummary>>;

/** 매치 요약 목록에서 승/무/패·평균 지표를 집계한다. */
export function summarizeMatches(matches: MatchSummary[]) {
  const wins = matches.filter((m) => m.result === "승").length;
  const losses = matches.filter((m) => m.result === "패").length;
  const draws = matches.length - wins - losses;

  const totalMatches = matches.length;
  const totalGoals = matches.reduce((sum, m) => sum + m.myGoals, 0);
  const totalPossession = matches.reduce((sum, m) => sum + m.possession, 0);

  return {
    totalMatches,
    wins,
    losses,
    draws,
    winRate: totalMatches > 0 ? `${((wins / totalMatches) * 100).toFixed(1)}%` : "0%",
    avgGoals: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0",
    avgPossession: totalMatches > 0 ? `${Math.round(totalPossession / totalMatches)}%` : "50%",
  };
}

// ------------------------------------------------------------------
// 이적 내역
// ------------------------------------------------------------------

/** 넥슨은 spid만 주므로 선수명·시즌·이미지를 메타에서 조인한다. */
export function normalizeTrades(raw: unknown, meta: MetaTables) {
  return (Array.isArray(raw) ? raw : []).map((t: any) => ({
    tradeDate: t?.tradeDate,
    saleSn: t?.saleSn,
    spid: t?.spid,
    grade: t?.grade ?? 0,
    value: t?.value ?? 0,
    name: getPlayerName(meta, t?.spid),
    season: getSeasonName(meta, t?.spid),
    image: getPlayerImageUrl(t?.spid),
  }));
}

// ------------------------------------------------------------------
// 랭커 통계
// ------------------------------------------------------------------

export const MAX_RANKER_STATS_PLAYERS = 30;

export interface RankerStatsQuery {
  id: number;
  po: number;
}

/**
 * ranker-stats의 players 쿼리(JSON 문자열)를 검증한다.
 * 유효하지 않으면 null — 넥슨에 그대로 넘기면 OPENAPI00004로 실패한다.
 */
export function parsePlayersParam(raw: unknown): RankerStatsQuery[] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const players = parsed.slice(0, MAX_RANKER_STATS_PLAYERS).map((p: any) => ({
      id: Number(p?.id),
      po: Number(p?.po),
    }));

    if (players.some((p) => !Number.isFinite(p.id) || !Number.isFinite(p.po))) return null;
    return players;
  } catch {
    return null;
  }
}

/** 랭커 통계 응답에 선수명·시즌·포지션·이미지를 조인한다. */
export function normalizeRankerStats(raw: unknown, meta: MetaTables) {
  return (Array.isArray(raw) ? raw : []).map((s: any) => ({
    spid: s?.spid,
    spPosition: s?.spPosition,
    name: getPlayerName(meta, s?.spid),
    season: getSeasonName(meta, s?.spid),
    position: getPositionName(meta, s?.spPosition),
    image: getPlayerImageUrl(s?.spid),
    status: s?.status,
  }));
}
