// 넥슨 정적 메타데이터(선수명·포지션·시즌) 캐시.
// - 인증 불필요, 변경이 드물어 프로세스 메모리에 한 번만 적재한다.
// - spid.json이 6MB대(88,000건 이상)라 클라이언트로 원본을 내려보내지 않고
//   서버에서 조인해 필요한 필드만 응답에 포함시킨다.

const META_BASE = "https://open.api.nexon.com/static/fconline/meta";
const IMAGE_BASE = "https://fco.dn.nexoncdn.co.kr/live/externalAssets/common";

// spid는 (시즌 ID * 1_000_000 + 선수 ID) 형태로 구성된다.
const SEASON_DIVISOR = 1_000_000;

interface SpidMeta {
  id: number;
  name: string;
}

interface SppositionMeta {
  spposition: number;
  desc: string;
}

interface SeasonMeta {
  seasonId: number;
  className: string;
  seasonImg: string;
}

interface MatchTypeMeta {
  matchtype: number;
  desc: string;
}

export interface MetaTables {
  playerNames: ReadonlyMap<number, string>;
  positions: ReadonlyMap<number, string>;
  seasons: ReadonlyMap<number, SeasonMeta>;
  matchTypes: ReadonlyMap<number, string>;
}

let tables: MetaTables | null = null;
let inFlight: Promise<MetaTables> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`정적 메타데이터 조회 실패 (${url}, HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

async function loadTables(): Promise<MetaTables> {
  const [spids, positions, seasons, matchTypes] = await Promise.all([
    fetchJson<SpidMeta[]>(`${META_BASE}/spid.json`),
    fetchJson<SppositionMeta[]>(`${META_BASE}/spposition.json`),
    fetchJson<SeasonMeta[]>(`${META_BASE}/seasonid.json`),
    fetchJson<MatchTypeMeta[]>(`${META_BASE}/matchtype.json`),
  ]);

  return {
    playerNames: new Map(spids.map((s) => [s.id, s.name])),
    positions: new Map(positions.map((p) => [p.spposition, p.desc])),
    seasons: new Map(seasons.map((s) => [s.seasonId, s])),
    matchTypes: new Map(matchTypes.map((m) => [m.matchtype, m.desc])),
  };
}

// 메타 테이블을 적재한다. 동시 요청은 하나의 in-flight 프라미스를 공유한다.
export async function ensureMetaLoaded(): Promise<MetaTables> {
  if (tables) return tables;

  if (!inFlight) {
    inFlight = loadTables()
      .then((loaded) => {
        tables = loaded;
        return loaded;
      })
      .catch((err) => {
        // 실패한 프라미스를 캐싱하면 이후 요청이 영구히 실패하므로 초기화한다.
        inFlight = null;
        throw err;
      });
  }

  return inFlight;
}

// 서버 기동 시 백그라운드 예열. 실패해도 요청 시점에 다시 시도한다.
export function preloadMeta(): void {
  ensureMetaLoaded().catch((err) => {
    console.error("[meta] 정적 메타데이터 예열 실패:", err.message);
  });
}

export function getPlayerName(meta: MetaTables, spid: number): string {
  return meta.playerNames.get(spid) ?? `선수 #${spid}`;
}

export function getPositionName(meta: MetaTables, spposition: number): string {
  return meta.positions.get(spposition) ?? String(spposition);
}

export function getSeasonName(meta: MetaTables, spid: number): string {
  const season = meta.seasons.get(Math.floor(spid / SEASON_DIVISOR));
  return season?.className ?? "";
}

export function getSeasonImageUrl(meta: MetaTables, spid: number): string {
  return meta.seasons.get(Math.floor(spid / SEASON_DIVISOR))?.seasonImg ?? "";
}

export function getMatchTypeName(meta: MetaTables, matchtype: number): string {
  return meta.matchTypes.get(matchtype) ?? `매치타입 ${matchtype}`;
}

// 두 이미지 경로가 받는 식별자가 다르다 (실측 확인).
//   players/p{pid}.png        → 200   players/p{spid}.png       → 403
//   playersAction/p{spid}.png → 200   playersAction/p{pid}.png  → 200
// 즉 기본 초상은 시즌을 뗀 pid만 받고, 액션샷은 둘 다 받는다.
// 액션샷은 spid를 쓰면 시즌별 카드 아트가 나오므로 spid를 그대로 넘긴다.
export function getPlayerImageUrl(spid: number): string {
  const pid = spid % SEASON_DIVISOR;
  return `${IMAGE_BASE}/players/p${pid}.png`;
}

export function getPlayerActionImageUrl(spid: number): string {
  return `${IMAGE_BASE}/playersAction/p${spid}.png`;
}
