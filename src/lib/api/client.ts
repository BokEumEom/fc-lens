// 프론트 API 클라이언트: 동일 오리진 /api/* 프록시 호출 래퍼.
// 넥슨 키는 localStorage에 저장된 사용자 키가 있으면 헤더로 전달(없으면 서버 env 키 사용).

const API_KEY_STORAGE = "fconline_nexon_api_key";

type QueryParams = Record<string, string | number | boolean | undefined>;

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) localStorage.setItem(API_KEY_STORAGE, key.trim());
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch (err) {
    console.error("Failed to persist NEXON API key", err);
  }
}

function buildHeaders(base: Record<string, string> = {}): Record<string, string> {
  const key = getStoredApiKey();
  return key ? { ...base, "x-nxopen-api-key": key } : { ...base };
}

function toQuery(params?: QueryParams): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

async function toError(res: Response): Promise<Error> {
  let message = `요청 실패 (HTTP ${res.status})`;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {
    // 본문 파싱 실패는 무시하고 상태 코드 메시지 사용
  }
  return new Error(message);
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const res = await fetch(`/api${path}${toQuery(params)}`, { headers: buildHeaders() });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}
