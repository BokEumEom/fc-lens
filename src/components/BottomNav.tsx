import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'search', label: '선수 검색', icon: 'person_search' },
    { id: 'squad', label: '스쿼드', icon: 'analytics' },
    { id: 'ranker', label: '랭킹', icon: 'leaderboard' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-[#12161C]/95 backdrop-blur-2xl border border-[#2D333B]/90 rounded-2xl sm:rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-1.5 transition-all">
        <div className="grid grid-cols-4 gap-1 items-center justify-items-stretch">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl sm:rounded-2xl transition-all duration-200 active:scale-95 min-h-[54px] select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-[#B9F600]/20 to-[#B9F600]/5 text-[#B9F600] border border-[#B9F600]/40 shadow-[0_0_15px_rgba(185,246,0,0.25)] font-bold'
                    : 'text-[#8A99AD] hover:text-white hover:bg-[#232B34]/50 border border-transparent'
                }`}
              >
                {/* Active Top Glow Line Indicator */}
                {isActive && (
                  <span className="absolute top-0.5 w-6 h-1 bg-[#B9F600] rounded-full shadow-[0_0_8px_#B9F600]" />
                )}

                <span
                  className={`material-symbols-outlined transition-all duration-200 ${
                    isActive ? 'text-[24px] scale-110 text-[#B9F600] mt-0.5' : 'text-[22px] text-[#8A99AD]'
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>

                <span
                  className={`font-data text-[10px] sm:text-[11px] tracking-tight uppercase whitespace-nowrap ${
                    isActive ? 'text-[#B9F600] font-black' : 'text-[#8A99AD] font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};


