import { Router, type Request, type Response } from "express";
import { DIVISION_MAP } from "../lib/divisions";
import {
  NEXON_FCONLINE,
  NEXON_META,
  NEXON_IMAGE_BASE,
  isKeyConfigured,
  resolveApiKey,
  nexonHeaders,
  fetchOuidByNickname,
} from "../lib/nexonClient";
import {
  ensureMetaLoaded,
  getPlayerName,
  getPositionName,
  getSeasonName,
  getPlayerImageUrl,
} from "../lib/meta";

export const nexonRouter = Router();

// 시도/성공 횟수를 성공률(%)로 변환. 시도가 없으면 0.
function toRate(success?: number, tries?: number): number {
  if (!tries || tries <= 0) return 0;
  return Math.round(((success ?? 0) / tries) * 100);
}

// ------------------------------------------------------------------
// NEXON Open API 프록시 라우트 (참고: SPEC.md)
//  1. 계정 정보 / 2. 매치 정보 / 3. 랭커 / 4. 메타데이터 / 5. 이미지 / 6. 거래
// ------------------------------------------------------------------

// 넥슨 API 키 설정 여부 + 엔드포인트 목록
nexonRouter.get("/status", (req: Request, res: Response) => {
  res.json({
    configured: isKeyConfigured(process.env.NEXON_OPENAPI_KEY),
    docsUrl: "https://openapi.nexon.com/ko/game/fconline/?id=2",
    endpoints: [
      { id: 1, name: "계정 정보 (Account Info)", path: "/api/nexon/account" },
      { id: 2, name: "매치 정보 (Match Detail)", path: "/api/nexon/match-detail" },
      { id: 3, name: "랭커 정보 (Ranker Stats)", path: "/api/nexon/rankers" },
      { id: 4, name: "메타데이터 정보 (Metadata JSON)", path: "/api/nexon/metadata" },
      { id: 5, name: "이미지 정보 (Player & Season CDN)", path: "/api/nexon/images" },
    ],
  });
});

// 사용자 입력 넥슨 API 키 유효성 검증
nexonRouter.post("/verify-key", async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    res.status(400).json({ valid: false, error: "API key missing" });
    return;
  }

  try {
    const response = await fetch(
      `${NEXON_FCONLINE}/id?nickname=${encodeURIComponent("김병지")}`,
      { headers: nexonHeaders(apiKey) }
    );

    if (response.ok) {
      res.json({ valid: true });
    } else {
      const errorData = await response.json().catch(() => ({}));
      res.json({ valid: false, error: errorData.error?.message || "Invalid NEXON API key" });
    }
  } catch (err: any) {
    res.json({ valid: false, error: err.message });
  }
});

