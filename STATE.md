# FC Lens 리팩토링 상태 (STATE)

리팩토링 진행 상태 추적 문서입니다. 관련: [PLAN.md](./PLAN.md) · [SPEC.md](./SPEC.md)

- 최종 업데이트: **전 Phase 완료** (1 · 2 · 3a · 3b · 3c · 4 · 5 · 6)
- 기준 커밋(작업 시작): `054fbd5 refactor(api): improve NEXON API key validation`
- 범례: ⬜ 대기 · 🔄 진행중 · ✅ 완료 · ⏭️ 보류

## 전체 진행

| Phase | 내용 | 상태 |
| --- | --- | --- |
| 1 | 백엔드 구조 분리 (server/) | ✅ |
| 2 | 프론트 API 레이어 추가 (lib/api, hooks) | ✅ |
| 3a | 탭 재구성 & 목업 제거 | ✅ |
| 3b | NexonUserView 분할 + hooks/lib 이전 | ✅ |
| 3c | 랭킹 탭 재설계 (ranker-stats) | ✅ |
| 4 | 문서/마무리 | ✅ |
| 5 | 테스트 도입 & 기본값 정리 | ✅ |
| 6 | 키 취급 정리 & AI 라우트 제거 | ✅ |

## 확정된 결정 (Phase 3)

- **하단 4탭 = 공식 API 도메인 1:1**: 구단주(user/\*) · 매치(match-detail) · 이적(user/trade) · 랭킹(ranker-stats).
- **개발용 섹션 완전 삭제**: 메타데이터·이미지 정보 탭은 제품 기능이 아니므로 제거.
  (서버 라우트 `/api/nexon/metadata`, `/api/nexon/images`는 존치 — 랭킹 재설계 시 spid 조회에 필요.)
- **HomeView 삭제**: 별도 홈 없이 구단주 탭이 진입 화면.

## Phase 1 — 백엔드 구조 분리 ✅

