# FC Lens 리팩토링 상태 (STATE)

리팩토링 진행 상태 추적 문서입니다. 관련: [PLAN.md](./PLAN.md) · [SPEC.md](./SPEC.md)

- 최종 업데이트: Phase 3b 완료, Phase 3c(랭킹 재설계) 대기
- 기준 커밋(작업 시작): `054fbd5 refactor(api): improve NEXON API key validation`
- 범례: ⬜ 대기 · 🔄 진행중 · ✅ 완료 · ⏭️ 보류

## 전체 진행

| Phase | 내용 | 상태 |
| --- | --- | --- |
| 1 | 백엔드 구조 분리 (server/) | ✅ |
| 2 | 프론트 API 레이어 추가 (lib/api, hooks) | ✅ |
| 3a | 탭 재구성 & 목업 제거 | ✅ |
| 3b | NexonUserView 분할 + hooks/lib 이전 | ✅ |
| 3c | 랭킹 탭 재설계 (ranker-stats) | ⬜ 설계 필요 |
| 4 | 문서/마무리 | ⬜ |

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

남은 항목:

- [ ] 화면 전환 애니메이션 복원 (3a에서 재마운트 방지를 위해 제거된 상태)

## Phase 3c — 랭킹 탭 재설계

⚠️ **`ranker-stats`는 랭커 순위표 엔드포인트가 아님** (실측 확인).

- 필수 파라미터: `matchtype` + `players=[{id: spid, po: spposition}]`
- 응답: 요청한 선수별 20경기 집계 `{spid, spPosition, status{shoot, goal, assist, dribble, passTry, passSuccess, block, tackle, matchCount}, createDate}`
- 즉 "TOP 10,000 랭커가 **그 선수를** 썼을 때의 평균 스탯" 조회이지, 랭커 유저 목록이 아님.
- 현재 `/api/nexon/rankers`는 `matchtype`만 보내 `OPENAPI00004`(invalid parameter)로 실패. UI도 없는 `rankers` 배열을 기대 중.
- 참고: 짧은 간격 연속 호출 시 `OPENAPI00007`(rate limit) 발생 → 배치/캐싱 필요.

- [ ] 랭킹 탭 컨셉 재정의 후 라우트·UI 재작성

## Phase 4 — 문서/마무리

- [ ] `docs/architecture.md` 갱신
- [ ] `AGENTS.md` 갱신
- [ ] `README.md` 갱신
- [ ] 최종 `npm run lint` 그린

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
