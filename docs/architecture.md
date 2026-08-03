# FC Lens 아키텍처 (Architecture)

> FC Online(넥슨 EA SPORTS FC Online) 구단주 분석 웹앱의 기술 구조 문서입니다.
> 소스 코드를 기준으로 작성된 참조 문서이며, **구조가 바뀌면 이 문서도 함께 갱신**해야 합니다.
> (갱신 규칙은 프로젝트 루트 `AGENTS.md` 참고)

최종 검증 기준 커밋: `db4ea61 feat(meta): implement ranker benchmark tab on ranker-stats`

---

## 1. 개요 (Overview)

FC Lens는 **단일 Express 서버가 프론트엔드(SPA)와 API 프록시를 모두 담당**하는 풀스택 웹 애플리케이션이다.

- 브라우저에서 동작하는 React 19 SPA (모바일 우선 다크 UI)
- 같은 서버가 `/api/*` 경로로 넥슨 Open API를 **서버 사이드 프록시**
- 기능 범위는 **넥슨 공식 Open API가 제공하는 것으로 한정**한다 ([`SPEC.md`](../SPEC.md) 참고).
  선수 능력치(PAC/SHO/…)와 시세(BP)는 공식 API에 존재하지 않으므로 다루지 않는다.
- **목(mock) 데이터 없음.** 모든 화면이 실 API 응답으로만 동작한다.

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 언어 | TypeScript | ~5.8.2 | `noEmit`, `moduleResolution: bundler` |
| 프론트 프레임워크 | React / React DOM | ^19.0.1 | `StrictMode`, 함수형 컴포넌트 |
| 타입 정의 | @types/react, @types/react-dom | ^19 | **필수** — 없으면 `tsc`가 JSX prop 오류를 전혀 잡지 못한다 |
| 번들러/개발 서버 | Vite | ^6.2.3 | 개발 시 미들웨어 모드로 Express에 부착 |
| 스타일 | Tailwind CSS | ^4.1.14 | `@tailwindcss/vite` 플러그인, `src/index.css`에서 `@import "tailwindcss"` |
| 애니메이션 | motion (Framer Motion 후속) | ^12.23.24 | `motion/react`의 `AnimatePresence`, `motion.*` |
| 차트 | recharts | ^3.10.0 | 매치 승률/성과 차트 |
| 아이콘 | lucide-react + Google Material Symbols | ^0.546.0 | Material Symbols는 CDN 폰트(`index.html`) |
| 백엔드 | Express | ^4.21.2 | API 라우팅 + 정적 파일 서빙 |
| 환경변수 | dotenv | ^17.2.3 | `server/index.ts` 최상단에서 `import "dotenv/config"` |
| 테스트 | Vitest + Testing Library + supertest | ^4 | `npm test`, 커버리지 임계치 80% |
| 개발 실행 | tsx | ^4.21.0 | `server/index.ts` 직접 실행 |
| 프로덕션 번들 | esbuild | ^0.25.0 | `server/index.ts` → `dist/server.cjs` (CJS) |

### 실행 / 빌드 스크립트 (`package.json`)

| 스크립트 | 명령 | 설명 |
|----------|------|------|
| `dev` | `tsx server/index.ts` | Express + Vite(미들웨어) 개발 서버, **포트 3000** |
| `build` | `vite build` + `esbuild server/index.ts …` | 프론트 정적 빌드 + 서버 CJS 번들(`dist/server.cjs`) |
| `start` | `node dist/server.cjs` | 프로덕션 서버 (정적 `dist` 서빙) |
| `lint` | `tsc --noEmit` | 타입 체크 전용 |
| `test` | `vitest run` | 단위·통합 테스트 |
| `test:coverage` | `vitest run --coverage` | 커버리지 + 임계치 검사 |
| `clean` | `rm -rf dist server.js` | 산출물 정리 |

---

## 3. 폴더 구조 (Folder Structure)

