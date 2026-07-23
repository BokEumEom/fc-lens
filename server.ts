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
    res.json({
      configured: Boolean(key && key !== "test_nxapi_key_here"),
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

  // 1. 계정 정보 조회 (Account Info: OUID, level, max division, match list)
  app.get("/api/nexon/account", async (req, res) => {
    const nickname = (req.query.nickname as string) || "두치와뿌꾸";
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here") {
      return res.json({
        isDemoData: true,
        message: "No live NEXON API key provided. Returning cached FC Online account data.",
        account: {
          ouid: "demo_ouid_fconline_1029",
          nickname: nickname,
          level: 284,
          maxDivision: "슈퍼챔피언스 (Super Champions)",
          divisionCode: 800,
          achievementDate: "2024-04-12T14:30:00",
          matchTypeCounts: {
            official1v1: 1420,
            officialVolta: 380,
            customMatch: 120,
          }
        },
        recentMatchIds: ["m_001", "m_002", "m_003", "m_004", "m_005"],
      });
    }

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
          message: errJson.error?.message || `User '${nickname}' not found in NEXON FC Online.`,
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
        isDemoData: false,
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
    let ouid = req.query.ouid as string;
    const nickname = req.query.nickname as string;
    const matchType = (req.query.matchtype as string) || "50";
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here") {
      return res.json({
        isDemoData: true,
        ouid: ouid || "demo_ouid_fconline_1029",
        matchType,
        summary: {
          totalMatches: 8,
          wins: 5,
          draws: 1,
          losses: 2,
          winRate: "62.5%",
          avgGoals: "2.4",
          avgPossession: "56%"
        },
        matches: [
          {
            matchId: "m_001",
            matchDate: new Date(Date.now() - 3600000 * 2).toISOString(),
            matchType: "공식경기 1vs1",
            result: "승",
            score: "3 : 1",
            myGoals: 3,
            opponentGoals: 1,
            opponentNickname: "LensMaster_FC",
            possession: 58,
            shots: 9,
            effectiveShots: 6,
            passSuccessRate: 88,
            tackleSuccessRate: 75,
            mvpPlayer: "Kylian Mbappé (9.2점)",
            controller: "pad",
            stadium: "Stade Bollaert-Delelis",
            myGoalScorers: [
              { name: "Kylian Mbappé", goals: 2 },
              { name: "Son Heung-min", goals: 1 }
            ],
            oppGoalScorers: [
              { name: "Erling Haaland", goals: 1 }
            ]
          },
          {
            matchId: "m_002",
            matchDate: new Date(Date.now() - 3600000 * 5).toISOString(),
            matchType: "공식경기 1vs1",
            result: "무",
            score: "2 : 2",
            myGoals: 2,
            opponentGoals: 2,
            opponentNickname: "RealMadrid_KR",
            possession: 51,
            shots: 7,
            effectiveShots: 4,
            passSuccessRate: 85,
            tackleSuccessRate: 70,
            mvpPlayer: "Vinícius Jr. (8.9점)",
            controller: "pad",
            stadium: "Santiago Bernabéu",
            myGoalScorers: [
              { name: "Jude Bellingham", goals: 1 },
              { name: "Kylian Mbappé", goals: 1 }
            ],
            oppGoalScorers: [
              { name: "Vinícius Jr.", goals: 2 }
            ]
          },
          {
            matchId: "m_003",
            matchDate: new Date(Date.now() - 3600000 * 18).toISOString(),
            matchType: "공식경기 1vs1",
            result: "패",
            score: "1 : 2",
            myGoals: 1,
            opponentGoals: 2,
            opponentNickname: "Sonny7_Cap",
            possession: 46,
            shots: 5,
            effectiveShots: 3,
            passSuccessRate: 79,
            tackleSuccessRate: 65,
            mvpPlayer: "Harry Kane (8.7점)",
            controller: "keyboard",
            stadium: "Tottenham Hotspur Stadium",
            myGoalScorers: [
              { name: "Son Heung-min", goals: 1 }
            ],
            oppGoalScorers: [
              { name: "Harry Kane", goals: 2 }
            ]
          },
          {
            matchId: "m_004",
            matchDate: new Date(Date.now() - 3600000 * 24).toISOString(),
            matchType: "공식경기 1vs1",
            result: "승",
            score: "4 : 0",
            myGoals: 4,
            opponentGoals: 0,
            opponentNickname: "Gallardo_ST",
            possession: 64,
            shots: 12,
            effectiveShots: 9,
            passSuccessRate: 92,
            tackleSuccessRate: 82,
            mvpPlayer: "Kylian Mbappé (10.0점 MOM)",
            controller: "pad",
            stadium: "Etihad Stadium",
            myGoalScorers: [
              { name: "Kylian Mbappé", goals: 3 },
              { name: "Jude Bellingham", goals: 1 }
            ],
            oppGoalScorers: []
          },
          {
            matchId: "m_005",
            matchDate: new Date(Date.now() - 3600000 * 32).toISOString(),
            matchType: "공식경기 1vs1",
            result: "승",
            score: "2 : 1",
            myGoals: 2,
            opponentGoals: 1,
            opponentNickname: "T1_Faker_Fan",
            possession: 55,
            shots: 8,
            effectiveShots: 5,
            passSuccessRate: 87,
            tackleSuccessRate: 74,
            mvpPlayer: "Son Heung-min (9.1점)",
            controller: "pad",
            stadium: "Allianz Arena",
            myGoalScorers: [
              { name: "Son Heung-min", goals: 2 }
            ],
            oppGoalScorers: [
              { name: "Cristiano Ronaldo", goals: 1 }
            ]
          },
          {
            matchId: "m_006",
            matchDate: new Date(Date.now() - 3600000 * 48).toISOString(),
            matchType: "공식경기 1vs1",
            result: "승",
            score: "3 : 0",
            myGoals: 3,
            opponentGoals: 0,
            opponentNickname: "Chelsea_Blue_Vibe",
            possession: 60,
            shots: 10,
            effectiveShots: 7,
            passSuccessRate: 90,
            tackleSuccessRate: 80,
            mvpPlayer: "Rodri (8.9점)",
            controller: "pad",
            stadium: "Stamford Bridge",
            myGoalScorers: [
              { name: "Kylian Mbappé", goals: 1 },
              { name: "Rodri", goals: 1 },
              { name: "Jude Bellingham", goals: 1 }
            ],
            oppGoalScorers: []
          },
          {
            matchId: "m_007",
            matchDate: new Date(Date.now() - 3600000 * 55).toISOString(),
            matchType: "공식경기 1vs1",
            result: "패",
            score: "0 : 1",
            myGoals: 0,
            opponentGoals: 1,
            opponentNickname: "Milan_Legend_10",
            possession: 48,
            shots: 6,
            effectiveShots: 2,
            passSuccessRate: 81,
            tackleSuccessRate: 68,
            mvpPlayer: "Kaká (8.5점)",
            controller: "keyboard",
            stadium: "San Siro",
            myGoalScorers: [],
            oppGoalScorers: [
              { name: "Kaká", goals: 1 }
            ]
          },
          {
            matchId: "m_008",
            matchDate: new Date(Date.now() - 3600000 * 70).toISOString(),
            matchType: "공식경기 1vs1",
            result: "승",
            score: "4 : 2",
            myGoals: 4,
            opponentGoals: 2,
            opponentNickname: "Paris_RMC_King",
            possession: 57,
            shots: 11,
            effectiveShots: 8,
            passSuccessRate: 86,
            tackleSuccessRate: 71,
            mvpPlayer: "Son Heung-min (9.4점)",
            controller: "pad",
            stadium: "Parc des Princes",
            myGoalScorers: [
              { name: "Kylian Mbappé", goals: 2 },
              { name: "Son Heung-min", goals: 2 }
            ],
            oppGoalScorers: [
              { name: "Ousmane Dembélé", goals: 2 }
            ]
          }
        ]
      });
    }

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
        return res.status(400).json({ error: true, message: "OUID or valid nickname required" });
      }

      const matchRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/match?ouid=${ouid}&matchtype=${matchType}&offset=0&limit=${limit}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!matchRes.ok) {
        return res.status(matchRes.status).json({ error: true, message: "Failed to fetch user matches from NEXON API" });
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
        isDemoData: false,
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

  // 2. 매치 정보 조회 (Match Details Endpoint)
  app.get("/api/nexon/live-match", async (req, res) => {
    let nickname = (req.query.nickname as string) || "";
    let ouid = (req.query.ouid as string) || "";
    const simulate = req.query.simulate === "true";
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    // Demo fallback or explicit simulation
    if (!apiKey || apiKey === "test_nxapi_key_here" || simulate) {
      const isPlaying = nickname !== "노메치" && ouid !== "no_match";

      if (!isPlaying) {
        return res.json({
          isPlaying: false,
          message: "현재 진행 중인 실시간 경기가 없습니다."
        });
      }

      const elapsedMinutes = Math.min(88, Math.max(15, Math.floor(((Date.now() / 1000) % 90))));

      return res.json({
        isPlaying: true,
        liveMatch: {
          matchId: `live_${Date.now()}`,
          matchType: "공식경기 1vs1 (LIVE)",
          currentMinute: elapsedMinutes,
          period: elapsedMinutes > 45 ? "후반전" : "전반전",
          stadium: "Wembley Stadium (London)",
          myTeam: {
            ouid: ouid || "demo_ouid_fconline_1029",
            nickname: nickname || "두치와뿌꾸",
            score: 2,
            possession: 56,
            shots: 7,
            effectiveShots: 5,
            color: "#B9F600",
            scorers: [
              { minute: 23, name: "Son Heung-min" },
              { minute: 58, name: "Kylian Mbappé" }
            ]
          },
          opponentTeam: {
            ouid: "demo_opp_live_77",
            nickname: "Real_Madrid_Galacticos",
            score: 1,
            possession: 44,
            shots: 4,
            effectiveShots: 2,
            color: "#38BDF8",
            scorers: [
              { minute: 41, name: "Vinícius Jr." }
            ]
          },
          recentEvents: [
            { minute: 58, type: "GOAL", player: "Kylian Mbappé", team: "MY", text: "⚽ 킬리안 음바페 슈팅 득점! (Assist: Jude Bellingham)" },
            { minute: 52, type: "YELLOW", player: "Rodri", team: "MY", text: "🟨 로드리 강력한 태클로 경고 수령" },
            { minute: 41, type: "GOAL", player: "Vinícius Jr.", team: "OPP", text: "⚽ 비니시우스 주니오르 동점골!" },
            { minute: 23, type: "GOAL", player: "Son Heung-min", team: "MY", text: "⚽ 손흥민 감아차기 선제골!" }
          ]
        }
      });
    }

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
        return res.status(400).json({ error: true, message: "OUID or valid nickname required" });
      }

      const matchRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/match?ouid=${ouid}&matchtype=50&offset=0&limit=1`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!matchRes.ok) {
        return res.json({ isPlaying: false, message: "No live match detected" });
      }

      const matchIds: string[] = await matchRes.json();
      if (!matchIds || matchIds.length === 0) {
        return res.json({ isPlaying: false, message: "No ongoing matches" });
      }

      const mDetailRes = await fetch(
        `https://open.api.nexon.com/fconline/v1/match-detail?matchid=${matchIds[0]}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!mDetailRes.ok) {
        return res.json({ isPlaying: false, message: "Could not retrieve match details" });
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
    const matchId = (req.query.matchid as string) || "m_001";
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here" || matchId.startsWith("m_00")) {
      return res.json({
        isDemoData: true,
        matchId: matchId,
        matchDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        matchType: "공식경기 1vs1 (Official 1v1)",
        stadium: "Stade Bollaert-Delelis (Lens)",
        teams: [
          {
            ouid: "demo_ouid_fconline_1029",
            nickname: "두치와뿌꾸",
            result: "승",
            score: 3,
            possession: 58,
            totalShots: 9,
            effectiveShots: 6,
            passSuccessRate: 88,
            tackleSuccessRate: 75,
            controller: "pad",
            squad: [
              { spId: 250102143, name: "Kylian Mbappé", season: "24TY", position: "ST", grade: 5, ovr: 118, goals: 2, assists: 1, rating: 9.2, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102143.png" },
              { spId: 240000001, name: "Son Heung-min", season: "24TY", position: "LW", grade: 5, ovr: 116, goals: 1, assists: 1, rating: 8.8, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p240000001.png" },
              { spId: 101000001, name: "Jude Bellingham", season: "24TY", position: "CAM", grade: 3, ovr: 115, goals: 0, assists: 1, rating: 8.1, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p101000001.png" },
              { spId: 101000002, name: "Rodri", season: "23HW", position: "CDM", grade: 5, ovr: 114, goals: 0, assists: 0, rating: 7.9, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p101000002.png" },
              { spId: 101000003, name: "Virgil van Dijk", season: "24TY", position: "CB", grade: 5, ovr: 116, goals: 0, assists: 0, rating: 8.4, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p101000003.png" },
            ]
          },
          {
            ouid: "demo_ouid_opp_881",
            nickname: "LensMaster_FC",
            result: "패",
            score: 1,
            possession: 42,
            totalShots: 4,
            effectiveShots: 2,
            passSuccessRate: 81,
            tackleSuccessRate: 60,
            controller: "keyboard",
            squad: [
              { spId: 250102144, name: "Erling Haaland", season: "24TY", position: "ST", grade: 3, ovr: 117, goals: 1, assists: 0, rating: 7.5, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102144.png" },
              { spId: 240000002, name: "Kevin De Bruyne", season: "23HW", position: "CAM", grade: 5, ovr: 115, goals: 0, assists: 1, rating: 7.2, image: "https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p240000002.png" },
            ]
          }
        ]
      });
    }

    try {
      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/match-detail?matchid=${matchId}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!response.ok) {
        res.status(response.status).json({ error: true, message: "Match not found" });
        return;
      }

      const mData = await response.json();
      res.json({
        isDemoData: false,
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
    const matchType = (req.query.matchtype as string) || "50";
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here") {
      return res.json({
        isDemoData: true,
        matchType: "50 (공식경기 1v1)",
        rankers: [
          { rank: 1, nickname: "김정민_FC", ouid: "r_01", winRate: "72.4%", totalMatches: 482, topFormation: "4-2-3-1", mainPlayer: "24TY Kylian Mbappé (+5)", division: "Super Champions" },
          { rank: 2, nickname: "원창연_Pro", ouid: "r_02", winRate: "70.1%", totalMatches: 510, topFormation: "4-3-3 Attack", mainPlayer: "24TY Son Heung-min (+5)", division: "Super Champions" },
          { rank: 3, nickname: "신보석_Apex", ouid: "r_03", winRate: "68.9%", totalMatches: 420, topFormation: "4-2-2-2", mainPlayer: "ICON Zinedine Zidane (+3)", division: "Super Champions" },
          { rank: 4, nickname: "곽준혁_T1", ouid: "r_04", winRate: "67.5%", totalMatches: 390, topFormation: "5-2-3 Counter", mainPlayer: "24TY Jude Bellingham (+5)", division: "Champions" },
          { rank: 5, nickname: "박기영_GenG", ouid: "r_05", winRate: "66.8%", totalMatches: 460, topFormation: "4-1-2-1-2", mainPlayer: "24TY Ruud Gullit (+3)", division: "Champions" },
        ]
      });
    }

    try {
      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/ranker?matchtype=${matchType}`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!response.ok) {
        res.status(response.status).json({ error: true, message: "Ranker data fetch failed" });
        return;
      }

      const rankerData = await response.json();
      res.json({
        isDemoData: false,
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
        throw new Error("Failed to fetch static metadata");
      }
    } catch (err) {
      // Fallback local reference data
      const fallbackMeta: Record<string, any> = {
        matchtype: [
          { matchtype: 50, desc: "공식경기 1vs1" },
          { matchtype: 52, desc: "볼타 라이브 공식경기" },
          { matchtype: 60, desc: "클래식 1vs1" },
          { matchtype: 30, desc: "리그 친선" },
        ],
        seasonid: [
          { seasonId: 101, className: "24TY", seasonImg: "https://fconline.gcdn.nexon.com/live/externalAssets/common/season/101.png" },
          { seasonId: 102, className: "23HW", seasonImg: "https://fconline.gcdn.nexon.com/live/externalAssets/common/season/102.png" },
          { seasonId: 103, className: "ICON", seasonImg: "https://fconline.gcdn.nexon.com/live/externalAssets/common/season/103.png" },
          { seasonId: 104, className: "LN", seasonImg: "https://fconline.gcdn.nexon.com/live/externalAssets/common/season/104.png" },
        ],
        spposition: [
          { spposition: 0, desc: "GK" },
          { spposition: 3, desc: "CB" },
          { spposition: 7, desc: "LB" },
          { spposition: 8, desc: "RB" },
          { spposition: 12, desc: "CDM" },
          { spposition: 14, desc: "CM" },
          { spposition: 18, desc: "CAM" },
          { spposition: 23, desc: "LW" },
          { spposition: 25, desc: "ST" },
          { spposition: 27, desc: "RW" },
        ]
      };
      res.json({ type, isFallback: true, data: fallbackMeta[type] || [] });
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
      popularSpIds: [
        { name: "Kylian Mbappé (24TY)", spId: "250102143" },
        { name: "Son Heung-min (24TY)", spId: "240000001" },
        { name: "Jude Bellingham (24TY)", spId: "101000001" },
        { name: "Erling Haaland (24TY)", spId: "250102144" },
        { name: "Zinedine Zidane (ICON)", spId: "100000001" },
      ]
    });
  });

  // 6. 이적시장 거래 내역 조회 (Trade History Endpoint: Buy/Sell Records)
  app.get("/api/nexon/trade", async (req, res) => {
    let ouid = req.query.ouid as string;
    const nickname = req.query.nickname as string;
    const tradeType = (req.query.tradetype as string) || "buy"; // "buy" or "sell"
    const customApiKey = req.headers["x-nxopen-api-key"] as string;
    const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

    if (!apiKey || apiKey === "test_nxapi_key_here") {
      const demoTrades = tradeType === "buy" ? [
        { tradeDate: new Date(Date.now() - 3600000 * 3).toISOString(), saleType: "buy", spid: 250102143, name: "Kylian Mbappé", season: "24TY", grade: 5, value: 45000000000 },
        { tradeDate: new Date(Date.now() - 3600000 * 20).toISOString(), saleType: "buy", spid: 240000001, name: "Son Heung-min", season: "24TY", grade: 5, value: 28000000000 },
        { tradeDate: new Date(Date.now() - 3600000 * 48).toISOString(), saleType: "buy", spid: 101000001, name: "Jude Bellingham", season: "24TY", grade: 3, value: 18500000000 },
        { tradeDate: new Date(Date.now() - 3600000 * 90).toISOString(), saleType: "buy", spid: 101000002, name: "Rodri", season: "23HW", grade: 5, value: 9800000000 },
      ] : [
        { tradeDate: new Date(Date.now() - 3600000 * 8).toISOString(), saleType: "sell", spid: 250102144, name: "Erling Haaland", season: "24TY", grade: 3, value: 32000000000 },
        { tradeDate: new Date(Date.now() - 3600000 * 35).toISOString(), saleType: "sell", spid: 240000002, name: "Kevin De Bruyne", season: "23HW", grade: 5, value: 14200000000 },
        { tradeDate: new Date(Date.now() - 3600000 * 72).toISOString(), saleType: "sell", spid: 100000001, name: "Zinedine Zidane", season: "ICON", grade: 1, value: 65000000000 },
      ];

      return res.json({
        isDemoData: true,
        tradeType,
        totalCount: demoTrades.length,
        trades: demoTrades,
      });
    }

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
        return res.status(400).json({ error: true, message: "OUID or valid nickname required" });
      }

      const response = await fetch(
        `https://open.api.nexon.com/fconline/v1/user/trade?ouid=${ouid}&tradetype=${tradeType}&offset=0&limit=20`,
        { headers: { "x-nxopen-api-key": apiKey } }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: true, message: "Failed to fetch trade history" });
      }

      const rawTrades = await response.json();
      res.json({
        isDemoData: false,
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

