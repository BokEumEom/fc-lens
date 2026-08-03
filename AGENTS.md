# AGENTS.md

FC Lens 레포에서 작업하는 AI 에이전트(및 기여자)를 위한 안내 문서입니다.

## 0. 시작 전 필수 (Read First)

**작업을 시작하기 전에 반드시 [`docs/architecture.md`](./docs/architecture.md)를 먼저 읽는다.**
이 문서는 기술 스택, 폴더 구조, 주요 모듈 역할, 데이터 흐름의 **단일 기준(source of truth)**이다.
코드를 탐색하기 전에 여기서 전체 구조를 파악할 것.

- 사용자용 기능 소개: [`README.md`](./README.md)
- 기술 구조/설계: [`docs/architecture.md`](./docs/architecture.md) ← **아키텍처 관련 판단은 항상 이 문서를 근거로**
- **기능 범위의 기준**: [`SPEC.md`](./SPEC.md) — 넥슨 공식 Open API 명세

## 1. 프로젝트 한 줄 요약

단일 Express 서버(`server/`)가 React 19 SPA를 서빙하면서 `/api/*`로 넥슨 Open API를
서버 사이드 프록시하는 FC Online **구단주 분석** 웹앱. 상세는 `docs/architecture.md` 참고.

## 2. 개발 명령 (Commands)

| 목적 | 명령 |
|------|------|
| 개발 서버 (포트 3000) | `npm run dev` |
| 타입 체크 | `npm run lint` (= `tsc --noEmit`) |
| 테스트 | `npm test` (= `vitest run`) |
| 테스트 워치 | `npm run test:watch` |
| 커버리지 (임계치 검사 포함) | `npm run test:coverage` |
| 프로덕션 빌드 | `npm run build` |
| 프로덕션 실행 | `npm start` |

- 환경변수는 `.env.example`를 복사해 `.env` 생성(`NEXON_OPENAPI_KEY`, `GEMINI_API_KEY`).
- **넥슨 키가 없으면 앱은 동작하지 않는다.** 목 데이터 폴백은 없다(Phase 3a에서 전부 제거).
  키 없이 확인하려면 UI의 "API 키 설정"으로 개인 키를 넣을 수 있다.

## 3. 코딩 규칙 (Conventions)

- **언어/스택**: TypeScript + React 19 함수형 컴포넌트, Tailwind CSS v4, `motion/react`.
- **기능 범위**: `SPEC.md`(공식 API)에 없는 데이터는 만들지 않는다.
  선수 능력치·시세·급여는 공식 API에 **존재하지 않는다.**
- **데이터 흐름 고정**: `컴포넌트 → src/hooks → src/lib/api → /api/*`.
  **컴포넌트에서 `fetch`를 직접 호출하지 않는다.**
- **응답 스키마는 서버가 기준**: 화면이 쓰는 형태로 서버에서 정규화하고,
  `src/lib/api/types.ts`를 유일한 타입 기준으로 삼는다. 컴포넌트에 로컬 DTO를 새로 만들지 않는다.
- **불변성**: 상태·객체는 새로 생성하고 직접 변경(mutation)하지 않는다.
- **파일 분리**: 컴포넌트는 200~400줄 유지. 커지면 하위 폴더(`owner/`, `match/`, `meta/`, `common/`)로 분할.
- **API 키 노출 금지**: 외부 API 호출은 반드시 `/api/*`를 경유. 브라우저에서 직접 호출 금지
  (넥슨 Open API는 CORS를 허용하지 않아 애초에 불가능하다).
- **비동기 가드**: 훅의 `useEffect`에서 조회할 때는 `cancelled` 플래그로 경쟁 상태를 막는다.
- 작업 완료 전 `npm run lint`로 타입 오류가 없는지 확인한다.

## 3.1 테스트 (Vitest)

작업 완료 전 `npm test`가 그린이어야 한다. 커버리지 임계치(statements/lines 80%,
branches 75%)는 `vitest.config.ts`에 박혀 있어 미달 시 `test:coverage`가 실패한다.

