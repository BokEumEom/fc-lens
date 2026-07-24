import { Router, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";

export const aiRouter = Router();

// AI 스쿼드/전술 어시스턴트 (Gemini 프록시)
// GEMINI_API_KEY 미설정 또는 오류 시 고정 조언으로 폴백(항상 200).
aiRouter.post("/ai-squad-assistant", async (req: Request, res: Response) => {
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