// 1. 계정 정보 조회 (OUID, level, max division, match list)
async function handleAccount(req: Request, res: Response) {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  const nickname = (req.query.nickname as string) || "두치와뿌꾸";

  try {
    // 1-1 OUID lookup
    const idRes = await fetch(
      `${NEXON_FCONLINE}/id?nickname=${encodeURIComponent(nickname)}`,
      { headers: nexonHeaders(apiKey) }
    );

    if (!idRes.ok) {
      const errJson = await idRes.json().catch(() => ({}));
      res.status(idRes.status).json({
        error: true,
        message: errJson.error?.message || `구단주 '${nickname}' 넥슨 FC Online 검색 결과가 없습니다.`,
      });
      return;
    }

    const idData = await idRes.json();
    const ouid = idData.ouid;

    // 1-2 Basic User Info
    const basicRes = await fetch(`${NEXON_FCONLINE}/user/basic?ouid=${ouid}`, {
      headers: nexonHeaders(apiKey),
    });
    const basicData = basicRes.ok ? await basicRes.json() : { nickname, level: 1 };

    // 1-3 Max Division
    const divRes = await fetch(`${NEXON_FCONLINE}/user/maxdivision?ouid=${ouid}`, {
      headers: nexonHeaders(apiKey),
    });
    let maxDivText = "아마추어 (Amateur)";
    let divCode = 3100;
    let achievementDate = "";

    if (divRes.ok) {
      const divData = await divRes.json();
      const officialDiv = Array.isArray(divData)
        ? divData.find((d: any) => d.matchType === 50) || divData[0]
        : null;
      if (officialDiv) {
        divCode = officialDiv.division;
        maxDivText = DIVISION_MAP[divCode] || `Division ${divCode}`;
        achievementDate = officialDiv.achievementDate || "";
      }
    }

    // 1-4 Match IDs
    const matchRes = await fetch(
      `${NEXON_FCONLINE}/user/match?ouid=${ouid}&matchtype=50&offset=0&limit=10`,
      { headers: nexonHeaders(apiKey) }
    );
    const matchIds = matchRes.ok ? await matchRes.json() : [];

    res.json({
      account: {
        ouid,
        nickname: basicData.nickname || nickname,
        level: basicData.level || 1,
        maxDivision: maxDivText,
        divisionCode: divCode,
        achievementDate,
      },
      recentMatchIds: matchIds,
    });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
}

nexonRouter.get("/account", handleAccount);

// 하위호환 별칭 (구 user-lookup → account)
nexonRouter.get("/user-lookup", (req: Request, res: Response) => {
  req.query.nickname = (req.query.nickname as string) || "두치와뿌꾸";
  return handleAccount(req, res);
});

// 2. 최근 매치 기록 목록 조회 (집계 포함)
nexonRouter.get("/user-matches", async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  let ouid = req.query.ouid as string;
  const nickname = req.query.nickname as string;
  const matchType = (req.query.matchtype as string) || "50";
  const limit = parseInt((req.query.limit as string) || "10", 10);

  try {
    if (!ouid && nickname) {
      ouid = (await fetchOuidByNickname(nickname, apiKey)) || "";
    }

    if (!ouid) {
      return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
    }

    const matchRes = await fetch(
      `${NEXON_FCONLINE}/user/match?ouid=${ouid}&matchtype=${matchType}&offset=0&limit=${limit}`,
      { headers: nexonHeaders(apiKey) }
    );

    if (!matchRes.ok) {
      return res.status(matchRes.status).json({ error: true, message: "넥슨 API에서 매치 기록을 불러오지 못했습니다." });
    }

    const matchIds: string[] = await matchRes.json();

    const matchPromises = matchIds.map(async (mId) => {
      try {
        const mDetailRes = await fetch(`${NEXON_FCONLINE}/match-detail?matchid=${mId}`, {
          headers: nexonHeaders(apiKey),
        });
        if (!mDetailRes.ok) return null;

        const mData = await mDetailRes.json();
        const myInfo = mData.matchInfo?.find((i: any) => i.ouid === ouid) || mData.matchInfo?.[0];
        const oppInfo = mData.matchInfo?.find((i: any) => i.ouid !== ouid) || mData.matchInfo?.[1];

        if (!myInfo) return null;

        const rawResult = myInfo.matchDetail?.matchResult || "무";
        const result = rawResult === "승" || rawResult === "WIN" ? "승" : rawResult === "패" || rawResult === "LOSE" ? "패" : "무";
        const myGoals = myInfo.shoot?.goalTotal ?? 0;
        const oppGoals = oppInfo?.shoot?.goalTotal ?? 0;

        const myGoalScorers = (myInfo.player || [])
          .filter((p: any) => p.status?.goal > 0)
          .map((p: any) => ({ name: `선수 (ID: ${p.spId})`, goals: p.status.goal, rating: p.status.rating || 7.0 }));

        const oppGoalScorers = (oppInfo?.player || [])
          .filter((p: any) => p.status?.goal > 0)
          .map((p: any) => ({ name: `상대선수 (ID: ${p.spId})`, goals: p.status.goal, rating: p.status.rating || 7.0 }));

        const passSuccessRate = myInfo.pass?.passSuccessRate ?? (myInfo.pass?.passTry ? Math.round((myInfo.pass.passSuccess / myInfo.pass.passTry) * 100) : 85);
        const tackleSuccessRate = myInfo.defence?.tackleSuccessRate ?? (myInfo.defence?.tackleTry ? Math.round((myInfo.defence.tackleSuccess / myInfo.defence.tackleTry) * 100) : 70);

        return {
          matchId: mId,
          matchDate: mData.matchDate,
          matchType: mData.matchType === 50 ? "공식경기 1vs1" : `매치타입 (${mData.matchType})`,
          result,
          score: `${myGoals} : ${oppGoals}`,
          myGoals,
          opponentGoals: oppGoals,
          opponentNickname: oppInfo?.nickname || "상대 구단주",
          possession: myInfo.matchDetail?.possession || 50,
          shots: myInfo.shoot?.shootTotal || 0,
          effectiveShots: myInfo.shoot?.effectiveShootTotal || 0,
          passSuccessRate,
          tackleSuccessRate,
          myGoalScorers,
          oppGoalScorers,
          controller: myInfo.matchDetail?.controller || "pad",
        };
      } catch {
        return null;
      }
    });

    const matchResults = (await Promise.all(matchPromises)).filter(Boolean);

    let wins = 0, losses = 0, draws = 0, totalGoals = 0, totalPossession = 0;
    matchResults.forEach((m: any) => {
      if (m.result === "승") wins++;
      else if (m.result === "패") losses++;
      else draws++;
      totalGoals += m.myGoals;
      totalPossession += m.possession;
    });

    const totalMatches = matchResults.length;

    res.json({
      ouid,
      matchType,
      summary: {
        totalMatches,
        wins,
        losses,
        draws,
        winRate: totalMatches > 0 ? `${((wins / totalMatches) * 100).toFixed(1)}%` : "0%",
        avgGoals: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0",
        avgPossession: totalMatches > 0 ? `${Math.round(totalPossession / totalMatches)}%` : "50%",
      },
      matches: matchResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// 2. 실시간 매치 정보 조회 (최근 경기 시각 기반 추정 — 공식 엔드포인트 아님)
nexonRouter.get("/live-match", async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  const nickname = (req.query.nickname as string) || "";
  let ouid = (req.query.ouid as string) || "";

  try {
    if (!ouid && nickname) {
      ouid = (await fetchOuidByNickname(nickname, apiKey)) || "";
    }

    if (!ouid) {
      return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
    }

    const matchRes = await fetch(
      `${NEXON_FCONLINE}/user/match?ouid=${ouid}&matchtype=50&offset=0&limit=1`,
      { headers: nexonHeaders(apiKey) }
    );

    if (!matchRes.ok) {
      return res.json({ isPlaying: false, message: "진행 중인 실시간 경기가 감지되지 않았습니다." });
    }

    const matchIds: string[] = await matchRes.json();
    if (!matchIds || matchIds.length === 0) {
      return res.json({ isPlaying: false, message: "최근 경기 내역이 없습니다." });
    }

    const mDetailRes = await fetch(`${NEXON_FCONLINE}/match-detail?matchid=${matchIds[0]}`, {
      headers: nexonHeaders(apiKey),
    });

    if (!mDetailRes.ok) {
      return res.json({ isPlaying: false, message: "매치 상세 정보를 불러올 수 없습니다." });
    }

    const mData = await mDetailRes.json();
    const matchTime = new Date(mData.matchDate).getTime();
    const now = Date.now();
    const diffMinutes = (now - matchTime) / (1000 * 60);

    if (diffMinutes <= 20) {
      const myInfo = mData.matchInfo?.find((i: any) => i.ouid === ouid) || mData.matchInfo?.[0];
      const oppInfo = mData.matchInfo?.find((i: any) => i.ouid !== ouid) || mData.matchInfo?.[1];

      return res.json({
        isPlaying: true,
        liveMatch: {
          matchId: matchIds[0],
          matchType: mData.matchType === 50 ? "공식경기 1vs1" : "클래식 매치",
          currentMinute: Math.min(90, Math.floor(diffMinutes * 5)),
          period: diffMinutes > 8 ? "후반전" : "전반전",
          stadium: "공식 경기장",
          myTeam: {
            ouid,
            nickname: myInfo?.nickname || nickname || "내 구단",
            score: myInfo?.shoot?.goalTotal ?? 0,
            possession: myInfo?.matchDetail?.possession || 50,
            shots: myInfo?.shoot?.shootTotal || 0,
            effectiveShots: myInfo?.shoot?.effectiveShootTotal || 0,
            color: "#B9F600",
            scorers: (myInfo?.player || []).filter((p: any) => p.status?.goal > 0).map((p: any) => ({ minute: 20, name: `선수(${p.spId})` })),
          },
          opponentTeam: {
            ouid: oppInfo?.ouid || "",
            nickname: oppInfo?.nickname || "상대 구단주",
            score: oppInfo?.shoot?.goalTotal ?? 0,
            possession: oppInfo?.matchDetail?.possession || 50,
            shots: oppInfo?.shoot?.shootTotal || 0,
            effectiveShots: oppInfo?.shoot?.effectiveShootTotal || 0,
            color: "#38BDF8",
            scorers: (oppInfo?.player || []).filter((p: any) => p.status?.goal > 0).map((p: any) => ({ minute: 40, name: `상대선수(${p.spId})` })),
          },
          recentEvents: [
            { minute: Math.min(90, Math.floor(diffMinutes * 5)), type: "STATUS", player: "경기 진행 중", team: "MY", text: "실시간 경기 데이터 연동 중..." },
          ],
        },
      });
    }

    return res.json({ isPlaying: false, message: "현재 진행 중인 경기가 없습니다." });
  } catch (err: any) {
    res.json({ isPlaying: false, message: err.message });
  }
});

// 2. 매치 상세 정보 조회
nexonRouter.get("/match-detail", async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  const matchId = req.query.matchid as string;
  if (!matchId) {
    return res.status(400).json({ error: true, message: "matchid 파라미터가 필요합니다." });
  }

  try {
    const response = await fetch(`${NEXON_FCONLINE}/match-detail?matchid=${matchId}`, {
      headers: nexonHeaders(apiKey),
    });

    if (!response.ok) {
      res.status(response.status).json({ error: true, message: "매치 정보를 찾을 수 없습니다." });
      return;
    }

    const mData = await response.json();
    const meta = await ensureMetaLoaded();

    // 넥슨 원본(matchInfo[])을 화면이 쓰는 teams[] 뷰 모델로 정규화한다.
    // 선수명·포지션·시즌은 정적 메타에서 조인한다(원본은 spId/spPosition만 제공).
    const teams = (mData.matchInfo ?? []).map((info: any) => ({
      ouid: info.ouid,
      nickname: info.nickname,
      result: info.matchDetail?.matchResult ?? "무",
      score: info.shoot?.goalTotal ?? 0,
      possession: info.matchDetail?.possession ?? 50,
      totalShots: info.shoot?.shootTotal ?? 0,
      effectiveShots: info.shoot?.effectiveShootTotal ?? 0,
      passSuccessRate: toRate(info.pass?.passSuccess, info.pass?.passTry),
      tackleSuccessRate: toRate(info.defence?.tackleSuccess, info.defence?.tackleTry),
      controller: info.matchDetail?.controller ?? "pad",
      averageRating: info.matchDetail?.averageRating ?? 0,
      squad: (info.player ?? []).map((p: any) => ({
        spId: p.spId,
        name: getPlayerName(meta, p.spId),
        season: getSeasonName(meta, p.spId),
        position: getPositionName(meta, p.spPosition),
        spPosition: p.spPosition,
        grade: p.spGrade ?? 0,
        goals: p.status?.goal ?? 0,
        assists: p.status?.assist ?? 0,
        rating: p.status?.spRating ?? 0,
        image: getPlayerImageUrl(p.spId),
      })),
    }));

    res.json({
      matchId: mData.matchId,
      matchDate: mData.matchDate,
      matchType: mData.matchType,
      teams,
    });
  } catch (err: any) {
    console.error("[nexon] match-detail 처리 실패:", err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

// 3. 랭커 정보 조회 (SPEC: /fconline/v1/ranker-stats — TOP 10,000 랭커 사용 선수 20경기 통계)
nexonRouter.get("/rankers", async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  const matchType = (req.query.matchtype as string) || "50";

  try {
    const response = await fetch(
      `${NEXON_FCONLINE}/ranker-stats?matchtype=${matchType}`,
      { headers: nexonHeaders(apiKey) }
    );

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      console.error("[nexon] ranker-stats 실패", response.status, detail);
      res.status(response.status).json({
        error: true,
        message: "넥슨 API 랭커 정보 조회에 실패했습니다.",
        detail: detail?.error ?? null,
      });
      return;
    }

    const rankerData = await response.json();
    res.json({ matchType, rankers: rankerData });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// 4. 메타데이터 정보 조회 (matchtype/seasonid/spposition/division/spid)
nexonRouter.get("/metadata", async (req: Request, res: Response) => {
  const type = (req.query.type as string) || "matchtype";

  const urlMap: Record<string, string> = {
    matchtype: `${NEXON_META}/matchtype.json`,
    seasonid: `${NEXON_META}/seasonid.json`,
    spposition: `${NEXON_META}/spposition.json`,
    division: `${NEXON_META}/division.json`,
    "division-volta": `${NEXON_META}/division-volta.json`,
    spid: `${NEXON_META}/spid.json`,
  };

  const targetUrl = urlMap[type];

  if (!targetUrl) {
    res.status(400).json({ error: true, message: "Invalid metadata type" });
    return;
  }

  try {
    const metaRes = await fetch(targetUrl);
    if (metaRes.ok) {
      const metaJson = await metaRes.json();
      // spid는 데이터가 크므로 앞 100개만 반환
      if (type === "spid" && Array.isArray(metaJson)) {
        res.json({ type, count: metaJson.length, data: metaJson.slice(0, 100) });
        return;
      }
      res.json({ type, data: metaJson });
    } else {
      res.status(metaRes.status).json({ error: true, message: "넥슨 static 메타데이터 조회 실패" });
    }
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// 5. 이미지 정보 조회 (선수/시즌 CDN URL 조합)
nexonRouter.get("/images", (req: Request, res: Response) => {
  const spId = req.query.spid ? String(req.query.spid) : "250102143";
  const seasonId = req.query.seasonid ? String(req.query.seasonid) : "101";

  res.json({
    spId,
    seasonId,
    playerPortraitUrl: `${NEXON_IMAGE_BASE}/players/p${spId}.png`,
    playerActionShotUrl: `${NEXON_IMAGE_BASE}/playersAction/p${spId}.png`,
    seasonBadgeUrl: `${NEXON_IMAGE_BASE}/season/${seasonId}.png`,
  });
});

// 6. 이적시장 거래 내역 조회 (buy/sell)
nexonRouter.get("/trade", async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req, res);
  if (!apiKey) return;

  let ouid = req.query.ouid as string;
  const nickname = req.query.nickname as string;
  const tradeType = (req.query.tradetype as string) || "buy";

  try {
    if (!ouid && nickname) {
      ouid = (await fetchOuidByNickname(nickname, apiKey)) || "";
    }

    if (!ouid) {
      return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
    }

    const response = await fetch(
      `${NEXON_FCONLINE}/user/trade?ouid=${ouid}&tradetype=${tradeType}&offset=0&limit=20`,
      { headers: nexonHeaders(apiKey) }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: true, message: "이적시장 거래 내역 조회 실패" });
    }

    const rawTrades = await response.json();
    res.json({
      tradeType,
      totalCount: Array.isArray(rawTrades) ? rawTrades.length : 0,
      trades: rawTrades,
    });
  } catch (err: any) {
    res.status(500).json({ error: true, message: err.message });
  }
});
