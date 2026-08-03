import React from 'react';

/**
 * 메타(랭커 벤치마크) 탭.
 *
 * `/fconline/v1/ranker-stats`는 랭커 순위표가 아니라 "지정한 선수를 TOP 10,000
 * 랭커가 썼을 때의 20경기 집계"를 돌려주는 엔드포인트다. 따라서 이 화면은
 * 매치 상세의 스쿼드(spid + spPosition)를 그대로 넘겨 "내 선수 실적 vs 랭커 평균"을
 * 비교하는 형태로 구현한다. (PLAN.md "랭킹 탭 재정의" 참고)
 *
 * 서버 라우트(`/api/nexon/ranker-stats`) 교체가 선행되어야 하므로 아직 미구현이다.
 */
export const MetaView: React.FC = () => (
  <div className="space-y-4 animate-in fade-in">
    <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4">
      <h2 className="text-sm font-bold text-white font-headline flex items-center gap-2">
        <span className="material-symbols-outlined text-[#B9F600] text-lg">leaderboard</span>
        랭커 벤치마크
      </h2>
      <p className="text-[11px] text-[#8A99AD] mt-1 font-data leading-relaxed">
        내가 쓴 선수의 실적을 TOP 10,000 랭커의 평균과 비교합니다.
      </p>
    </div>

    <div className="bg-[#161A1E] border border-dashed border-[#2D333B] rounded-2xl p-8 text-center space-y-2">
      <span className="material-symbols-outlined text-[#2D333B] text-4xl">construction</span>
      <p className="text-xs font-bold text-white">준비 중입니다</p>
      <p className="text-[11px] text-[#8A99AD] font-data leading-relaxed max-w-sm mx-auto">
        넥슨 공식 API의 <span className="text-[#B9F600]">ranker-stats</span>는 순위표가 아니라
        선수별 랭커 사용 통계를 제공합니다. 매치 상세의 스쿼드를 기준으로 비교하는 화면으로
        재설계 중입니다.
      </p>
    </div>
  </div>
);
