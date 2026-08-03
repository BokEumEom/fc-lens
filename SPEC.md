# FC Online Open API — 제공 API 명세 (SPEC)

넥슨 EA SPORTS FC Online **공식 Open API**가 제공하는 엔드포인트 목록입니다.
FC Lens는 이 명세 범위 안에서 기능을 구현합니다.

- 출처: <https://openapi.nexon.com/ko/game/fconline/?id=2>

## 공통 (Common)

| 항목 | 값 |
| --- | --- |
| REST Base URL | `https://open.api.nexon.com` |
| 정적 메타 Base URL | `https://open.api.nexon.com/static` |
| 이미지 Base URL | `https://fco.dn.nexoncdn.co.kr` |
| 인증 헤더 | `x-nxopen-api-key: {API_KEY}` |

> **인증**: User / Match / Ranker 엔드포인트는 API 키 헤더가 **필수**입니다.
> 정적 메타데이터(`/static/...`)와 이미지(`/live/externalAssets/...`)는 키가 **불필요**합니다.
> API 키는 서버에만 보관하고, 클라이언트는 자체 프록시(`/api/*`)를 경유합니다.

---

## 1. User — 계정 정보 조회

| Method | Endpoint | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/fconline/v1/id` | 계정 식별자(ouid) 조회 | ✅ |
| GET | `/fconline/v1/user/basic` | 기본 정보 조회 | ✅ |
| GET | `/fconline/v1/user/maxdivision` | 역대 최고 등급 조회 | ✅ |
| GET | `/fconline/v1/user/match` | 유저의 매치 기록 조회 | ✅ |
| GET | `/fconline/v1/user/trade` | 유저의 거래 기록 조회 | ✅ |

**Schemas**: `User`, `UserBasic`, `MaxDivision`, `MatchIdList`, `TradeList`, `ErrorMessage`

---

## 2. Match — 매치 정보 조회

| Method | Endpoint | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/fconline/v1/match-detail` | 매치 상세 기록 조회 | ✅ |

**Schemas**: `MatchDetail`, `ErrorMessage`

---

## 3. Ranker — 랭커 정보 조회

| Method | Endpoint | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/fconline/v1/ranker-stats` | TOP 10,000 랭커 유저가 사용한 선수의 20경기 통계 | ✅ |

**Schemas**: `RankerStats`, `ErrorMessage`

---

## 4. MetaData — 메타데이터 정보 조회

| Method | Endpoint | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/static/fconline/meta/matchtype.json` | 매치 종류(matchtype) 메타데이터 조회 | — |
| GET | `/static/fconline/meta/spid.json` | 선수 고유 식별자(spid) 메타데이터 조회 | — |
| GET | `/static/fconline/meta/seasonid.json` | 시즌 아이디(seasonId) 메타데이터 조회 | — |
| GET | `/static/fconline/meta/spposition.json` | 선수 포지션(spposition) 메타데이터 조회 | — |
| GET | `/static/fconline/meta/division.json` | 등급 식별자(division) 메타데이터 조회 | — |
| GET | `/static/fconline/meta/division-volta.json` | 볼타 공식경기 등급 식별자 메타데이터 조회 | — |

**Schemas**: `MatchTypeMeta`, `SpidMeta`, `SeasonIdMeta`, `SppositionMeta`, `DivisionMeta`, `DivisionVoltaMeta`, `ErrorMessage`

---

## 5. Image — 이미지 정보 조회

| Method | Endpoint | 설명 | 실측 |
| --- | --- | --- | --- |
| GET | `/live/externalAssets/common/playersAction/p{spid}.png` | 선수 액션샷 (시즌별 카드 아트) | ✅ 200 |
| GET | `/live/externalAssets/common/playersAction/p{pid}.png` | 선수 액션샷 (시즌 무관) | ✅ 200 |
| GET | `/live/externalAssets/common/players/p{spid}.png` | 선수 이미지 | ❌ **403** |
| GET | `/live/externalAssets/common/players/p{pid}.png` | 선수 이미지 | ✅ 200 |

> ⚠️ 공식 문서는 `players/`가 spid를 받는다고 적고 있으나 **실제로는 403**입니다.
> 초상 이미지는 반드시 시즌을 뗀 `pid = spid % 1_000_000`으로 요청해야 합니다.
> 액션샷만 두 형태를 모두 받습니다. `server/lib/meta.ts`의 `getPlayerImageUrl` 참고.

---

## 참고: 이 명세로 가능한 것 / 불가능한 것

| 공식 API로 **가능** | 공식 API로 **불가능** |
| --- | --- |
| 구단주 검색(id→ouid), 기본정보, 최고등급 | 선수 스탯(PAC/SHO/…, OVR) 조회 |
| 매치 기록·상세, 거래(이적) 기록 | 선수 시세(BP)·가격 이력·강화 시세 |
| 랭커 사용 선수 통계(ranker-stats) | 급여(salary) 값 |
| 메타데이터(spid=선수ID↔이름, 시즌, 포지션 등) | 스탯 기반 선수 검색/필터 |
| 선수/액션샷 이미지(CDN) | — |

> 선수 **이름·포지션·이미지**는 메타데이터(`spid.json`, `spposition.json`) + 이미지 CDN으로 확보 가능하지만,
> **능력치·시세**는 공식 API에 존재하지 않습니다.
