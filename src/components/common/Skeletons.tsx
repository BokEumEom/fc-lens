import React from 'react';

export const MatchSummarySkeleton: React.FC = () => (
  <div className="bg-[#182029] p-3.5 rounded-xl border border-[#2D333B] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col items-center space-y-1.5 py-1">
        <div className="h-2.5 w-16 bg-[#232B34] rounded" />
        <div className="h-5 w-20 bg-[#232B34] rounded mt-1" />
      </div>
    ))}
  </div>
);

export const MatchChartSkeleton: React.FC = () => (
  <div className="bg-[#182029] p-4 rounded-xl border border-[#2D333B] space-y-3 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D333B] pb-2.5">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-[#232B34] rounded-full" />
        <div className="h-3.5 w-48 bg-[#232B34] rounded" />
      </div>
      <div className="h-6 w-36 bg-[#232B34] rounded-lg" />
    </div>

    <div className="w-full h-52 flex flex-col justify-between py-2 space-y-2">
      <div className="flex justify-between items-center text-[10px] text-[#232B34]">
        <div className="h-2 w-full bg-[#232B34]/60 rounded" />
      </div>
      <div className="flex items-end justify-between gap-2 h-36 px-2">
        {[40, 65, 30, 80, 55, 90, 45, 70, 85, 60].map((h, idx) => (
          <div
            key={idx}
            className="w-full bg-[#232B34] rounded-t transition-all"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="h-2 w-full bg-[#232B34]/40 rounded" />
    </div>

    <div className="flex justify-between items-center pt-2 border-t border-[#2D333B]">
      <div className="h-3 w-32 bg-[#232B34] rounded" />
      <div className="h-3 w-40 bg-[#232B34] rounded" />
    </div>
  </div>
);

export const MatchCardSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="p-3.5 rounded-2xl border border-[#2D333B] bg-[#182029] space-y-3 animate-pulse"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 bg-[#232B34] rounded" />
              <div className="h-5 w-14 bg-[#232B34] rounded" />
              <div className="h-4 w-28 bg-[#232B34] rounded" />
              <div className="h-4 w-16 bg-[#232B34] rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-24 bg-[#232B34] rounded" />
              <div className="h-3 w-20 bg-[#232B34] rounded" />
              <div className="h-3 w-16 bg-[#232B34] rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="h-7 w-24 bg-[#232B34] rounded-xl" />
            <div className="h-7 w-20 bg-[#232B34] rounded-xl" />
          </div>
        </div>
        <div className="pt-2 border-t border-[#2D333B]/60 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="h-7 bg-[#161A1E] rounded-xl border border-[#2D333B] p-2 flex items-center gap-2">
            <div className="h-3 w-12 bg-[#232B34] rounded" />
            <div className="h-4 w-20 bg-[#232B34] rounded-lg" />
          </div>
          <div className="h-7 bg-[#161A1E] rounded-xl border border-[#2D333B] p-2 flex items-center gap-2">
            <div className="h-3 w-12 bg-[#232B34] rounded" />
            <div className="h-4 w-20 bg-[#232B34] rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
