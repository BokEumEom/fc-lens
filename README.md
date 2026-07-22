# ⚽ FC Lens - Professional Grade Sports Analytics for FC Online

**FC Lens**는 FC Online (넥슨 EA SPORTS FC Online) 구단주 분들과 유저분들을 위한 **프로페셔널 구단 및 선수 전력 분석 플랫폼**입니다. 넥슨 오픈 API(Nexon Open API)와 실시간 스탯 엔진을 기반으로 계정 전력 분석, 실시간 라이브 경기 트래킹, 스쿼드 급여 분석, 선수 스탯 VS 레이더 차트 비교 기능을 제공합니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 🔍 넥슨 Open API 기반 구단주 전력 분석
- **계정 조회**: 구단주 닉네임 검색을 통한 OUID, 레벨, 역대 최고 공식경기 등급, 대표 구단 정보 연동
- **매치 히스토리**: 최근 공식 경기 20경기 승/무/패 데이터, 평균 점유율, 득실점 그래프 분석
- **🔴 실시간 LIVE 경기 감지**: 현재 플레이 중인 경기 실시간 스코어, 점유율, 슈팅수, 실시간 타임라인 이벤트 피드
- **이적시장 트래킹**: 최근 이적시장 선수 구매 및 판매 내역 조회
- **선수단 구성**: 대표 구단 선수 목록 및 주력 라인업 확인

### 2. 📊 선수 검색 & 1:1 비교 (Player Comparison & Radar Charts)
- **스탯 자동 계산**: 강화 등급(+1 ~ +10) 선택에 따른 스탯 가산치 자동 계산
- **듀얼 레이더 차트**: 두 선수의 6대 핵심 속성(PAC, SHO, PAS, DRI, DEF, PHY) 시각적 비교
- **상세 스탯 VS 표**: 스피드, 슛, 패스, 드리블, 수비, 피지컬, 약발, 개인기, BP 시세 차이 시각화
- **유사 선수 추천**: 포지션 및 클래스 기준 유사 플레이 스타일 선수 가이드

### 3. 🛡️ 스쿼드 분석기 (Squad Analyzer)
- **포메이션 빌더**: 4-2-3-1, 4-3-3, 4-4-2 등 대표 포메이션 드래그 & 클릭 배치
- **급여 캡(Salary Cap) 모니터링**: 250BP 제한 급여 자동 계산 및 초과 경고
- **전술 & 가성비 피드백**: 팀 총 구단 가치 및 포지션별 밸런스 리포트 제공

### 4. 🏆 TOP 랭커 분석 (Ranker Dashboard)
- **인기 포메이션**: 공식경기 상위 랭커들의 선호 포메이션 통계
- **픽률 높은 선수**: 포지션별 최다 기용 선수 TOP 랭킹 제공

### 5. 📱 Mobile-First 프리미엄 다크 UI
- **플로팅 탭 네비게이션**: 한 손 조작이 용이한 반응형 내비게이션 바
- **시각적 완성도**: 스포츠 데이터 분석에 최적화된 직관적인 네온 다크 모드

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion)
- **Backend / API**: Express (Node.js CJS Bundled), Nexon Open API Integration, Google GenAI SDK
- **Data Visualization**: Recharts, Custom SVG Radar Charts
- **Icons & Styling**: Lucide React, Google Material Symbols

---

## 🚀 시작하기 (Getting Started)

### 환경 변수 설정 (`.env`)
프로젝트 루트 디렉토리에 `.env` 파일을 생성하거나 `.env.example`을 참고하여 넥슨 오픈 API 키를 입력합니다.

```env
NEXON_OPENAPI_KEY=your_nexon_openapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행 (Port 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 📁 프로젝트 구조 (Project Structure)

```
.
├── server.ts                   # Express API 프록시 및 Nexon API 엔드포인트
├── src/
│   ├── App.tsx                 # 메인 애플리케이션 컴포넌트 & 탭 라우팅
│   ├── components/
│   │   ├── TopHeader.tsx       # 상단 헤더 & Nexon API 키 설정 모달
│   │   ├── BottomNav.tsx       # 모바일 최적화 플로팅 탭 네비게이션
│   │   ├── HomeView.tsx        # 메인 대시보드 (트렌드 선수, 시세)
│   │   ├── NexonUserView.tsx   # 넥슨 구단주 검색, 실시간 LIVE, 매치분석
│   │   ├── PlayerDetailView.tsx# 선수 상세 정보 & 듀얼 레이더 차트 비교
│   │   ├── PlayerSearchView.tsx# 선수 검색 및 필터링
│   │   ├── SquadAnalysisView.tsx# 스쿼드 빌더 및 급여 계산기
│   │   ├── RankerView.tsx      # TOP 랭커 메타 분석
│   │   └── PlayerPickerModal.tsx# 비교 및 스쿼드 교체용 선수 선택 모달
│   ├── data/
│   │   └── mockData.ts         # 선수 데이터 및 폴백 데모 정보
│   └── types.ts                # 타입 정의
├── package.json
└── vite.config.ts
```

---

## 📜 라이선스

This project is created for educational and personal gaming analytics purposes. Data is provided via Nexon Open API.
