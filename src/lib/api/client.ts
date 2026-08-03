// 프론트 API 클라이언트: 동일 오리진 /api/* 프록시 호출 래퍼.
//
// 넥슨 키는 서버 환경변수(NEXON_OPENAPI_KEY)에서만 사용한다.
// 브라우저는 키를 보관하지도, 전달하지도 않는다 — localStorage에 두면 XSS로
// 유출될 수 있고, 넥슨 Open API는 CORS를 허용하지 않아 어차피 직접 호출도 불가능하다.

type QueryParams = Record<string, string | number | boolean | undefined>;

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
  const res = await fetch(`/api${path}${toQuery(params)}`);
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}