```
fc-lens/
├── index.html                # SPA HTML 셸
├── vite.config.ts            # Vite 설정 (react + tailwind, '@' → 루트 alias)
├── SPEC.md                   # 넥슨 공식 API 명세 (기능 범위의 기준)
├── PLAN.md / STATE.md        # 리팩토링 계획·진행 상태
├── docs/architecture.md      # (이 문서)
│
├── server/                   # 얇은 프록시 (키·CORS 전담)
│   ├── index.ts              # startServer(): dotenv → 라우터 → vite/static → listen
│   ├── routes/
│   │   └── nexon.ts          # /api/nexon/*
│   └── lib/
│       ├── nexonClient.ts    # Base URL 상수 + resolveApiKey(req,res) + fetch 헬퍼
│       ├── divisions.ts      # DIVISION_MAP (등급 코드 → 라벨)
│       ├── meta.ts           # 정적 메타 캐시 (선수명/포지션/시즌/매치타입)
│       ├── transform.ts      # 넥슨 원본 → 뷰 모델 변환 (순수 함수, 테스트 대상)
│       └── __fixtures__/     # 실제 넥슨 응답 픽스처
│
└── src/
    ├── main.tsx              # React 진입점
    ├── App.tsx               # 탭 라우팅 + 공유 훅 소유 + 화면 조립
    ├── index.css             # Tailwind import + 전역 유틸
    ├── types.ts              # TabType
    ├── lib/api/
    │   ├── client.ts         # apiGet/apiPost, 넥슨 키 저장·헤더 주입
    │   ├── nexon.ts          # 엔드포인트별 타입 지정 함수
    │   └── types.ts          # 프록시 응답 DTO (단일 타입 기준)
    ├── hooks/
    │   ├── useOwnerData.ts   # 계정·매치·실시간·상세·이적 상태 일괄 관리
    │   ├── useRankerStats.ts # 스쿼드 배치 랭커 통계 조회
    │   └── useToast.ts       # 자동 소멸 알림
    └── components/
        ├── TopHeader.tsx     # 상단 헤더 + 알림 드롭다운
        ├── BottomNav.tsx     # 하단 4탭 (구단주/매치/이적/랭킹)
        ├── OwnerView.tsx     # 구단주 탭
        ├── MatchView.tsx     # 매치 탭
        ├── TradeView.tsx     # 이적 탭
        ├── MetaView.tsx      # 랭킹(메타) 탭 — 랭커 벤치마크
        ├── owner/            # OwnerSearchBar, OwnerAccountCard, MatchHistoryList
        ├── match/            # MatchScoreboard, MatchSquadRatings,
        │                     #   LiveMatchCard, MatchWinRateChart
        ├── meta/             # PlayerBenchmarkRow
        └── common/           # Skeletons, Toast
```

> **파일 크기 기준**: 컴포넌트는 200~400줄을 넘지 않게 유지한다. 현재 최대는
> `owner/MatchHistoryList.tsx`(265줄), `match/MatchWinRateChart.tsx`(242줄).

---

## 4. 주요 모듈 역할 (Modules & Responsibilities)

### 4.1 백엔드 — `server/`

**아키텍처 원칙: 서버는 얇은 프록시이되, "뷰 모델 정규화"는 서버가 담당한다.**

라우트 핸들러는 인증·파라미터 검증·에러 응답만 하고, 원본 → 뷰 모델 변환은
`server/lib/transform.ts`의 순수 함수가 담당한다. 네트워크·Express에 의존하지 않으므로
저장된 실제 응답 픽스처로 계약을 검증할 수 있다.


넥슨 원본 응답은 선수를 `spId` 숫자로만 표현하고 팀 스탯도 시도/성공 횟수로 흩어져 있다.
이를 클라이언트가 조립하면 6MB대의 메타 파일을 브라우저로 내려보내야 하므로,
서버가 메타를 조인하고 화면이 바로 쓸 수 있는 형태로 변환해 응답한다.

**API 키 처리** (`server/lib/nexonClient.ts`):
- 키는 **환경변수 `NEXON_OPENAPI_KEY`에서만** 읽는다. 클라이언트가 키를 넘기는 경로는 없다.
  (`x-nxopen-api-key` 헤더를 보내도 무시된다.)
- 예시값(`test_nxapi_key_here`)이거나 비어 있으면 400으로 안내.

**정적 메타 캐시** (`server/lib/meta.ts`):
- `spid.json`(6.3MB / 88,250건), `spposition.json`, `seasonid.json`, `matchtype.json`을
  프로세스 메모리에 **1회만** 적재한다. 인증이 필요 없는 정적 리소스다.
- 동시 요청은 하나의 in-flight 프라미스를 공유하고, 실패한 프라미스는 캐싱하지 않는다.
- 서버 기동 시 `preloadMeta()`로 백그라운드 예열(실패해도 요청 시 재시도).
- 시즌은 `spid / 1_000_000`으로 도출한다.

**엔드포인트 목록**:

| 메서드 | 경로 | 역할 | 외부 대상 |
|--------|------|------|-----------|
| GET | `/api/nexon/status` | 키 설정 여부 + 엔드포인트 목록 | (내부) |
| GET | `/api/nexon/account` | 닉네임 → OUID·레벨·최고등급·최근 매치ID | Nexon `id`/`user/basic`/`maxdivision`/`user/match` |
| GET | `/api/nexon/user-matches` | 최근 경기 집계(승/무/패·점유율·득점자) | Nexon `user/match` + `match-detail` (병렬) |
| GET | `/api/nexon/live-match` | 최근 경기 시각으로 진행 여부 추정(≤20분) | Nexon `user/match` + `match-detail` |
| GET | `/api/nexon/match-detail` | 매치 상세 → **`teams[]`로 정규화** + 선수명 조인 | Nexon `match-detail` |
| GET | `/api/nexon/ranker-stats` | 선수별 랭커 사용 통계 (`players` 배열 필수) | Nexon `ranker-stats` |
| GET | `/api/nexon/metadata` | 메타 JSON 패스스루 | Nexon static meta |
| GET | `/api/nexon/images` | 선수/시즌 CDN 이미지 URL 조합 | (URL 생성만) |
| GET | `/api/nexon/trade` | 이적 구매/판매 내역 + 선수명 조인 | Nexon `user/trade` |
| GET | `/api/nexon/user-lookup` | `/account` 하위호환 별칭 | (내부 재라우팅) |

