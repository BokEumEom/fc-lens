# FC Lens 리팩토링 계획 (PLAN)

관련 문서: [SPEC.md](./SPEC.md) · [STATE.md](./STATE.md) · [docs/architecture.md](./docs/architecture.md)

## 목표 (Goals)

1. **폴더 구조 개선** — 루트의 `server.ts`를 `server/`로 분리, 프론트에 `src/lib/api`·`src/hooks` 레이어 신설.
2. **목업 제거 & 공식 API 범위로 재편** — [SPEC.md](./SPEC.md) 범위 밖(선수 스탯·시세) 화면 제거, `mockData.ts` 삭제.
3. **실 API 화면 연결** — 현재 미연결된 `NexonUserView`(구단주/매치/이적/실시간)를 메인으로 승격.
4. **SPEC 정합성** — `ranker` → `ranker-stats` 등 실제 명세와 코드 일치.

## 확정된 결정 (Decisions)

- 데이터 방향: **공식 API 범위로 재편** (스탯/시세 기반 Search·Detail·Squad 제거).
- 아키텍처: **얇은 서버 프록시 유지**(키·CORS) + 프론트 `lib/api`·`hooks` 레이어.
  - 근거: 넥슨 키를 브라우저에 노출할 수 없고, 넥슨 Open API는 서버-투-서버(CORS 미허용). 따라서 넥슨 직접 호출을 프론트로 옮길 수 없음.
- 데이터 흐름: `컴포넌트 → src/hooks → src/lib/api → /api/* (프록시) → open.api.nexon.com`.
- 하단 4탭 = 공식 API 도메인 1:1 — 구단주 / 매치 / 이적 / 랭킹(→메타).
- 개발용 화면(메타데이터·이미지 조회)은 제품 기능이 아니므로 제거. 서버 라우트는 존치.
- 별도 홈 없음. 구단주 탭이 진입 화면.

## 랭킹 탭 재정의 — "내 스쿼드 vs 랭커" 벤치마크

`ranker-stats`는 랭커 순위표가 아니라 **특정 선수의 랭커 사용 통계** 조회 API임을 실측 확인했다.

```
GET /fconline/v1/ranker-stats?matchtype=50&players=[{"id":<spid>,"po":<spposition>}, ...]
→ [{ spid, spPosition, status{shoot,goal,assist,dribble,passTry,passSuccess,block,tackle,matchCount}, createDate }]
```

- 파라미터 누락 시 `OPENAPI00004`, 연속 호출 시 `OPENAPI00007`(rate limit).
- **배치 조회 가능** — 스쿼드 18명을 1회 호출로 처리. 경기당 1콜이므로 rate limit 회피됨.
- `match-detail`의 `player[]`(`spId`/`spPosition`/`spGrade` + `status`)가 `ranker-stats`와 **동일 스탯 스키마**라 그대로 조인 가능.

→ 랭킹 탭은 "내가 쓴 선수의 실적 vs 랭커 평균" 비교 화면으로 재정의한다. 탭 이름은 **메타**.

- 서버: `/api/nexon/rankers` → `/api/nexon/ranker-stats` (matchtype + players 배열 프록시).
- `spid.json`(6.3MB / 88,250건)은 **서버 기동 시 1회 로드해 메모리 캐시**하고 이름을 조인해 내려준다. 클라이언트로 원본을 보내지 않는다.
- 전체 선수 티어표는 범위 밖 — 공식 API에 "인기 선수" 목록이 없어 조회 대상 선정 근거가 없음.

## 목표 폴더 구조 (Target)

```
fc-lens/
├── index.html
├── vite.config.ts        # Vite root는 루트 유지
├── package.json
├── server/               # 얇은 프록시 (키·CORS 전담)
│   ├── index.ts          # startServer(): app 구성 + vite/static + listen
│   ├── routes/
│   │   └── nexon.ts      # /api/nexon/*
│   └── lib/
│       ├── nexonClient.ts # 넥슨 fetch 래퍼 + resolveApiKey(req,res)
│       └── divisions.ts   # DIVISION_MAP
└── src/
    ├── main.tsx
    ├── App.tsx           # 탭 재구성 (구단주/랭커 중심)
    ├── index.css
    ├── lib/api/
    │   ├── client.ts     # fetch 래퍼(에러/타입)
    │   ├── nexon.ts      # getAccount/getUserMatches/getLiveMatch/getTrades/getRankerStats...
    │   └── types.ts      # API DTO 타입 (Account, Match, Trade, RankerStat...)
    ├── hooks/
    │   ├── useAccount.ts
    │   ├── useUserMatches.ts
    │   ├── useLiveMatch.ts
    │   ├── useTrades.ts
    │   └── useRankerStats.ts
    └── components/
        ├── TopHeader.tsx
        ├── BottomNav.tsx      # 탭: 구단주 / 랭커 (+ 부가)
        ├── OwnerView.tsx      # (구 NexonUserView) 구단주 분석 메인
        └── RankerView.tsx     # ranker-stats 기반 재작성
```

