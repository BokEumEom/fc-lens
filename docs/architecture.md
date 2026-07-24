# FC Lens 아키텍처 (Architecture)

> FC Online(넥슨 EA SPORTS FC Online) 구단·선수 전력 분석 플랫폼의 기술 구조 문서입니다.
> 소스 코드를 기준으로 작성된 참조 문서이며, **구조가 바뀌면 이 문서도 함께 갱신**해야 합니다.
> (갱신 규칙은 프로젝트 루트 `AGENTS.md` 참고)

최종 검증 기준 커밋: `054fbd5 refactor(api): improve NEXON API key validation`

---

## 1. 개요 (Overview)

FC Lens는 **단일 Express 서버가 프론트엔드(SPA)와 API 프록시를 모두 담당**하는 풀스택 웹 애플리케이션이다.

- 브라우저에서 동작하는 React 19 SPA (모바일 우선 다크 UI)
- 같은 서버가 `/api/*` 경로로 넥슨 Open API와 Google Gemini를 **서버 사이드 프록시**
- 넥슨 API 키가 없어도 동작하도록 상당수 화면이 **로컬 목(mock) 데이터**로 폴백

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 언어 | TypeScript | ~5.8.2 | `noEmit`, `moduleResolution: bundler` |
| 프론트 프레임워크 | React / React DOM | ^19.0.1 | `StrictMode`, 함수형 컴포넌트 |
| 번들러/개발 서버 | Vite | ^6.2.3 | 개발 시 미들웨어 모드로 Express에 부착 |
| 스타일 | Tailwind CSS | ^4.1.14 | `@tailwindcss/vite` 플러그인, `src/index.css`에서 `@import "tailwindcss"` |
| 애니메이션 | motion (Framer Motion 후속) | ^12.23.24 | `motion/react`의 `AnimatePresence`, `motion.*` |
| 차트 | recharts | ^3.10.0 | 매치/스쿼드 차트 (레이더 차트는 커스텀 SVG) |
| 아이콘 | lucide-react + Google Material Symbols | ^0.546.0 | Material Symbols는 CDN 폰트(`index.html`) |
| 백엔드 | Express | ^4.21.2 | API 라우팅 + 정적 파일 서빙 |
| AI SDK | @google/genai | ^2.4.0 | Gemini `gemini-2.5-flash` 호출 |
| 환경변수 | dotenv | ^17.2.3 | `NEXON_OPENAPI_KEY`, `GEMINI_API_KEY`, `APP_URL` |
| 개발 실행 | tsx | ^4.21.0 | `server.ts` 직접 실행 |
| 프로덕션 번들 | esbuild | ^0.25.0 | `server.ts` → `dist/server.cjs` (CJS) |
| 패키지 매니저 | Bun (`bun.lock`) / npm 호환 | - | README는 `npm` 스크립트 기준 안내 |

### 실행 / 빌드 스크립트 (`package.json`)

| 스크립트 | 명령 | 설명 |
|----------|------|------|
| `dev` | `tsx server.ts` | Express + Vite(미들웨어) 개발 서버, **포트 3000** |
| `build` | `vite build` + `esbuild server.ts …` | 프론트 정적 빌드 + 서버 CJS 번들(`dist/server.cjs`) |
| `start` | `node dist/server.cjs` | 프로덕션 서버 (정적 `dist` 서빙) |
| `preview` | `vite preview` | Vite 프리뷰 |
| `lint` | `tsc --noEmit` | 타입 체크 전용 |
| `clean` | `rm -rf dist server.js` | 산출물 정리 |

---

## 3. 폴더 구조 (Folder Structure)