### 4.2 프론트엔드 진입 — `src/main.tsx`, `src/App.tsx`

- `main.tsx`: `createRoot(#root).render(<StrictMode><App/></StrictMode>)`.
- `App.tsx`: **라우터 라이브러리 없이** `useState`로 탭 상태(`TabType`)를 관리한다.
  - 공유 훅(`useOwnerData`, `useToast`)을 **App이 소유**하고 각 뷰에 슬라이스로 전달.
    덕분에 `AnimatePresence`로 뷰를 재마운트해도 조회 결과가 유지된다.
  - 저장된 API 키가 바뀌면 `useOwnerData(apiKey.savedKey)`가 전체를 재조회한다.

### 4.3 데이터 레이어 (`src/lib/api`, `src/hooks`)

데이터 흐름은 한 방향으로 고정한다.

```
컴포넌트 → src/hooks → src/lib/api → /api/* (프록시) → open.api.nexon.com
```

- **컴포넌트에서 직접 `fetch`를 호출하지 않는다.**
- 넥슨 키는 서버 전용이라 클라이언트 호출부는 인증을 신경 쓸 필요가 없다(5.2 참고).
- 훅의 `useEffect`는 모두 `cancelled` 가드로 경쟁 상태(race)를 막는다.

| 훅 | 역할 |
|----|------|
| `useOwnerData(apiKeyRevision)` | 계정·매치 집계·실시간·매치 상세·이적을 한곳에서 관리. `myTeam`/`opponentTeam` 파생 제공 |
| `useRankerStats(squad, matchType)` | 스쿼드 전체를 **1회 요청**으로 조회. `spid*100+포지션`을 키로 `Map` 반환 |
| `useToast(duration)` | 자동 소멸 알림. 언마운트 시 타이머 정리 |

### 4.4 화면 컴포넌트 (`src/components/`)

| 탭 | 컴포넌트 | 역할 |
|----|----------|------|
| 구단주 | `OwnerView` | 구단주 검색 → 계정 카드 · 매치 타입 필터 · LIVE 감지 · 승률 차트 · 매치 목록 |
| 매치 | `MatchView` | 최근 매치 빠른 선택 → 스코어보드 · 스탯 비교 바 · 선수별 평점 |
| 이적 | `TradeView` | 구매/판매 내역 (선수명·시즌·이미지 조인됨) |
| 랭킹 | `MetaView` | 내 스쿼드 vs 랭커 평균 벤치마크 (4.6 참고) |

### 4.5 랭커 벤치마크 설계 근거 (중요)

`/fconline/v1/ranker-stats`는 이름과 달리 **랭커 순위표가 아니다.**

```
GET /fconline/v1/ranker-stats?matchtype=50&players=[{"id":<spid>,"po":<spposition>}, ...]
→ [{ spid, spPosition, status{shoot,goal,assist,dribble,passTry,passSuccess,block,tackle,matchCount}, createDate }]
```

"지정한 선수를 TOP 10,000 랭커가 썼을 때의 20경기 집계"를 돌려준다.
랭커 **유저 목록**은 공식 API에 존재하지 않는다.

- `players` 없이 호출하면 `OPENAPI00004`(invalid parameter)로 실패한다.
- **배치 조회 가능** — 스쿼드 18명을 1회 호출로 처리한다. 선수당 1콜로 부르면
  `OPENAPI00007`(rate limit)에 걸린다.
- `match-detail`의 `player[]`가 `ranker-stats`와 **동일한 스탯 어휘**를 쓰므로 그대로 조인된다.
  이를 위해 서버가 `teams[].squad[].stats`에 같은 키를 채워 내려준다.

따라서 랭킹 탭은 "선택된 매치의 내 스쿼드 실적 vs 랭커 경기당 평균" 비교 화면으로 구현했다.
미출전 선수(평점 0)는 스탯이 전부 0이라 비교에서 제외한다.

> 주의: 넥슨 `averageRating`은 미출전 선수의 0점까지 포함해 실제보다 크게 낮다.
> 출전 선수 기준 평균은 클라이언트에서 직접 계산한다.

