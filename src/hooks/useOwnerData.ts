import { useCallback, useEffect, useState } from "react";
import {
  getAccount,
  getLiveMatch,
  getMatchDetail,
  getTrades,
  getUserMatches,
} from "../lib/api/nexon";
import type {
  AccountInfo,
  LiveMatch,
  MatchDetailResponse,
  MatchSummary,
  MatchTeam,
  MatchesSummary,
  TradeRecord,
} from "../lib/api/types";
import { getLastOwner, setLastOwner } from "../lib/storage";

const MATCH_HISTORY_LIMIT = 10;

export type TradeType = "buy" | "sell";

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export interface OwnerData {
  nickname: string;
  account: AccountInfo | null;
  accountLoading: boolean;
  accountError: string | null;
  /** 계정 조회 시 함께 내려오는 최근 매치 ID 목록 */
  recentMatchIds: string[];
  searchOwner: (nickname: string) => void;

  matchType: string;
  setMatchType: (matchType: string) => void;
  matchesSummary: MatchesSummary | null;
  matches: MatchSummary[];
  matchesLoading: boolean;
  matchesError: string | null;

  liveMatch: LiveMatch | null;
  liveLoading: boolean;
  refreshLive: () => void;

  selectedMatchId: string | null;
  selectMatch: (matchId: string) => void;
  matchDetail: MatchDetailResponse | null;
  matchDetailLoading: boolean;
  matchDetailError: string | null;
  /** 선택된 매치에서 조회한 구단주 본인의 팀 (없으면 첫 번째 팀) */
  myTeam: MatchTeam | null;
  opponentTeam: MatchTeam | null;

  tradeType: TradeType;
  setTradeType: (tradeType: TradeType) => void;
  trades: TradeRecord[];
  tradesLoading: boolean;
  tradesError: string | null;
}

/**
 * 구단주 중심 데이터(계정 · 매치 · 실시간 · 이적)를 한곳에서 관리한다.
 * 모든 호출은 src/lib/api를 경유하며, 넥슨 키는 client가 헤더에 주입한다.
 *
 * @param apiKeyRevision 저장된 API 키가 바뀔 때 재조회를 트리거하기 위한 값
 */
export function useOwnerData(apiKeyRevision: string): OwnerData {
  // 마지막으로 조회한 구단주를 이어서 보여준다. 처음 방문이면 빈 값 → 검색 안내 화면.
  const [nickname, setNickname] = useState(() => getLastOwner());

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [recentMatchIds, setRecentMatchIds] = useState<string[]>([]);

  const [matchType, setMatchTypeState] = useState("50");
  const [matchesSummary, setMatchesSummary] = useState<MatchesSummary | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveNonce, setLiveNonce] = useState(0);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetailResponse | null>(null);
  const [matchDetailLoading, setMatchDetailLoading] = useState(false);
  const [matchDetailError, setMatchDetailError] = useState<string | null>(null);

  const [tradeType, setTradeTypeState] = useState<TradeType>("buy");
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);

  const ouid = account?.ouid ?? null;

  // 구단주 계정 조회 — nickname 또는 API 키가 바뀌면 다시 조회한다.
  useEffect(() => {
    if (!nickname.trim()) return;

    let cancelled = false;
    setAccountLoading(true);
    setAccountError(null);

    getAccount(nickname)
      .then((data) => {
        if (cancelled) return;
        setAccount(data.account);
        setRecentMatchIds(data.recentMatchIds ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAccount(null);
        setRecentMatchIds([]);
        setAccountError(toMessage(err, "구단주 정보를 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setAccountLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nickname, apiKeyRevision]);

  // 매치 기록 집계 — 구단주(ouid)와 매치 타입에 종속.
  useEffect(() => {
    if (!ouid) {
      setMatches([]);
      setMatchesSummary(null);
      return;
    }

    let cancelled = false;
    setMatchesLoading(true);
    setMatchesError(null);

    getUserMatches({ ouid, matchtype: matchType, limit: MATCH_HISTORY_LIMIT })
      .then((data) => {
        if (cancelled) return;
        setMatchesSummary(data.summary ?? null);
        setMatches(data.matches ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMatches([]);
        setMatchesSummary(null);
        setMatchesError(toMessage(err, "매치 기록을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setMatchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ouid, matchType]);

  // 실시간(최근 20분 내) 경기 감지
  useEffect(() => {
    if (!ouid) {
      setLiveMatch(null);
      return;
    }

    let cancelled = false;
    setLiveLoading(true);

    getLiveMatch({ ouid })
      .then((data) => {
        if (!cancelled) setLiveMatch(data.isPlaying ? data.liveMatch ?? null : null);
      })
      .catch(() => {
        if (!cancelled) setLiveMatch(null);
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ouid, liveNonce]);

  // 구단주가 바뀌면 첫 매치를 기본 선택한다.
  useEffect(() => {
    setSelectedMatchId(recentMatchIds[0] ?? null);
  }, [recentMatchIds]);

  // 매치 상세 — 선택된 매치 ID에 종속.
  useEffect(() => {
    if (!selectedMatchId) {
      setMatchDetail(null);
      return;
    }

    let cancelled = false;
    setMatchDetailLoading(true);
    setMatchDetailError(null);

    getMatchDetail(selectedMatchId)
      .then((data) => {
        if (!cancelled) setMatchDetail(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMatchDetail(null);
        setMatchDetailError(toMessage(err, "매치 상세를 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setMatchDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMatchId]);

  // 이적 거래 내역 — 구단주와 거래 구분에 종속.
  useEffect(() => {
    if (!ouid) {
      setTrades([]);
      return;
    }

    let cancelled = false;
    setTradesLoading(true);
    setTradesError(null);

    getTrades({ ouid, tradetype: tradeType })
      .then((data) => {
        if (!cancelled) setTrades(data.trades ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTrades([]);
        setTradesError(toMessage(err, "거래 내역을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setTradesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ouid, tradeType]);

  const searchOwner = useCallback((next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    setLastOwner(trimmed);
  }, []);

  // 매치 상세의 teams[] 순서는 넥슨 원본 순서라 내 팀이 앞이라는 보장이 없다.
  const teams = matchDetail?.teams ?? [];
  const myTeam = teams.find((t) => t.ouid === ouid) ?? teams[0] ?? null;
  const opponentTeam = teams.find((t) => t !== myTeam) ?? null;

  const refreshLive = useCallback(() => setLiveNonce((n) => n + 1), []);
  const setMatchType = useCallback((next: string) => setMatchTypeState(next), []);
  const setTradeType = useCallback((next: TradeType) => setTradeTypeState(next), []);
  const selectMatch = useCallback((matchId: string) => setSelectedMatchId(matchId), []);

  return {
    nickname,
    account,
    accountLoading,
    accountError,
    recentMatchIds,
    searchOwner,
    matchType,
    setMatchType,
    matchesSummary,
    matches,
    matchesLoading,
    matchesError,
    liveMatch,
    liveLoading,
    refreshLive,
    selectedMatchId,
    selectMatch,
    matchDetail,
    matchDetailLoading,
    matchDetailError,
    myTeam,
    opponentTeam,
    tradeType,
    setTradeType,
    trades,
    tradesLoading,
    tradesError,
  };
}