```
fc-lens/
├── server.ts                 # Express 서버: /api/* 프록시 + 개발/프로덕션 정적 서빙 (백엔드 진입점)
├── index.html                # SPA HTML 셸 (폰트 preconnect, #root, /src/main.tsx 로드)
├── vite.config.ts            # Vite 설정 (react + tailwind 플러그인, '@' → 루트 alias, HMR 토글)
├── tsconfig.json             # TS 설정 (ESNext, react-jsx, noEmit)
├── metadata.json             # AI Studio 애플릿 메타(서버 사이드 Gemini capability 선언)
├── .env.example              # 필요한 환경변수 예시
├── package.json / bun.lock
├── README.md                 # 사용자용 소개/기능 문서
├── docs/
│   └── architecture.md       # (이 문서) 기술 구조 참조
└── src/
    ├── main.tsx              # React 진입점 (createRoot → <App/>)
    ├── App.tsx               # 루트 컴포넌트: 탭 상태 라우팅, 즐겨찾기 상태, 화면 조립
    ├── index.css             # Tailwind import + 전역/유틸 클래스(glass-card 등)
    ├── types.ts              # 도메인 타입 (Player, Formation, SquadSlot, TabType, FilterOptions)
    ├── data/
    │   └── mockData.ts       # PLAYERS, FORMATIONS, POPULAR_SEASONS, formatBP() (목/폴백 데이터)
    └── components/           # 화면(View) 및 UI 컴포넌트
        ├── TopHeader.tsx         # 상단 헤더 + 알림 드롭다운
        ├── BottomNav.tsx         # 하단 플로팅 탭 내비게이션 (home/search/squad/ranker)
        ├── HomeView.tsx          # 메인 대시보드 (트렌드 선수, 시세, 시즌 필터 진입)
        ├── PlayerSearchView.tsx  # 선수 검색/필터
        ├── PlayerDetailView.tsx  # 선수 상세 + 듀얼 레이더 비교 + 메모
        ├── SquadAnalysisView.tsx # 스쿼드 빌더 + 급여캡 + 프리셋 저장
        ├── RankerView.tsx        # TOP 랭커 메타 분석 + AI 코치
        ├── PlayerPickerModal.tsx # 비교/스쿼드 교체용 선수 선택 모달
        └── NexonUserView.tsx     # 넥슨 구단주 검색/실시간 LIVE/매치 분석 (⚠️ 현재 미연결, 4장 참고)
```

> **코드 규모 참고**: `NexonUserView.tsx`(~2286줄), `SquadAnalysisView.tsx`(~1122줄),
> `PlayerDetailView.tsx`(~991줄)가 가장 큰 파일이다.

---

## 4. 주요 모듈 역할 (Modules & Responsibilities)

### 4.1 백엔드 — `server.ts`

`startServer()` 하나로 구성된 Express 앱. 역할은 두 가지다.

1. **넥슨 Open API / Gemini 프록시** — 브라우저가 API 키를 직접 노출하지 않도록 서버가 대행 호출.
2. **정적 서빙** — 개발 시 `createViteServer({ middlewareMode })`로 Vite를 붙이고, 프로덕션(`NODE_ENV=production`)에서는 `dist`를 서빙하며 SPA 폴백(`app.get("*")`)을 처리.

**API 키 처리 규칙** (`checkApiKey`):
- 우선순위: 요청 헤더 `x-nxopen-api-key` → 없으면 환경변수 `NEXON_OPENAPI_KEY`.
- `test_nxapi_key_here`(예시값)이거나 비어 있으면 400 에러로 안내.
- `DIVISION_MAP` 상수로 넥슨 등급 코드(예: 800)를 사람이 읽는 라벨("슈퍼챔피언스")로 변환.

**엔드포인트 목록**:

| 메서드 | 경로 | 역할 | 외부 대상 |
|--------|------|------|-----------|
| GET | `/api/nexon/status` | 넥슨 키 설정 여부 + 엔드포인트 목록 | (내부) |
| POST | `/api/nexon/verify-key` | 사용자 입력 넥슨 키 유효성 검증 | Nexon `id` |
| GET | `/api/nexon/account` | 닉네임 → OUID·레벨·최고등급·최근 매치ID | Nexon `id`/`user/basic`/`maxdivision`/`user/match` |
| GET | `/api/nexon/user-matches` | 최근 경기 상세 집계(승/무/패, 점유율 등) | Nexon `user/match` + `match-detail` (병렬) |
| GET | `/api/nexon/live-match` | 최근 경기 시각으로 실시간 진행 여부 추정(≤20분) | Nexon `user/match` + `match-detail` |
| GET | `/api/nexon/match-detail` | 매치 상세 원본 | Nexon `match-detail` |
| GET | `/api/nexon/rankers` | 랭커 정보(matchtype별) | Nexon `ranker` |
| GET | `/api/nexon/metadata` | 메타 JSON(matchtype/seasonid/spposition/division/spid) | Nexon static meta |
| GET | `/api/nexon/images` | 선수/시즌 CDN 이미지 URL 조합 | (URL 생성만) |
| GET | `/api/nexon/trade` | 이적시장 구매/판매 내역 | Nexon `user/trade` |
| GET | `/api/nexon/user-lookup` | `/api/nexon/account` 하위호환 별칭 | (내부 재라우팅) |
| POST | `/api/ai-squad-assistant` | 스쿼드/전술 조언 생성 | Gemini `gemini-2.5-flash` |