---

## 5. 데이터 흐름 (Data Flow)

### 5.1 전체 요청 흐름

```
[브라우저 React SPA]
      │  (같은 오리진 fetch: /api/*)
      ▼
[Express server/index.ts]
   ├─ /api/nexon/*  ──(env NEXON_OPENAPI_KEY)──▶ [넥슨 Open API]
   │      └─ server/lib/meta.ts 캐시로 선수명·포지션·시즌·매치타입 조인
   └─ 그 외 경로 ── 개발: Vite 미들웨어 / 프로덕션: dist 정적 + SPA 폴백
```

핵심 원칙: **API 키는 서버에만 존재/통과**시키고, 브라우저는 항상 **동일 오리진 `/api/*`**만 호출한다.
넥슨 Open API는 CORS를 허용하지 않으므로 브라우저에서 직접 호출할 수 없다.

### 5.2 넥슨 API 키 (서버 전용)

키는 서버 `.env`의 `NEXON_OPENAPI_KEY` **한 곳에만** 존재한다.

- 브라우저는 키를 보관하지도, 전달하지도 않는다. `lib/api/client.ts`는 인증 헤더를 붙이지 않는다.
- 서버 응답에 키가 실려 나가는 경로도 없다. `/api/nexon/status`는 `configured: boolean`만 반환한다.
- 근거: `localStorage`에 둔 키는 XSS로 읽힌다. 이 앱은 서버 키 하나로 동작하므로
  클라이언트 키 입력(BYOK)이 필요 없고, 있으면 공격면만 늘어난다.
- 넥슨 Open API는 CORS를 허용하지 않아 브라우저에서 직접 호출하는 것도 불가능하다.

### 5.3 랭커 벤치마크 흐름

```
OwnerView(매치 선택) → useOwnerData.selectMatch
   → GET /api/nexon/match-detail  → teams[] (선수명·스탯 조인)
   → useOwnerData.myTeam (ouid로 내 팀 식별 — teams[] 순서는 원본 순서라 보장 없음)
MetaView → useRankerStats(myTeam.squad, matchType)
   → GET /api/nexon/ranker-stats?players=[{id,po}...]   ← 스쿼드 전체 1콜
   → spid+포지션 키로 조인 → 지표 6종 비교 렌더링
```

### 5.4 클라이언트 영속 상태 (localStorage)

| 키 | 저장 위치 | 내용 |
|----|-----------|------|
| `fclens_last_owner` | `lib/storage.ts` | 마지막으로 조회한 구단주 닉네임 |

> 넥슨 API 키는 `localStorage`에 저장하지 않는다(서버 환경변수 전용).

> Phase 3a에서 목업 화면이 제거되며 즐겨찾기·스쿼드 프리셋·선수 메모 키는 모두 사라졌다.
> 저장된 구단주가 없으면 검색 안내 화면으로 시작한다(기본 닉네임을 하드코딩하지 않는다).

---

## 6. 배포/런타임 형태 (Runtime)

- **개발**: `npm run dev` → 단일 프로세스(Express+Vite), `http://0.0.0.0:3000`.
- **프로덕션**: `npm run build` 후 `npm start` → `dist/server.cjs`가 `dist` 정적 자산 서빙 + `/api/*` 처리.

---

## 7. 알려진 제약 (Known Constraints)

- **공식 API에 없는 데이터**: 선수 능력치(PAC/SHO/PAS/DRI/DEF/PHY, OVR), 시세(BP), 급여(salary).
  이를 전제로 한 기능은 구현하지 않는다.
- **클라이언트 라우터 미사용**: 화면 전환은 `activeTab` 상태로만 처리하며 URL이 변하지 않는다.
- **E2E 없음**: 단위·통합 테스트(Vitest)만 있고 브라우저 E2E는 없다.
  `server/index.ts`(부트스트랩)와 차트 컴포넌트는 커버리지 대상에서 사실상 제외된다.
- **rate limit**: 넥슨 API는 짧은 간격의 연속 호출에 `OPENAPI00007`을 반환한다.
  배치 조회 가능한 엔드포인트는 반드시 배치로 호출한다.

---

## 8. 이 문서의 유지보수 규칙

다음과 같은 **중요한 구조 변경** 시 이 문서를 같은 변경(PR/커밋)에서 갱신한다.

- 기술 스택/주요 의존성 추가·제거·메이저 업그레이드
- 폴더 구조 또는 컴포넌트/훅 추가·삭제·역할 변경
- `server/routes/*` API 엔드포인트 추가·삭제·**응답 스키마 변경**
- 데이터 흐름 변경(새 외부 연동, 인증/키 처리 방식, localStorage 스키마 등)
- 탭 구성·라우팅 구조 변경

세부 규칙은 루트 `AGENTS.md`의 "문서 최신화 규칙" 참고.