**어디를 우선 테스트하나** — 이 프로젝트에서 실제로 버그가 났던 곳은 전부
"서버 응답 ↔ 클라이언트 기대"의 계약 불일치였다. 따라서 우선순위는:

1. `server/lib/transform.ts` — 넥슨 원본 → 뷰 모델 변환. 실제 응답 픽스처로 검증한다.
2. `server/routes/*` — 파라미터 검증, 에러 상태 코드, 메타 조인 (supertest + `fetch` stub).
3. `src/hooks/*` — 재조회 조건과 `cancelled` 가드.
4. 컴포넌트는 **로직이 있는 것만** (포맷팅·필터·집계). 순수 레이아웃은 대상이 아니다.

**픽스처**: `server/lib/__fixtures__/`에 실제 넥슨 응답을 저장해 둔다.
새 엔드포인트를 다룰 때는 실 응답을 한 번 받아 픽스처로 남기고 그것으로 검증한다.
스키마가 바뀌면 픽스처를 갱신하고, 그때 깨지는 테스트가 곧 영향 범위다.

**네트워크 금지**: 테스트는 실제 넥슨 API를 호출하지 않는다. `vi.stubGlobal('fetch', ...)`로
막는다. `server/lib/meta.ts`는 모듈 수준 캐시를 쓰므로 `vi.resetModules()` 후 재import한다.

## 3.2 타입 게이트 주의 (중요)

`@types/react`가 설치되어 있어야 `tsc`가 JSX prop 오류를 검출한다.
미설치 상태에서는 `React.FC<...>`가 `any`로 취급되어 **prop 누락·타입 불일치가 전혀 잡히지 않는다.**
`npm run lint`가 통과했다고 해서 컴포넌트 배선이 옳다는 뜻은 아니므로,
`node_modules/@types/react`가 실제로 존재하는지 확인할 것.

또한 `res.json()`은 `any`를 반환한다. 서버 응답을 상태에 넣을 때는
`src/lib/api`의 타입 지정 함수를 경유해야 계약 불일치가 드러난다.

## 4. 문서 최신화 규칙 (Docs Sync — 중요)

**중요한 구조 변경이 발생하면 `docs/architecture.md`를 같은 작업(같은 커밋/PR)에서 함께 갱신한다.**
코드만 바꾸고 문서를 방치하지 않는다. "문서 최신화"는 작업 완료 조건(Definition of Done)의 일부다.

아래에 해당하면 `docs/architecture.md`를 갱신해야 한다.

- [ ] 기술 스택 / 주요 의존성 추가·제거·메이저 업그레이드
- [ ] 폴더 구조 변경, 컴포넌트/훅/모듈 추가·삭제·역할 변경
- [ ] `server/routes/*` API 엔드포인트 추가·삭제·**응답 스키마 변경**
- [ ] 데이터 흐름 변경(새 외부 연동, 인증/키 처리 방식, `localStorage` 스키마 등)
- [ ] 탭 구성·라우팅 구조 변경

갱신 시 체크:

1. `docs/architecture.md`의 해당 섹션(2 기술 스택 / 3 폴더 구조 / 4 모듈 역할 / 5 데이터 흐름)을 실제 코드와 일치시킨다.
2. 문서 상단의 "최종 검증 기준 커밋"을 최신 커밋으로 갱신한다.
3. 필요하면 `README.md`(사용자용 설명)도 함께 정리한다.

> 문서를 갱신하지 않아도 되는 변경(예: 스타일 미세 조정, 문구 수정)은 그대로 진행해도 된다.
> 판단이 애매하면 "다음 사람이 구조를 이해하는 데 영향이 있는가?"를 기준으로 결정한다.

## 5. 작업 전 확인 체크리스트

- [ ] `docs/architecture.md`를 읽고 관련 모듈의 역할·데이터 흐름을 파악했는가?
- [ ] 변경이 위 4장의 "문서 최신화 규칙"에 해당하는가? → 해당하면 문서도 함께 수정
- [ ] `npm run lint` 통과했는가?
- [ ] `npm test` 통과했는가? 응답 스키마를 바꿨다면 픽스처와 테스트도 함께 갱신했는가?
