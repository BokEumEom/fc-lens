import React from 'react';
import type { OwnerData } from '../hooks/useOwnerData';
import { OwnerSearchBar } from './owner/OwnerSearchBar';
import { OwnerAccountCard } from './owner/OwnerAccountCard';
import { MatchHistoryList } from './owner/MatchHistoryList';
import { LiveMatchCard } from './match/LiveMatchCard';
import { MatchWinRateChart } from './match/MatchWinRateChart';
import { MatchChartSkeleton } from './common/Skeletons';

// 넥슨 matchtype 메타(/static/fconline/meta/matchtype.json) 기준 코드/이름
const MATCH_TYPES = [
  { code: '50', label: '공식경기' },
  { code: '52', label: '감독모드' },
  { code: '40', label: '클래식 1on1' },
  { code: '214', label: '볼타 공식' },
];

interface OwnerViewProps {
  owner: OwnerData;
  /** 매치 상세로 이동 (하단 탭 전환 포함) */
  onOpenMatchDetail: (matchId: string) => void;
  onCopyOuid: (ouid: string) => void;
}

export const OwnerView: React.FC<OwnerViewProps> = ({ owner, onOpenMatchDetail, onCopyOuid }) => (
  <div className="space-y-4 animate-in fade-in">
    <OwnerSearchBar
      currentNickname={owner.nickname}
      loading={owner.accountLoading}
      onSearch={owner.searchOwner}
    />

    {!owner.nickname && !owner.accountLoading && (
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center space-y-2">
        <span className="material-symbols-outlined text-[#B9F600] text-4xl">person_search</span>
        <p className="text-sm font-bold text-white">구단주를 검색해보세요</p>
        <p className="text-[11px] text-[#C3CAAC] font-data leading-relaxed">
          FC Online 닉네임으로 전적 · 매치 상세 · 이적 내역 · 랭커 벤치마크를 확인할 수 있습니다.
        </p>
      </div>
    )}

    {owner.accountLoading && (
      <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 flex flex-col items-center justify-center space-y-2 text-center">
        <span className="material-symbols-outlined text-[#B9F600] text-3xl animate-spin">sync</span>
        <p className="font-data text-xs text-white font-bold">넥슨 Open API 조회 중...</p>
        <p className="text-[11px] text-[#C3CAAC]">OUID · 최고 등급 · 매치 기록을 불러옵니다</p>
      </div>
    )}

    {!owner.accountLoading && owner.accountError && (
      <div className="bg-[#93000A]/30 border border-[#FF4B4B]/60 rounded-2xl p-6 text-center space-y-2">
        <span className="material-symbols-outlined text-[#FF4B4B] text-3xl">error</span>
        <p className="text-sm font-bold text-white">{owner.accountError}</p>
        <p className="text-xs text-[#C3CAAC]">FC Online에 등록된 정확한 닉네임인지 확인해주세요.</p>
      </div>
    )}

    {!owner.accountLoading && owner.account && (
      <div className="space-y-4">
        <OwnerAccountCard
          account={owner.account}
          summary={owner.matchesSummary}
          onCopyOuid={() => onCopyOuid(owner.account!.ouid)}
        />

        <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-data text-xs text-white font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#B9F600] text-sm">history</span>
              최근 매치 전적
            </h3>

            <div className="flex items-center gap-1 bg-[#182029] p-1 rounded-xl border border-[#2D333B]">
              {MATCH_TYPES.map((mt) => (
                <button
                  key={mt.code}
                  type="button"
                  onClick={() => owner.setMatchType(mt.code)}
                  className={`px-2.5 py-1 rounded-lg font-data text-[10px] transition-all ${
                    owner.matchType === mt.code
                      ? 'bg-[#B9F600] text-[#141F00] font-bold shadow-sm'
                      : 'text-[#C3CAAC] hover:text-white'
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          <LiveMatchCard
            liveData={owner.liveMatch}
            loading={owner.liveLoading}
            onRefresh={owner.refreshLive}
          />

          {owner.matchesLoading ? (
            <MatchChartSkeleton />
          ) : owner.matches.length > 0 ? (
            <MatchWinRateChart
              matches={owner.matches}
              summary={owner.matchesSummary}
              onSelectMatch={onOpenMatchDetail}
            />
          ) : null}

          <MatchHistoryList
            matches={owner.matches}
            loading={owner.matchesLoading}
            error={owner.matchesError}
            onOpenDetail={onOpenMatchDetail}
          />
        </div>
      </div>
    )}
  </div>
);
