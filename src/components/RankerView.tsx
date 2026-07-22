import React, { useState } from 'react';
import { Player } from '../types';
import { formatBP } from '../data/mockData';

interface RankerViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

export const RankerView: React.FC<RankerViewProps> = ({ players, onSelectPlayer }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const topPlayersByWinRate = [...players].sort((a, b) => b.ovr - a.ovr).slice(0, 5);

  const metaFormations = [
    { rank: 1, name: '4-2-3-1 Offensive', winRate: '58.4%', usage: '34.2%', trend: '+2.1%' },
    { rank: 2, name: '4-3-3 Attack', winRate: '56.8%', usage: '28.5%', trend: '+1.4%' },
    { rank: 3, name: '5-2-3 Counter', winRate: '55.1%', usage: '18.9%', trend: '-0.5%' },
    { rank: 4, name: '4-1-2-1-2 Narrow', winRate: '54.2%', usage: '12.1%', trend: '+0.8%' },
  ];

  const handleAskAiAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai-squad-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.advice || 'Consider upgrading your ST to 24TY Kylian Mbappé for maximum counter-attack pace.');
      } else {
        // Fallback intelligent advice
        setTimeout(() => {
          setAiResponse(
            `Based on your query "${aiPrompt}": We recommend investing in 24TY Jude Bellingham (115 OVR, CM) or 24TY Kylian Mbappé (116 OVR, ST) for the highest win rate in the current 4-2-3-1 Meta!`
          );
          setAiLoading(false);
        }, 1200);
        return;
      }
    } catch (err) {
      setTimeout(() => {
        setAiResponse(
          `Recommendation for "${aiPrompt}": For budget efficiency, consider 23HW Erling Haaland (115 OVR) or LN Son Heung-min (112 OVR, 5/5 Weak Foot) to maximize goal conversion.`
        );
        setAiLoading(false);
      }, 1200);
      return;
    }

    setAiLoading(false);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-6">
      <div>
        <p className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest">
          META RANKINGS
        </p>
        <h1 className="text-xl font-bold text-white">Ranker & Meta Intelligence</h1>
      </div>

      {/* AI Squad Advisor Panel */}
      <section className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#B9F600]">auto_awesome</span>
          <h2 className="text-sm font-bold text-white">AI Tactical Advisor</h2>
        </div>
        <p className="text-xs text-[#C3CAAC]">
          Ask for tactical advice, player upgrades, or budget squad recommendations.
        </p>

        <form onSubmit={handleAskAiAdvisor} className="flex gap-2 pt-1">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Best ST for 2 Billion BP budget?"
            className="flex-1 bg-[#232B34] border border-[#2D333B] rounded-xl px-3 py-2 text-white text-xs placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="bg-[#B9F600] text-[#141F00] px-4 py-2 rounded-xl font-data text-xs font-bold hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
          >
            {aiLoading ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span>Ask</span>
            )}
          </button>
        </form>

        {aiResponse && (
          <div className="bg-[#182029] border border-[#B9F600]/40 rounded-xl p-3 text-xs text-white leading-relaxed animate-in fade-in">
            <span className="font-data text-[10px] text-[#B9F600] uppercase font-bold block mb-1">
              AI Insight:
            </span>
            {aiResponse}
          </div>
        )}
      </section>

      {/* Top Meta Formations Table */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">Top Formations Ranking</h2>
        <div className="glass-card rounded-xl overflow-hidden border border-[#2D333B]">
          <div className="divide-y divide-[#2D333B]">
            {metaFormations.map((f) => (
              <div key={f.rank} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                      f.rank === 1
                        ? 'bg-[#B9F600] text-[#141F00]'
                        : 'bg-[#232B34] text-white'
                    }`}
                  >
                    #{f.rank}
                  </span>
                  <div>
                    <p className="font-bold text-xs text-white">{f.name}</p>
                    <p className="font-data text-[10px] text-[#C3CAAC]">
                      Usage: {f.usage}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-data text-xs font-bold text-[#00FF87]">{f.winRate}</p>
                  <p className="font-data text-[10px] text-[#C3CAAC]">Win Rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Meta Players */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">Top Meta Player Picks</h2>
        <div className="space-y-2">
          {topPlayersByWinRate.map((player, idx) => (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="bg-[#161A1E] border border-[#2D333B] hover:border-[#B9F600] rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="font-data text-xs font-bold text-[#C3CAAC] w-4">
                  #{idx + 1}
                </span>
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#2D333B] bg-[#232B34]"
                />
                <div>
                  <p className="font-bold text-xs text-white">{player.name}</p>
                  <p className="font-data text-[10px] text-[#C3CAAC]">
                    {player.season} • {player.position}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-data text-xs font-bold text-[#B9F600]">
                  {player.ovr} OVR
                </p>
                <p className="font-data text-[10px] text-white">
                  {formatBP(player.bpPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
