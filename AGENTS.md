# AGENTS.md

FC Lens 레포에서 작업하는 AI 에이전트(및 기여자)를 위한 안내 문서입니다.

## 0. 시작 전 필수 (Read First)

**작업을 시작하기 전에 반드시 [`docs/architecture.md`](./docs/architecture.md)를 먼저 읽는다.**
이 문서는 기술 스택, 폴더 구조, 주요 모듈 역할, 데이터 흐름의 **단일 기준(source of truth)**이다.
코드를 탐색하기 전에 여기서 전체 구조를 파악할 것.

- 사용자용 기능 소개: [`README.md`](./README.md)
- 기술 구조/설계: [`docs/architecture.md`](./docs/architecture.md) ← **아키텍처 관련 판단은 항상 이 문서를 근거로**

## 1. 프로젝트 한 줄 요약

단일 Express 서버(`server.ts`)가 React 19 SPA를 서빙하면서 `/api/*`로 넥슨 Open API와
Google Gemini를 서버 사이드 프록시하는 FC Online 전력 분석 웹앱. 상세는 `docs/architecture.md` 참고.

## 2. 개발 명령 (Commands)

| 목적 | 명령 |
|------|------|
| 개발 서버 (포트 3000) | `npm run dev` |
| 타입 체크 | `npm run lint` (= `tsc --noEmit`) |
| 프로덕션 빌드 | `npm run build` |
| 프로덕션 실행 | `npm start` |

- 환경변수는 `.env.example`를 복사해 `.env` 생성(`NEXON_OPENAPI_KEY`, `GEMINI_API_KEY`).
- 키가 없어도 앱 대부분은 목 데이터(`src/data/mockData.ts`)로 동작한다.

## 3. 코딩 규칙 (Conventions)

- **언어/스택**: TypeScript + React 19 함수형 컴포넌트, Tailwind CSS v4, `motion/react`.
- **불변성**: 상태·객체는 새로 생성하고 직접 변경(mutation)하지 않는다.
- **파일 분리**: 큰 컴포넌트는 기능 단위로 분할(고응집·저결합). 새 화면은 `src/components/`에 추가.
- **API 키 노출 금지**: 넥슨/Gemini 호출은 반드시 `server.ts`의 `/api/*`를 경유. 브라우저에서 외부 API 직접 호출 금지.
- **폴백 유지**: 외부 API 실패 시에도 화면이 목 데이터로 동작하도록 방어 코드를 유지한다.
- 작업 완료 전 `npm run lint`로 타입 오류가 없는지 확인한다.

## 4. 문서 최신화 규칙 (Docs Sync — 중요)

**중요한 구조 변경이 발생하면 `docs/architecture.md`를 같은 작업(같은 커밋/PR)에서 함께 갱신한다.**
코드만 바꾸고 문서를 방치하지 않는다. "문서 최신화"는 작업 완료 조건(Definition of Done)의 일부다.

아래에 해당하면 `docs/architecture.md`를 갱신해야 한다.

- [ ] 기술 스택 / 주요 의존성 추가·제거·메이저 업그레이드
- [ ] 폴더 구조 변경, 컴포넌트/모듈 추가·삭제·역할 변경
- [ ] `server.ts` API 엔드포인트 추가·삭제·시그니처 변경
- [ ] 데이터 흐름 변경(새 외부 연동, 인증/키 처리 방식, `localStorage` 스키마 등)
- [ ] 라우팅/화면 연결 구조 변경 (예: 현재 미연결 상태인 `NexonUserView` 연결)

갱신 시 체크:

1. `docs/architecture.md`의 해당 섹션(2 기술 스택 / 3 폴더 구조 / 4 모듈 역할 / 5 데이터 흐름)을 실제 코드와 일치시킨다.
2. 문서 상단의 "최종 검증 기준 커밋"을 최신 커밋으로 갱신한다.
3. 필요하면 `README.md`(사용자용 설명)도 함께 정리한다.

> 문서를 갱신하지 않아도 되는 변경(예: 스타일 미세 조정, 문구 수정, 목 데이터 값 변경)은 그대로 진행해도 된다.
> 판단이 애매하면 "다음 사람이 구조를 이해하는 데 영향이 있는가?"를 기준으로 결정한다.

## 5. 작업 전 확인 체크리스트

- [ ] `docs/architecture.md`를 읽고 관련 모듈의 역할·데이터 흐름을 파악했는가?
- [ ] 변경이 위 4장의 "문서 최신화 규칙"에 해당하는가? → 해당하면 문서도 함께 수정
- [ ] `npm run lint` 통과했는가?