> **폴백 동작**: `GEMINI_API_KEY`가 없으면 `ai-squad-assistant`는 고정 조언 문자열을 반환하고,
> Gemini 호출 실패 시에도 `catch`에서 기본 조언을 반환한다(항상 200 응답).

### 4.2 프론트엔드 진입 — `src/main.tsx`, `src/App.tsx`

- `main.tsx`: `createRoot(#root).render(<StrictMode><App/></StrictMode>)`.
- `App.tsx`: **라우터 라이브러리 없이** `useState`로 탭 상태(`TabType`)를 관리하는 SPA 라우팅.
  - 상태: `activeTab`, `previousTab`, `selectedPlayer`, `seasonFilter`, `favoriteIds`.
  - `favoriteIds`는 `localStorage('fclens_favorite_players')`에 영구 저장.
  - `AnimatePresence`로 탭 전환 애니메이션 처리.
  - 각 View에 `PLAYERS`(목 데이터)와 즐겨찾기/선택 콜백을 props로 주입.

### 4.3 화면 컴포넌트 (`src/components/`)

| 컴포넌트 | 역할 | 주요 데이터/상태 |
|----------|------|------------------|
| `TopHeader` | 상단 헤더, 알림 드롭다운(로컬 상태 목 데이터) | props: `players`, `onSelectPlayer` |
| `BottomNav` | 하단 플로팅 탭 4개(home/search/squad/ranker) | props: `activeTab`, `setActiveTab` |
| `HomeView` | 트렌드 선수·시세 대시보드, 시즌 필터로 검색 화면 진입 | `PLAYERS`, 즐겨찾기, 탭 이동 콜백 |
| `PlayerSearchView` | 선수 검색·필터링(`initialSeason` 지원) | `PLAYERS`, 즐겨찾기 |
| `PlayerDetailView` | 선수 상세 + 두 선수 **레이더 차트 비교** + 메모 | 메모는 `localStorage('player_note_{id}')` |
| `SquadAnalysisView` | 포메이션 빌더, **급여캡** 계산, 프리셋 저장 | 프리셋은 `localStorage('fclens_squad_presets_v2')`, recharts |
| `RankerView` | 랭커 메타 분석 + **AI 코치** | `fetch('/api/nexon/rankers')`, `fetch('/api/ai-squad-assistant')` |
| `PlayerPickerModal` | 비교/스쿼드 교체용 선수 선택 모달 | props로 후보 목록·선택 콜백 |
| `NexonUserView` | 넥슨 구단주 검색·실시간 LIVE·매치/이적 분석 | 다수 `/api/nexon/*` 호출, 키는 `localStorage('fconline_nexon_api_key')` — **미연결(4.5)** |

### 4.4 데이터·타입 모듈

- `src/types.ts`: `Player`(스탯·시즌·강화(enhancements)·가격이력 포함), `Formation`(슬롯 좌표), `SquadSlot`, `TabType`, `FilterOptions`.
- `src/data/mockData.ts`: `PLAYERS`(선수 카탈로그), `FORMATIONS`(포메이션 정의), `POPULAR_SEASONS`, `formatBP()`(BP 금액 포맷 유틸). 넥슨 API 미설정 시 화면의 기본 데이터 소스.

### 4.5 현재 구조상 참고 사항 (Observations)

정확한 최신화를 위해 코드 기준으로 확인된 사항을 기록한다.

- **`NexonUserView`는 정의되어 있으나 화면에 연결되어 있지 않다.**
  `App.tsx`에서 `import`만 되고(라인 12) JSX에서 렌더링되지 않으며(`<NexonUserView>` 사용처 없음),
  `BottomNav`에도 해당 탭이 없다. 즉 README가 소개하는 "넥슨 구단주 실시간 분석" 화면은
  현재 UI 경로로 도달할 수 없다(백엔드 `/api/nexon/*` 엔드포인트 자체는 동작). → **연결 여부는 향후 결정 필요.**
- **클라이언트 라우터 미사용**: 화면 전환은 `App.tsx`의 `activeTab` 상태로만 처리(URL 변화 없음).
- **테스트 프레임워크 없음**: `package.json`에 테스트 스크립트/의존성이 없다.
- **급여캡 기준 표기 불일치(경미)**: README는 250BP, 서버의 Gemini 프롬프트는 230을 언급 —
  기준값이 바뀌면 함께 정리 권장.