- [x] `server/lib/divisions.ts` 생성 (DIVISION_MAP)
- [x] `server/lib/nexonClient.ts` 생성 (resolveApiKey + fetch 헬퍼 + Base URL 상수)
- [x] `server/routes/nexon.ts` 생성 (/api/nexon/* 라우터)
- [x] `server/routes/ai.ts` 생성 (/api/ai-squad-assistant)
- [x] `server/index.ts` 생성 (startServer: app + vite/static + listen)
- [x] 루트 `server.ts` 삭제
- [x] `package.json` 스크립트 경로 갱신 (`server/index.ts`)
- [x] 랭커 경로 `ranker` → `ranker-stats` 반영 + `division-volta` 메타 추가
- [x] `tsc --noEmit` 통과 + esbuild 서버 번들 검증 통과 (의존성 `bun install` 완료)

## Phase 2 — 프론트 API 레이어 ✅

- [x] `src/lib/api/client.ts` (apiGet/apiPost, 키 저장/주입)
- [x] `src/lib/api/types.ts` (응답 DTO)
- [x] `src/lib/api/nexon.ts` (엔드포인트 함수 + askAiAdvisor)
- [x] `src/hooks/*` (useAsync, useAccount, useUserMatches, useLiveMatch, useTrades, useRankerStats)
- [x] `tsc --noEmit` 통과

> 참고: 이 프로젝트는 `@types/react` 미설치 + `strict`/`noImplicitAny` off 정책이라
> React 관련 IDE 경고가 뜨지만 프로젝트 게이트(tsc)는 통과. 정식 React 타입/strict 도입은 Phase 4 검토.

## Phase 3a — 탭 재구성 & 목업 제거 ✅

- [x] `types.ts` `TabType` → `owner|match|trade|ranker`, Player/Formation/SquadSlot/FilterOptions 제거
- [x] `BottomNav` 4탭 재구성 (구단주/매치/이적/랭킹)
- [x] `NexonUserView` controlled 전환 (`activeSubTab`/`onChangeSubTab`), 내부 서브탭 바 제거
- [x] 개발용 섹션(메타데이터·이미지) + 관련 상태/fetch 삭제
- [x] `TopHeader` 미사용 `players`/`onSelectPlayer` prop 제거
- [x] `App.tsx` 축소 (166줄 → 57줄)
- [x] 제거: HomeView / PlayerSearchView / PlayerDetailView / SquadAnalysisView / PlayerPickerModal / RankerView / mockData.ts / 고아 이미지 에셋 (약 4,300줄)
- [x] `tsc --noEmit` 통과 + `vite build` 통과
- [x] 구단주/매치/이적 탭 실 API 응답 확인

## Phase 3b — NexonUserView 분할 ✅

- [x] `OwnerView` / `MatchView` / `TradeView` / `MetaView`로 분리 (최대 파일 265줄)
- [x] 인라인 `fetch` 8곳 → `useOwnerData` → `src/lib/api/*`로 이전
- [x] 공유 상태(구단주·선택 매치·API 키)를 App/훅으로 끌어올리기
- [x] `NexonUserView.tsx` 삭제 (1,990줄)
- [x] 로컬 중복 타입 10종 제거 → `lib/api/types.ts` 일원화

함께 처리한 것:

- **`@types/react` 설치** — 미설치 상태에서는 `React.FC<...>`가 `any`가 되어
  `tsc`가 JSX prop 오류를 **하나도** 잡지 못했다. 설치 즉시 이번 리팩토링의 누락 prop 1건 검출.
- `match-detail` 응답 계약 수정 (아래 로그 참조) — 매치 탭이 렌더되지 않던 원인.
- 이적 내역에 선수명·시즌·이미지 조인.
- 매치타입 라벨을 넥슨 메타 기준으로 교정 (52는 볼타 라이브가 아니라 **감독모드**).
- 서버 미지원 기능 제거: LIVE 시뮬레이션 토글, `isDemoData` 플래그.

## Phase 3c — 랭킹 탭 재설계 ✅

⚠️ **`ranker-stats`는 랭커 순위표 엔드포인트가 아님** (실측 확인).

- 필수 파라미터: `matchtype` + `players=[{id: spid, po: spposition}]`
- 응답: 요청한 선수별 20경기 집계 `{spid, spPosition, status{shoot, goal, assist, dribble, passTry, passSuccess, block, tackle, matchCount}, createDate}`
- 즉 "TOP 10,000 랭커가 **그 선수를** 썼을 때의 평균 스탯" 조회이지, 랭커 유저 목록이 아님.
- 짧은 간격 연속 호출 시 `OPENAPI00007`(rate limit) → **배치 조회로 해결**(스쿼드 18명 = 1콜).
- `match-detail`의 `player[]`가 `ranker-stats`와 동일한 스탯 어휘를 사용 → 그대로 조인 가능.

- [x] `/api/nexon/rankers` → `/api/nexon/ranker-stats` 교체 (players 배열 검증·프록시·메타 조인)
- [x] `match-detail` 스쿼드에 비교용 `stats` 추가 (동일 어휘)
- [x] `useRankerStats` 재작성 (스쿼드 1회 조회, spid+포지션 키 Map)
- [x] `MetaView` + `meta/PlayerBenchmarkRow` — 지표 6종 비교, 랭커 표본 수 노출, 미출전 제외
- [x] `useOwnerData`에 `myTeam`/`opponentTeam` 추가 (teams[0]이 내 팀이 아닐 수 있음 — 매치 탭도 동일 버그였음)
- [x] 출전 평균 평점 직접 계산 (넥슨 `averageRating`은 미출전 0점 포함으로 과소 집계)

## Phase 4 — 문서/마무리 ✅

- [x] 화면 전환 애니메이션 복원 (상태가 App 훅으로 올라가 재마운트해도 데이터 유지)
- [x] `docs/architecture.md` 전면 갱신 (구조·엔드포인트·데이터 흐름·설계 근거·알려진 제약)
- [x] `AGENTS.md` 갱신 (데이터 흐름 고정 규칙, 타입 게이트 주의, 목업 폴백 규칙 삭제)
- [x] `README.md` 전면 재작성 (4탭 기준, 삭제된 기능 서술 제거)
- [x] `/api/nexon/status` 엔드포인트 목록의 구 `rankers` 경로 수정
- [x] 최종 `npm run lint` / `vite build` 그린

## 로그 (Log)

- Phase 1 착수: PLAN.md / STATE.md 작성 완료, 백엔드 분리 시작.
- Phase 1 완료: `server.ts`(633줄) → `server/{index,routes/nexon,routes/ai,lib/nexonClient,lib/divisions}.ts`로 분할. 랭커 경로 `ranker-stats` 수정. tsc/esbuild 검증 통과.
- Phase 2 완료: `src/lib/api/*`(client·types·nexon) + `src/hooks/*`(useAsync 기반 6종) 추가. 컴포넌트 인라인 fetch를 대체할 타입 지정 데이터 레이어 마련. tsc 통과.
- Phase 3a 완료: 4탭 재구성 + 목업 화면 7개 삭제(-4,892줄). `NexonUserView`가 앱 본체로 승격되어 앱이 처음으로 실 API 위에서 동작.
- 부수 발견 1 — `dotenv`가 의존성에 있으나 호출된 적이 없어 `.env`가 로드되지 않았음(원본 `server.ts`부터의 기존 버그). `server/index.ts`에 `import "dotenv/config"` 추가 후 `/api/nexon/account` 실 데이터 확인.
- 부수 발견 2 — `ranker-stats` 사용법 오해 확인. Phase 3c 항목 참조.
- Phase 3b 완료: `NexonUserView`(1,990줄) → 16개 파일로 분해. 최대 파일 265줄, `App.tsx` 106줄.
- 부수 발견 3 — `/api/nexon/match-detail`이 넥슨 원본(`matchInfo[]`)을 그대로 반환하는데 UI는 `teams[]`를 기대. `res.json()`이 `any`라 tsc가 못 잡았고 매치 탭이 사실상 빈 화면이었음. 서버에서 `teams[]`로 정규화하고 `server/lib/meta.ts`(spid/spposition/seasonid/matchtype 캐시)로 선수명·포지션·시즌을 조인해 해결.
- 부수 발견 4 — `@types/react` 미설치로 `tsc` 게이트가 React prop 오류를 전혀 검출하지 못하고 있었음. 설치 완료. (Phase 4 검토 항목이었으나 3b 검증을 위해 선반영)
- Phase 3c 완료: 랭킹 탭을 "내 스쿼드 vs 랭커 평균" 벤치마크로 구현. 스쿼드 18명 배치 조회로 rate limit 회피.
- 부수 발견 5 — `teams[]`는 넥슨 원본 순서라 `teams[0]`이 구단주 본인 팀이라는 보장이 없었음(매치 탭·메타 탭 공통). `ouid`로 식별하도록 수정.
- 부수 발견 6 — 넥슨 `averageRating`이 미출전 선수의 0점까지 포함해 실제보다 크게 낮았음(실측 6.9 → 원본 4.3). 출전 선수 기준으로 직접 계산.
- Phase 4 완료: 문서 3종 갱신 + 화면 전환 애니메이션 복원.

## Phase 5 — 테스트 도입 & 기본값 정리 ✅

### 기본 닉네임 하드코딩 제거

- [x] `src/lib/storage.ts` 신규 — 마지막 조회 구단주를 `fclens_last_owner`에 저장
- [x] `useOwnerData`가 저장된 구단주로 시작. 없으면 빈 값 → `OwnerView`가 검색 안내를 표시
- [x] 서버 `/account`도 `nickname` 필수로 변경 (기본값 `두치와뿌꾸` 대체 제거)

### 테스트 (Vitest + Testing Library + supertest)

- [x] `server/lib/transform.ts` 추출 — 라우트에 인라인이던 변환 로직을 순수 함수로 분리
      (`nexon.ts` 553 → 465줄). 네트워크 의존이 없어 픽스처로 계약 검증 가능
- [x] `server/lib/__fixtures__/` — 실제 넥슨 응답 저장 (match-detail / trade / ranker-stats)
- [x] **테스트 23파일 202개**, 커버리지 statements 84.7% / lines 87.3%
- [x] `vitest.config.ts`에 임계치 고정 (statements·lines 80%, branches 75%, functions 80%)

계층별 커버리지: `server/lib` 97% · `server/routes` 86% · `src/components` 96% ·
`src/hooks` 89% · `src/lib/api` 85%

### 테스트가 잡아낸 것

- `MatchHistoryList`가 에러 배너와 매치 목록을 동시에 렌더 (빈 상태만 `!error`로 막혀 있었음)

## Phase 6 — 키 취급 정리 & AI 라우트 제거 ✅

### 넥슨 키를 서버 전용으로

기존에도 서버 env 키가 유출되는 구조는 아니었다(응답에 키를 담는 경로 없음,
`/status`는 `configured` 불리언만 반환). 다만 사용자가 자기 키를 넣어 `localStorage`에
저장하고 헤더로 보내는 BYOK 경로가 있었고, env가 설정된 상태에서는 공격면만 늘렸다.

- [x] `resolveApiKey`가 env만 읽는다. 클라이언트가 헤더로 키를 보내도 무시
- [x] `POST /api/nexon/verify-key` 삭제
- [x] `client.ts`의 키 저장·헤더 주입 제거
- [x] 삭제: `useApiKey`, `ApiKeyModal`, `verifyKey()`, App의 키 배너 버튼
- [x] 실행 중 서버 응답과 프로덕션 번들을 실제 키 문자열로 grep해 노출 없음 확인

**부수 발견 7** — `client.ts`가 모든 요청에 키 헤더를 붙여, 인증이 필요 없는
`metadata`/`images`/`status`는 물론 **Gemini로 가는 `/ai-squad-assistant`에도
넥슨 키가 실려 나가고 있었다.**

### AI 라우트 제거

호출하는 화면이 없어(구 `RankerView`가 유일한 사용처, Phase 3a에서 삭제됨) 제거했다.

- [x] `server/routes/ai.ts` + 테스트 삭제, `server/index.ts`에서 마운트 해제
- [x] `askAiAdvisor()` 삭제. POST 라우트가 하나도 남지 않아 `apiPost`와
      `express.json()` 미들웨어도 함께 제거
- [x] `@google/genai` 의존성 제거
- [x] `.env` / `.env.example`에서 `GEMINI_API_KEY` 제거,
      `metadata.json`의 `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` 해제

## 남은 과제 (Follow-ups)

- `lib/api`의 `getStatus`/`getMetadata`/`getImages`는 미사용. 서버 라우트의 타입 지정
  클라이언트로서 유지 중.
- **최근 N경기 누적 벤치마크** — 현재는 1경기 기준이라 랭커 표본이 작을 때 신뢰도가 낮다.
  최근 10경기 스쿼드를 합쳐 누적 실적으로 비교하면 분석 가치가 크게 올라간다.
- 클라이언트 라우터 미사용 — 탭 전환 시 URL이 변하지 않아 딥링크/뒤로가기 불가.
- E2E 테스트 없음. `server/index.ts`(부트스트랩)와 `MatchWinRateChart`는 커버리지 제외 수준.
