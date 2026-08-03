import React from 'react';
import type { AccountInfo, MatchesSummary } from '../../lib/api/types';

interface OwnerAccountCardProps {
  account: AccountInfo;
  summary: MatchesSummary | null;
  onCopyOuid: () => void;
}

const SUMMARY_PLACEHOLDER = '—';

export const OwnerAccountCard: React.FC<OwnerAccountCardProps> = ({
  account,
  summary,
  onCopyOuid,
}) => (
  <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-xl">
    <div className="flex items-start justify-between border-b border-[#2D333B] pb-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#232B34] border-2 border-[#B9F600] flex items-center justify-center text-[#B9F600] font-black font-headline text-lg shadow-[0_0_15px_rgba(185,246,0,0.2)]">
          <span>Lv.{account.level}</span>
        </div>
        <div>
          <h2 className="text-lg font-black text-white font-headline">{account.nickname}</h2>
          <p className="font-data text-[10px] text-[#C3CAAC] mt-0.5 font-mono">
            OUID: {account.ouid}
          </p>
        </div>
      </div>

      <button
        onClick={onCopyOuid}
        className="p-2 bg-[#232B34] hover:bg-[#2d3642] text-[#C3CAAC] hover:text-white rounded-xl text-xs flex items-center gap-1 border border-[#2D333B]"
      >
        <span className="material-symbols-outlined text-sm">content_copy</span>
        <span className="font-data text-[10px]">OUID 복사</span>
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3 pt-1">
      <div className="bg-[#182029] p-3 rounded-xl border border-[#2D333B]">
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">역대 최고 등급</p>
        <p className="text-sm font-bold text-[#00FF87] mt-0.5">{account.maxDivision}</p>
      </div>
      <div className="bg-[#182029] p-3 rounded-xl border border-[#2D333B]">
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">달성일</p>
        <p className="font-data text-xs text-white mt-0.5">
          {account.achievementDate
            ? new Date(account.achievementDate).toLocaleDateString()
            : SUMMARY_PLACEHOLDER}
        </p>
      </div>
    </div>

    <div className="bg-[#182029] p-3.5 rounded-xl border border-[#2D333B] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <div>
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">최근 승률</p>
        <p className="text-base font-black text-[#B9F600] font-headline">
          {summary?.winRate ?? SUMMARY_PLACEHOLDER}
        </p>
      </div>
      <div>
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">전적 (승/무/패)</p>
        <p className="text-xs font-bold text-white mt-1">
          {summary ? (
            <>
              <span className="text-[#00FF87]">{summary.wins}승</span>{' '}
              <span className="text-amber-400">{summary.draws}무</span>{' '}
              <span className="text-[#FF4B4B]">{summary.losses}패</span>
            </>
          ) : (
            SUMMARY_PLACEHOLDER
          )}
        </p>
      </div>
      <div>
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">평균 득점</p>
        <p className="text-xs font-bold text-white mt-1">
          {summary ? `${summary.avgGoals} 골` : SUMMARY_PLACEHOLDER}
        </p>
      </div>
      <div>
        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">평균 점유율</p>
        <p className="text-xs font-bold text-white mt-1">
          {summary?.avgPossession ?? SUMMARY_PLACEHOLDER}
        </p>
      </div>
    </div>
  </div>
);
