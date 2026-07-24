# FC Lens 리팩토링 상태 (STATE)

리팩토링 진행 상태 추적 문서입니다. 관련: [PLAN.md](./PLAN.md) · [SPEC.md](./SPEC.md)

- 최종 업데이트: Phase 2 완료, Phase 3 대기
- 기준 커밋(작업 시작): `054fbd5 refactor(api): improve NEXON API key validation`
- 범례: ⬜ 대기 · 🔄 진행중 · ✅ 완료 · ⏭️ 보류

## 전체 진행

| Phase | 내용 | 상태 |
| --- | --- | --- |
| 1 | 백엔드 구조 분리 (server/) | ✅ |
| 2 | 프론트 API 레이어 추가 (lib/api, hooks) | ✅ |
| 3 | 화면 재편 & 목업 제거 | ⬜ |
| 4 | 문서/마무리 | ⬜ |

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

## Phase 3 — 화면 재편 & 목업 제거

- [ ] 제거: PlayerSearchView / PlayerDetailView / SquadAnalysisView / PlayerPickerModal / mockData.ts
- [ ] `NexonUserView` → `OwnerView` 정리 + hooks/lib 이전
- [ ] `RankerView` ranker-stats 기반 재작성
- [ ] `App.tsx` / `BottomNav.tsx` 탭 재구성
- [ ] `types.ts` 정리 (Player 스탯/시세 타입 제거)
- [ ] `HomeView` 정리/대체
- [ ] `npm run lint` 통과

## Phase 4 — 문서/마무리

- [ ] `docs/architecture.md` 갱신
- [ ] `AGENTS.md` 갱신
- [ ] `README.md` 갱신
- [ ] 최종 `npm run lint` 그린

## 로그 (Log)

- Phase 1 착수: PLAN.md / STATE.md 작성 완료, 백엔드 분리 시작.
- Phase 1 완료: `server.ts`(633줄) → `server/{index,routes/nexon,routes/ai,lib/nexonClient,lib/divisions}.ts`로 분할. 랭커 경로 `ranker-stats` 수정. tsc/esbuild 검증 통과.
- Phase 2 완료: `src/lib/api/*`(client·types·nexon) + `src/hooks/*`(useAsync 기반 6종) 추가. 컴포넌트 인라인 fetch를 대체할 타입 지정 데이터 레이어 마련. tsc 통과.
