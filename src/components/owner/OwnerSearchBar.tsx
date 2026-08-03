import React, { useState } from 'react';

// 검색 예시용 구단주. 처음 방문한 사용자가 바로 화면을 확인해볼 수 있게 한다.
const SAMPLE_NICKNAMES = ['두치와뿌꾸', '감스트', '김병지', '환경', '신보석'];

interface OwnerSearchBarProps {
  currentNickname: string;
  loading: boolean;
  onSearch: (nickname: string) => void;
}

export const OwnerSearchBar: React.FC<OwnerSearchBarProps> = ({
  currentNickname,
  loading,
  onSearch,
}) => {
  const [query, setQuery] = useState(currentNickname);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  const selectPreset = (name: string) => {
    setQuery(name);
    onSearch(name);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#C3CAAC] text-sm">
          person_search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="구단주 닉네임 검색 (예: 두치와뿌꾸)"
          className="w-full bg-[#161A1E] border border-[#2D333B] rounded-xl py-2.5 pl-9 pr-24 text-white text-xs placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-3 py-1.5 rounded-lg hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
        >
          {loading ? (
            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
          ) : (
            <span>검색</span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        <span className="font-data text-[10px] text-[#C3CAAC] whitespace-nowrap">예시:</span>
        {SAMPLE_NICKNAMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => selectPreset(name)}
            className={`px-2.5 py-1 rounded-full font-data text-[11px] whitespace-nowrap border transition-all ${
              currentNickname === name
                ? 'bg-[#B9F600] text-[#141F00] font-bold border-[#B9F600]'
                : 'bg-[#182029] text-[#C3CAAC] border-[#2D333B] hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </form>
  );
};
