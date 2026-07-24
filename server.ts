import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const DIVISION_MAP: Record<number, string> = {
  800: "슈퍼챔피언스 (Super Champions)",
  900: "챔피언스 (Champions)",
  1100: "챌린저 1 (Challenger 1)",
  1200: "챌린저 2 (Challenger 2)",
  1300: "챌린저 3 (Challenger 3)",
  2000: "월드클래스 1 (World Class 1)",
  2100: "월드클래스 2 (World Class 2)",
  2200: "월드클래스 3 (World Class 3)",
  2300: "프로 1 (Professional 1)",
  2400: "프로 2 (Professional 2)",
  2500: "프로 3 (Professional 3)",
  2600: "세미프로 1 (Semi-Pro 1)",
  2700: "세미프로 2 (Semi-Pro 2)",
  2800: "세미프로 3 (Semi-Pro 3)",
  2900: "아마추어 1 (Amateur 1)",
  3000: "아마추어 2 (Amateur 2)",
  3100: "아마추어 3 (Amateur 3)",
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ------------------------------------------------------------------
  // NEXON Open API Integration Routes for FC Online
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // NEXON Open API Integration Routes for FC Online
  // 1. Account Info (계정 정보)
  // 2. Match Info (매치 정보)
  // 3. Ranker Info (랭커 정보)
  // 4. Metadata Info (메타데이터)
  // 5. Image Assets (이미지 정보)
  // ------------------------------------------------------------------

  // Check NEXON API status
  app.get("/api/nexon/status", (req, res) => {
    const key = process.env.NEXON_OPENAPI_KEY;
    const isConfigured = Boolean(key && key !== "test_nxapi_key_here" && key.trim().length > 0);
    res.json({
      configured: isConfigured,
      docsUrl: "https://openapi.nexon.com/ko/game/fconline/?id=2",
      endpoints: [
        { id: 1, name: "계정 정보 (Account Info)", path: "/api/nexon/account" },
        { id: 2, name: "매치 정보 (Match Detail)", path: "/api/nexon/match-detail" },
        { id: 3, name: "랭커 정보 (Ranker Top 100)", path: "/api/nexon/rankers" },
        { id: 4, name: "메타데이터 정보 (Metadata JSON)", path: "/api/nexon/metadata" },
        { id: 5, name: "이미지 정보 (Player & Season CDN)", path: "/api/nexon/images" },
      ]
    });
  });

  // Verify custom NEXON API key
  app.post("/api/nexon/verify-key", async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ valid: false, error: "API key missing" });
      return;
    }

    try {
      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/id?nickname=${encodeURIComponent("김병지")}`,
        {
          headers: {
            "x-nxopen-api-key": apiKey,
          },
        }
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

  // Helper function to validate NEXON API Key availability
  const checkApiKey = (req: express.Request, res: express.Response): string | null => {
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here" || !apiKey.trim()) {
      res.status(400).json({
        error: true,
        message: "NEXON_OPENAPI_KEY 환경변수가 설정되지 않았습니다. .env 파일에 NEXON_OPENAPI_KEY를 발급받아 입력해주세요. (https://openapi.nexon.com)"
      });
      return null;
    }
    return apiKey;
  };

  // 1. 계정 정보 조회 (Account Info: OUID, level, max division, match list)
  app.get("/api/nexon/account", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    const nickname = (req.query.nickname as string) || "두치와뿌꾸";

    try {
      // 1-1 OUID lookup
      const idRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/id?nickname=${encodeURIComponent(nickname)}`,
        { headers: { "x-nxopen-api-key": apiKey } }
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
      const basicRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/basic?ouid=${ouid}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );
      const basicData = basicRes.ok ? await basicRes.json() : { nickname, level: 1 };

      // 1-3 Max Division
      const divRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/maxdivision?ouid=${ouid}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );
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
        `https://open.api.nexon.com/fconline/v1/user/match?ouid=${ouid}&matchtype=50&offset=0&limit=10`,
        { headers: { "x-nxopen-api-key": apiKey } }
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
  });

  // 2. 최근 매치 기록 목록 조회 (User Recent Matches History Endpoint)
  app.get("/api/nexon/user-matches", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    let ouid = req.query.ouid as string;
    const nickname = req.query.nickname as string;
    const matchType = (req.query.matchtype as string) || "50";
    const limit = parseInt((req.query.limit as string) || "10", 10);

    try {
      if (!ouid && nickname) {
        const idRes = await fetch(
          `https://open.api.nexon.com/fconline/v1/id?nickname=${encodeURIComponent(nickname)}`,
          { headers: { "x-nxopen-api-key": apiKey } }
        );
        if (idRes.ok) {
          const idData = await idRes.json();
          ouid = idData.ouid;
        }
      }

      if (!ouid) {
        return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
      }

      const matchRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/match?ouid=${ouid}&matchtype=${matchType}&offset=0&limit=${limit}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!matchRes.ok) {
        return res.status(matchRes.status).json({ error: true, message: "넥슨 API에서 매치 기록을 불러오지 못했습니다." });
      }

      const matchIds: string[] = await matchRes.json();

      const matchPromises = matchIds.map(async (mId) => {
        try {
          const mDetailRes = await fetch(
            `https://open.api.nexon.com/fconline/v1/match-detail?matchid=${mId}`,
            { headers: { "x-nxopen-api-key": apiKey } }
          );
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

  // 2. 실시간 매치 정보 조회 (Live Match Endpoint)
  app.get("/api/nexon/live-match", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    let nickname = (req.query.nickname as string) || "";
    let ouid = (req.query.ouid as string) || "";

    try {
      if (!ouid && nickname) {
        const idRes = await fetch(
          `https://open.api.nexon.com/fconline/v1/id?nickname=${encodeURIComponent(nickname)}`,
          { headers: { "x-nxopen-api-key": apiKey } }
        );
        if (idRes.ok) {
          const idData = await idRes.json();
          ouid = idData.ouid;
        }
      }

      if (!ouid) {
        return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
      }

      const matchRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/match?ouid=${ouid}&matchtype=50&offset=0&limit=1`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!matchRes.ok) {
        return res.json({ isPlaying: false, message: "진행 중인 실시간 경기가 감지되지 않았습니다." });
      }

      const matchIds: string[] = await matchRes.json();
      if (!matchIds || matchIds.length === 0) {
        return res.json({ isPlaying: false, message: "최근 경기 내역이 없습니다." });
      }

      const mDetailRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/match-detail?matchid=${matchIds[0]}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

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
              scorers: (myInfo?.player || []).filter((p: any) => p.status?.goal > 0).map((p: any) => ({ minute: 20, name: `선수(${p.spId})` }))
            },
            opponentTeam: {
              ouid: oppInfo?.ouid || "",
              nickname: oppInfo?.nickname || "상대 구단주",
              score: oppInfo?.shoot?.goalTotal ?? 0,
              possession: oppInfo?.matchDetail?.possession || 50,
              shots: oppInfo?.shoot?.shootTotal || 0,
              effectiveShots: oppInfo?.shoot?.effectiveShootTotal || 0,
              color: "#38BDF8",
              scorers: (oppInfo?.player || []).filter((p: any) => p.status?.goal > 0).map((p: any) => ({ minute: 40, name: `상대선수(${p.spId})` }))
            },
            recentEvents: [
              { minute: Math.min(90, Math.floor(diffMinutes * 5)), type: "STATUS", player: "경기 진행 중", team: "MY", text: "실시간 경기 데이터 연동 중..." }
            ]
          }
        });
      }

      return res.json({
        isPlaying: false,
        message: "현재 진행 중인 경기가 없습니다."
      });
    } catch (err: any) {
      res.json({ isPlaying: false, message: err.message });
    }
  });

  // 3. 매치 상세 정보 조회 (Match Details Endpoint)
  app.get("/api/nexon/match-detail", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    const matchId = (req.query.matchid as string);
    if (!matchId) {
      return res.status(400).json({ error: true, message: "matchid 파라미터가 필요합니다." });
    }

    try {
      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/match-detail?matchid=${matchId}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!response.ok) {
        res.status(response.status).json({ error: true, message: "매치 정보를 찾을 수 없습니다." });
        return;
      }

      const mData = await response.json();
      res.json({
        matchId: mData.matchId,
        matchDate: mData.matchDate,
        matchType: mData.matchType,
        matchInfo: mData.matchInfo,
      });
    } catch (err: any) {
      res.status(500).json({ error: true, message: err.message });
    }
  });

  // 3. 랭커 정보 조회 (Ranker Top 100 Info Endpoint)
  app.get("/api/nexon/rankers", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    const matchType = (req.query.matchtype as string) || "50";

    try {
      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/ranker?matchtype=${matchType}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!response.ok) {
        res.status(response.status).json({ error: true, message: "넥슨 API 랭커 정보 조회에 실패했습니다." });
        return;
      }

      const rankerData = await response.json();
      res.json({
        matchType,
        rankers: rankerData,
      });
    } catch (err: any) {
      res.status(500).json({ error: true, message: err.message });
    }
  });

  // 4. 메타데이터 정보 조회 (Metadata Endpoint: MatchType, Season, SPID, Position)
  app.get("/api/nexon/metadata", async (req, res) => {
    const type = (req.query.type as string) || "matchtype";

    const urlMap: Record<string, string> = {
      matchtype: "https://open.api.nexon.com/static/fconline/meta/matchtype.json",
      seasonid: "https://open.api.nexon.com/static/fconline/meta/seasonid.json",
      spposition: "https://open.api.nexon.com/static/fconline/meta/spposition.json",
      division: "https://open.api.nexon.com/static/fconline/meta/division.json",
      spid: "https://open.api.nexon.com/static/fconline/meta/spid.json",
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
        // If requesting spid, limit first 100 items for bandwidth speed
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

  // 5. 이미지 정보 조회 (Image CDN & Asset Endpoint)
  app.get("/api/nexon/images", (req, res) => {
    const spId = req.query.spid ? String(req.query.spid) : "250102143";
    const seasonId = req.query.seasonid ? String(req.query.seasonid) : "101";

    res.json({
      spId,
      seasonId,
      playerPortraitUrl: `https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p${spId}.png`,
      playerActionShotUrl: `https://fconline.gcdn.nexon.com/live/externalAssets/common/playersAction/p${spId}.png`,
      seasonBadgeUrl: `https://fconline.gcdn.nexon.com/live/externalAssets/common/season/${seasonId}.png`,
    });
  });

  // 6. 이적시장 거래 내역 조회 (Trade History Endpoint: Buy/Sell Records)
  app.get("/api/nexon/trade", async (req, res) => {
    const apiKey = checkApiKey(req, res);
    if (!apiKey) return;

    let ouid = req.query.ouid as string;
    const nickname = req.query.nickname as string;
    const tradeType = (req.query.tradetype as string) || "buy"; // "buy" or "sell"

    try {
      if (!ouid && nickname) {
        const idRes = await fetch(
          `https://open.api.nexon.com/fconline/v1/id?nickname=${encodeURIComponent(nickname)}`,
          { headers: { "x-nxopen-api-key": apiKey } }
        );
        if (idRes.ok) {
          const idData = await idRes.json();
          ouid = idData.ouid;
        }
      }

      if (!ouid) {
        return res.status(400).json({ error: true, message: "OUID 또는 유효한 구단주명이 필요합니다." });
      }

      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/trade?ouid=${ouid}&tradetype=${tradeType}&offset=0&limit=20`,
        { headers: { "x-nxopen-api-key": apiKey } }
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

  // Backward compatibility alias for user lookup
  app.get("/api/nexon/user-lookup", async (req, res) => {
    req.url = `/api/nexon/account?nickname=${encodeURIComponent((req.query.nickname as string) || "두치와뿌꾸")}`;
    (app as any).handle(req, res);
  });


  // AI Squad Assistant Proxy Endpoint using Gemini
  app.post("/api/ai-squad-assistant", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.json({
          advice: `For FC Online, prioritize players with 5/5 Weak Foot like Son Heung-min (LN) or Zinedine Zidane (ICON). Maintain total salary under 230 BP for official ranked matches!`,
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert FC Online (FIFA Online 4) tactical advisor and sports analytics expert for FC Lens. Give a concise, professional, data-backed 2-3 sentence recommendation in response to the user query:\n\nQuery: "${prompt}"\n\nFocus on player ratings (OVR), salary cap (230 limit), weak foot (5/5), and market BP prices.`,
              },
            ],
          },
        ],
      });

      const text = response.text || "Focus on 5/5 weak foot strikers and high-paced wingers to dominate the meta!";
      res.json({ advice: text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.json({
        advice: "We recommend prioritizing players with 5/5 weak foot ratings and 24TY season cards for optimal stat efficiency.",
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FC Lens Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

