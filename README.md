# ⚽ FC Lens — FC Online 구단주 분석

**FC Lens**는 넥슨 EA SPORTS FC Online 구단주를 위한 전력 분석 웹앱입니다.
넥슨 **공식 Open API**만을 데이터 소스로 사용하며, 구단주 전적·매치 상세·이적 내역과
"내가 쓴 선수 vs 랭커 평균" 벤치마크를 제공합니다.

> 기능 범위는 [`SPEC.md`](./SPEC.md)의 공식 API 명세를 따릅니다.
> 선수 능력치(PAC/SHO/…)와 시세(BP)는 공식 API에 존재하지 않으므로 다루지 않습니다.

---

## 🌟 주요 기능

### 👤 구단주
- 닉네임 검색으로 OUID·레벨·역대 최고 등급 조회
- 매치 타입별(공식경기 / 감독모드 / 클래식 / 볼타 공식) 최근 전적 집계
- 승률·평균 득점·평균 점유율 요약과 승률 추이 차트
- 🔴 진행 중 경기 감지 (최근 20분 내 경기 기준 추정)
- 경기별 득점자, 점유율·슈팅 유효율·패스/태클 성공률 상세

### ⚽ 매치
- 최근 매치 빠른 선택 → 상세 분석
- 양 팀 스코어보드와 점유율·유효슈팅·패스·태클 비교 바
- 선수별 경기 평점 (선수명·포지션·시즌·강화 등급 표시)

### 💱 이적
- 이적시장 구매/판매 내역 최근 20건
- 선수명·시즌·이미지·강화 등급·거래 금액

### 🏆 랭킹 — 랭커 벤치마크
- 선택한 경기의 내 스쿼드를 **TOP 10,000 랭커의 경기당 평균과 비교**
- 지표 6종: 골 · 어시스트 · 유효슈팅 · 드리블 성공 · 패스 성공 · 태클
- 선수별 랭커 표본 경기 수를 함께 표시해 신뢰도를 판단할 수 있음
- 미출전 선수는 자동 제외

### 📱 Mobile-First 다크 UI
- 하단 플로팅 4탭 내비게이션, 한 손 조작에 최적화된 반응형 레이아웃

---

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Recharts
- **Backend**: Express (Node.js), 넥슨 Open API 서버 사이드 프록시
- **Icons**: Lucide React, Google Material Symbols

---

## 🚀 시작하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env`를 만들고 넥슨 Open API 키를 입력합니다
([발급처](https://openapi.nexon.com/ko/game/fconline/?id=2)).

```env
NEXON_OPENAPI_KEY=your_nexon_openapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> **넥슨 키는 필수입니다.** 목 데이터 폴백이 없어 키가 없으면 모든 조회가 실패합니다.
> 키는 **서버에만** 존재합니다 — 브라우저는 키를 보관하지도, 전달하지도 않습니다.

### 2. 설치 및 실행

```bash
npm install

npm run dev      # 개발 서버 (포트 3000)
npm run lint     # 타입 체크
npm test         # 테스트
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 서버
```

---

## 📁 프로젝트 구조

```
.
├── server/                     # 넥슨 API 프록시 (키·CORS 전담)
│   ├── index.ts                # 진입점: dotenv → 라우터 → Vite/정적 → listen
│   ├── routes/{nexon,ai}.ts    # /api/nexon/*, /api/ai-squad-assistant
│   └── lib/
│       ├── nexonClient.ts      # Base URL · env 키 해석 · fetch 헬퍼
│       ├── divisions.ts        # 등급 코드 → 라벨
│       ├── meta.ts             # 선수명/포지션/시즌/매치타입 메타 캐시
│       └── transform.ts        # 넥슨 원본 → 뷰 모델 변환
├── src/
│   ├── App.tsx                 # 탭 라우팅 + 공유 훅 소유
│   ├── lib/api/                # client · nexon · types (API 레이어)
│   ├── hooks/                  # useOwnerData · useRankerStats · useToast
│   └── components/
│       ├── OwnerView / MatchView / TradeView / MetaView
│       ├── owner/ match/ meta/ common/
│       └── TopHeader · BottomNav
├── SPEC.md                     # 넥슨 공식 API 명세 (기능 범위 기준)
└── docs/architecture.md        # 기술 구조 문서
```

자세한 구조와 설계 근거는 [`docs/architecture.md`](./docs/architecture.md)를 참고하세요.

---

## 📜 라이선스

개인 학습 및 게임 분석 용도로 제작되었습니다. 데이터는 넥슨 Open API를 통해 제공됩니다.
