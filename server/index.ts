// .env를 가장 먼저 로드한다 (라우트가 process.env를 읽기 전에 채워져야 함)
import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nexonRouter } from "./routes/nexon";
import { preloadMeta } from "./lib/meta";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 선수명/포지션/시즌 메타를 백그라운드로 미리 적재 (첫 매치 상세 조회 지연 방지)
  preloadMeta();

  // API 라우트 (넥슨 프록시)
  app.use("/api/nexon", nexonRouter);

  // 개발: Vite 미들웨어 / 프로덕션: dist 정적 서빙 + SPA 폴백
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