## 제거 대상 (Removals)

- `src/components/PlayerSearchView.tsx` (스탯 기반 검색)
- `src/components/PlayerDetailView.tsx` (스탯 레이더/시세)
- `src/components/SquadAnalysisView.tsx` (급여캡/시세)
- `src/components/PlayerPickerModal.tsx` (Squad/Detail 전용)
- `src/data/mockData.ts` (목업 선수 카탈로그)
- `src/components/HomeView.tsx` (트렌드 선수/시세 — 목업) → 구단주 검색 진입 대시보드로 대체 검토

## 단계 (Phases)

### Phase 1 — 백엔드 구조 분리 (server/)
- `server.ts` → `server/index.ts` 이동 후 `routes/`, `lib/`로 분할.
- `DIVISION_MAP` → `server/lib/divisions.ts`.
- `checkApiKey` → `server/lib/nexonClient.ts`의 `resolveApiKey()` + fetch 헬퍼.
- `package.json` 스크립트 경로 갱신(`server/index.ts`, `dist/server.cjs`).
- SPEC 정합: 랭커 경로 `/fconline/v1/ranker` → `/fconline/v1/ranker-stats`.
- ✅ 검증: `npm run lint` 통과, `npm run dev` 기동.

### Phase 2 — 프론트 API 레이어 추가 (additive)
- `src/lib/api/client.ts` (fetch 래퍼: 헤더 주입, 에러 표준화).
- `src/lib/api/nexon.ts` + `src/lib/api/types.ts` (엔드포인트별 타입 함수).
- `src/hooks/*` (로딩/에러/데이터 상태 훅).
- ✅ 검증: `npm run lint` 통과 (기존 화면 영향 없음).

### Phase 3 — 화면 재편 & 목업 제거 (invasive)
- 제거 대상(위) 삭제.
- `NexonUserView` → `OwnerView`로 정리하고 fetch를 `hooks`/`lib`로 이전.
- `RankerView`를 `ranker-stats` + `useRankerStats`로 재작성(목업 폴백 제거).
- `App.tsx`/`BottomNav.tsx` 탭 재구성, `types.ts`에서 `Player`(스탯/시세) 타입 제거.
- `HomeView` 정리(또는 구단주 검색 진입 화면으로 축소).
- ✅ 검증: `npm run lint` 통과, 주요 플로우 수동 확인.

### Phase 4 — 문서/마무리
- `docs/architecture.md`·`AGENTS.md`·`README.md`를 새 구조로 갱신.
- 문서 상단 "최종 검증 기준 커밋" 갱신.
- ✅ 검증: `npm run lint` 그린, 문서 정합성 확인.

## 검증 기준 (Definition of Done)

- [ ] `npm run lint`(tsc) 오류 0.
- [ ] `mockData.ts` 및 스탯/시세 기반 화면 제거됨.
- [ ] 구단주 분석 화면이 UI에 연결되어 실 API로 동작.
- [ ] 프론트 데이터 호출이 `hooks → lib/api` 경유(컴포넌트 인라인 fetch 제거).
- [ ] 백엔드가 `server/`로 분리됨.
- [ ] 문서(architecture/AGENTS/README) 최신화.

## 리스크 (Risks)

- `ranker-stats` 응답 스키마 미확정 → Phase 3에서 실제 응답 확인 후 매핑 확정.
- `NexonUserView`가 대형(2,286줄) → 이전 시 회귀 위험, 단계적 추출.
- 커밋 전략: Phase 단위 원자적 커밋(`refactor:`/`feat:`), 각 단계 lint 통과 후 진행.
