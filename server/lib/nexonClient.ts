import type { Request, Response } from "express";

// ------------------------------------------------------------------
// 넥슨 FC Online Open API 공통 클라이언트
// 참고: SPEC.md (https://openapi.nexon.com/ko/game/fconline/?id=2)
// - REST 엔드포인트는 x-nxopen-api-key 헤더 필수
// - 정적 메타(/static)·이미지 CDN은 키 불필요
// ------------------------------------------------------------------

export const NEXON_BASE = "https://open.api.nexon.com";
export const NEXON_FCONLINE = `${NEXON_BASE}/fconline/v1`;
export const NEXON_META = `${NEXON_BASE}/static/fconline/meta`;
export const NEXON_IMAGE_BASE =
  "https://fconline.gcdn.nexon.com/live/externalAssets/common";

const PLACEHOLDER_KEY = "test_nxapi_key_here";

// 키가 실제로 설정되어 있는지 검사 (예시값/공백 제외)
export function isKeyConfigured(key: string | undefined): boolean {
  return Boolean(key && key !== PLACEHOLDER_KEY && key.trim().length > 0);
}

// 요청 헤더(x-nxopen-api-key) 우선, 없으면 환경변수 사용.
// 유효한 키가 없으면 400 응답을 기록하고 null 반환.
export function resolveApiKey(req: Request, res: Response): string | null {
  const customApiKey = req.headers["x-nxopen-api-key"] as string | undefined;
  const apiKey = customApiKey || process.env.NEXON_OPENAPI_KEY;

  if (!isKeyConfigured(apiKey)) {
    res.status(400).json({
      error: true,
      message:
        "NEXON_OPENAPI_KEY 환경변수가 설정되지 않았습니다. .env 파일에 NEXON_OPENAPI_KEY를 발급받아 입력해주세요. (https://openapi.nexon.com)",
    });
    return null;
  }
  return apiKey as string;
}

// 넥슨 REST 호출용 인증 헤더 생성
export function nexonHeaders(apiKey: string): Record<string, string> {
  return { "x-nxopen-api-key": apiKey };
}

// nickname → ouid 조회 (다수 라우트에서 재사용)
export async function fetchOuidByNickname(
  nickname: string,
  apiKey: string
): Promise<string | null> {
  const idRes = await fetch(
    `${NEXON_FCONLINE}/id?nickname=${encodeURIComponent(nickname)}`,
    { headers: nexonHeaders(apiKey) }
  );
  if (!idRes.ok) return null;
  const idData = await idRes.json();
  return idData.ouid ?? null;
}