---

## 5. 데이터 흐름 (Data Flow)

### 5.1 전체 요청 흐름

```
[브라우저 React SPA]
      │  (같은 오리진 fetch: /api/*)
      ▼
[Express server.ts]
   ├─ /api/nexon/*  ──(헤더 x-nxopen-api-key 또는 env NEXON_OPENAPI_KEY)──▶ [넥슨 Open API]
   ├─ /api/ai-squad-assistant ──(env GEMINI_API_KEY)──▶ [Google Gemini]
   └─ 그 외 경로 ── 개발: Vite 미들웨어 / 프로덕션: dist 정적 + SPA 폴백
```

핵심 원칙: **API 키는 서버에만 존재/통과**시키고, 브라우저는 항상 **동일 오리진 `/api/*`**만 호출한다.

### 5.2 넥슨 API 키의 두 경로

1. **환경변수**: 서버가 `.env`의 `NEXON_OPENAPI_KEY`를 기본 키로 사용.
2. **사용자 입력 키**: 클라이언트가 `localStorage('fconline_nexon_api_key')`에 저장한 키를
   요청 헤더 `x-nxopen-api-key`로 전달 → 서버 `checkApiKey`가 헤더 키를 우선 사용.
   (`NexonUserView`가 이 흐름을 구현. 현재 미연결 상태이나 로직은 존재.)

### 5.3 목(mock) 폴백 흐름

- `HomeView`, `PlayerSearchView`, `PlayerDetailView`, `SquadAnalysisView`,
  `RankerView`의 픽률 계산 등은 기본적으로 `src/data/mockData.ts`의 `PLAYERS`/`FORMATIONS`로 렌더링.
- `RankerView`만 실제 랭커 API(`/api/nexon/rankers`)를 시도하고, 실패해도 화면은 목 데이터로 유지.
- 따라서 **넥슨/Gemini 키가 없어도 앱 대부분이 동작**한다.

### 5.4 클라이언트 영속 상태 (localStorage 키)

| 키 | 저장 위치 | 내용 |
|----|-----------|------|
| `fclens_favorite_players` | `App.tsx` | 즐겨찾기 선수 ID 배열 |
| `fclens_squad_presets_v2` | `SquadAnalysisView` | 저장된 스쿼드 프리셋 목록 |
| `player_note_{playerId}` | `PlayerDetailView` | 선수별 사용자 메모 |
| `fconline_nexon_api_key` | `NexonUserView` | 사용자가 입력한 넥슨 API 키 |

### 5.5 AI 코치 흐름 (`RankerView` → Gemini)

```
RankerView ──POST /api/ai-squad-assistant { prompt } ──▶ server.ts
   server.ts ──(GEMINI_API_KEY 있으면)──▶ Gemini generateContent(gemini-2.5-flash)
   server.ts ──(키 없음/오류)──▶ 고정 조언 문자열 폴백
   ◀── { advice } 반환 (항상 200)
```

---

## 6. 배포/런타임 형태 (Runtime)

- **개발**: `npm run dev` → 단일 프로세스(Express+Vite), `http://0.0.0.0:3000`.
- **프로덕션**: `npm run build` 후 `npm start` → `dist/server.cjs`가 `dist` 정적 자산 서빙 + `/api/*` 처리.
- **AI Studio 배포 가정**: `metadata.json`의 `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`,
  `.env.example`의 `APP_URL`/`GEMINI_API_KEY` 자동 주입 주석으로 보아 Google AI Studio 애플릿 형태를 상정.

---

## 7. 이 문서의 유지보수 규칙

다음과 같은 **중요한 구조 변경** 시 이 문서를 같은 변경(PR/커밋)에서 갱신한다.

- 기술 스택/주요 의존성 추가·제거·메이저 업그레이드
- 폴더 구조 또는 컴포넌트 추가/삭제/역할 변경
- `server.ts` API 엔드포인트 추가/삭제/시그니처 변경
- 데이터 흐름 변경(새 외부 연동, 인증/키 처리 방식, localStorage 스키마 등)
- 미연결 컴포넌트(`NexonUserView`) 연결 등 라우팅 구조 변경

세부 규칙은 루트 `AGENTS.md`의 "문서 최신화 규칙" 참고.
