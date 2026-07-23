import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Player } from '../types';
import { formatBP } from '../data/mockData';
import { PlayerPickerModal } from './PlayerPickerModal';

interface PlayerDetailViewProps {
  player: Player;
  allPlayers: Player[];
  favoriteIds: string[];
  onToggleFavorite: (playerId: string) => void;
  onBack: () => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({
  player,
  allPlayers,
  favoriteIds,
  onToggleFavorite,
  onBack,
  onSelectPlayer,
}) => {
  const isFavorite = favoriteIds.includes(player.id);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1W' | '1M' | '3M'>('1M');
  const [copiedLink, setCopiedLink] = useState(false);

  // Comparison State
  const [comparePlayer, setComparePlayer] = useState<Player | null>(null);
  const [compareGrade, setCompareGrade] = useState(1);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Similar players calculation (same position or club or class)
  const similarPlayers = allPlayers
    .filter((p) => p.id !== player.id && (p.position === player.position || p.club === player.club))
    .slice(0, 4);

  // Calculate stats based on enhancement grade (+1 = base, +3 = +2, +5 = +5, +8 = +10)
  const getGradeBonus = (grade: number) => (grade === 1 ? 0 : grade === 3 ? 2 : grade === 5 ? 5 : 10);
  const gradeBonus = getGradeBonus(selectedGrade);
  const compareGradeBonus = comparePlayer ? getGradeBonus(compareGrade) : 0;

  const currentOvr = player.ovr + gradeBonus;
  const compareOvr = comparePlayer ? comparePlayer.ovr + compareGradeBonus : 0;

  // Radar chart points calculation (normalized to 130 max stat)
  const maxStat = 130;
  const p1Stats = [
    { label: 'PAC', value: Math.min(player.pac + gradeBonus, maxStat) },
    { label: 'SHO', value: Math.min(player.sho + gradeBonus, maxStat) },
    { label: 'PAS', value: Math.min(player.pas + gradeBonus, maxStat) },
    { label: 'DRI', value: Math.min(player.dri + gradeBonus, maxStat) },
    { label: 'DEF', value: Math.min(player.def + gradeBonus, maxStat) },
    { label: 'PHY', value: Math.min(player.phy + gradeBonus, maxStat) },
  ];

  const p2Stats = comparePlayer
    ? [
        { label: 'PAC', value: Math.min(comparePlayer.pac + compareGradeBonus, maxStat) },
        { label: 'SHO', value: Math.min(comparePlayer.sho + compareGradeBonus, maxStat) },
        { label: 'PAS', value: Math.min(comparePlayer.pas + compareGradeBonus, maxStat) },
        { label: 'DRI', value: Math.min(comparePlayer.dri + compareGradeBonus, maxStat) },
        { label: 'DEF', value: Math.min(comparePlayer.def + compareGradeBonus, maxStat) },
        { label: 'PHY', value: Math.min(comparePlayer.phy + compareGradeBonus, maxStat) },
      ]
    : [];

  // Recharts Data Format for Key Attributes (Pace, Shooting, Passing, Dribbling, Defense, Physical)
  const rechartsData = [
    {
      attribute: 'PAC',
      fullName: 'Pace (스피드)',
      p1: p1Stats[0].value,
      p2: comparePlayer ? p2Stats[0].value : undefined,
    },
    {
      attribute: 'SHO',
      fullName: 'Shooting (슈팅)',
      p1: p1Stats[1].value,
      p2: comparePlayer ? p2Stats[1].value : undefined,
    },
    {
      attribute: 'PAS',
      fullName: 'Passing (패스)',
      p1: p1Stats[2].value,
      p2: comparePlayer ? p2Stats[2].value : undefined,
    },
    {
      attribute: 'DRI',
      fullName: 'Dribbling (드리블)',
      p1: p1Stats[3].value,
      p2: comparePlayer ? p2Stats[3].value : undefined,
    },
    {
      attribute: 'DEF',
      fullName: 'Defense (수비)',
      p1: p1Stats[4].value,
      p2: comparePlayer ? p2Stats[4].value : undefined,
    },
    {
      attribute: 'PHY',
      fullName: 'Physical (피지컬)',
      p1: p1Stats[5].value,
      p2: comparePlayer ? p2Stats[5].value : undefined,
    },
  ];

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#141C25]/95 border border-[#2D333B] p-2.5 rounded-xl shadow-xl font-data text-xs space-y-1">
          <p className="font-bold text-white border-b border-[#2D333B] pb-1">{data.fullName}</p>
          <p className="text-[#B9F600] font-bold">
            {player.name}: <span className="text-white">{data.p1}</span>
          </p>
          {comparePlayer && data.p2 !== undefined && (
            <p className="text-[#38BDF8] font-bold">
              {comparePlayer.name}: <span className="text-white">{data.p2}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="pb-24 pt-2 text-[#DBE3F0] space-y-6 animate-in fade-in duration-300">
      {/* Detail Header Bar */}
      <header className="sticky top-0 z-40 bg-[#182029]/90 backdrop-blur-md border-b border-[#2D333B] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white hover:text-[#B9F600] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-data text-xs font-bold">Back</span>
        </button>

        <span className="font-headline font-black text-sm text-[#B9F600] tracking-wider uppercase">
          Player Profile
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!comparePlayer) {
                if (similarPlayers.length > 0) {
                  setComparePlayer(similarPlayers[0]);
                } else {
                  setIsPickerOpen(true);
                }
              } else {
                setIsPickerOpen(true);
              }
            }}
            className="px-2.5 py-1 bg-[#B9F600]/20 hover:bg-[#B9F600]/30 text-[#B9F600] border border-[#B9F600]/40 rounded-lg text-xs font-data font-bold flex items-center gap-1 transition-all"
            title="Compare with another player"
          >
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            <span className="hidden sm:inline">{comparePlayer ? '선수 비교 변경' : '선수 비교'}</span>
            <span className="sm:hidden">{comparePlayer ? '변경' : '비교'}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 text-[#C3CAAC] hover:text-[#B9F600] transition-colors relative"
            title="Share profile"
          >
            <span className="material-symbols-outlined text-[20px]">
              {copiedLink ? 'check' : 'share'}
            </span>
          </button>
          <button
            onClick={() => onToggleFavorite(player.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isFavorite
                ? 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/60 shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                : 'text-[#C3CAAC] hover:text-[#FFD700] border-transparent bg-[#232B34]'
            }`}
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        </div>
      </header>

      {/* Hero: Player Identity Header */}
      <section className="relative h-72 rounded-2xl overflow-hidden mx-4 flex flex-col justify-end p-5 border border-[#2D333B]">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={player.image}
            alt={player.name}
            className="w-full h-full object-cover object-top opacity-50 scale-105 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-[#0B0E11]/60 to-transparent"></div>
        </div>

        {/* Identity Overlay Content */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#B9F600] text-[#141F00] px-2 py-0.5 rounded-full font-data text-[10px] font-bold uppercase">
                {player.season}
              </span>
              <span className="font-data text-[11px] text-[#C3CAAC] uppercase tracking-wider">
                {player.position} • {player.nationality}
              </span>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight uppercase font-headline">
              {player.name}
            </h1>

            <p className="text-xs text-[#C3CAAC] flex items-center gap-1">
              <span className="material-symbols-outlined text-[#B9F600] text-[16px]">
                verified
              </span>
              <span>
                {player.class} • {player.club}
              </span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-5xl font-black text-[#B9F600] italic leading-none tracking-tighter">
              {currentOvr}
            </div>
            <div className="font-data text-[10px] text-[#C3CAAC] uppercase mt-0.5 tracking-wider">
              OVR RATING
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="px-4">
        <div className="glass-card rounded-xl p-3 flex justify-around items-center divide-x divide-[#2D333B]">
          {[
            { label: 'PAC', val: player.pac + gradeBonus },
            { label: 'SHO', val: player.sho + gradeBonus },
            { label: 'PAS', val: player.pas + gradeBonus },
            { label: 'DRI', val: player.dri + gradeBonus },
            { label: 'DEF', val: player.def + gradeBonus },
            { label: 'PHY', val: player.phy + gradeBonus },
          ].map((s) => (
            <div key={s.label} className="text-center px-2 flex-1">
              <div className="font-data text-[10px] text-[#C3CAAC] mb-0.5">{s.label}</div>
              <div className="font-data text-sm font-bold text-white">{s.val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Market Analysis Chart */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Market Analysis</h2>
          <span
            className={`font-data text-xs flex items-center gap-1 font-bold ${
              player.priceTrendPercent >= 0 ? 'text-[#00FF87]' : 'text-[#FF4B4B]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {player.priceTrendPercent >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            {player.priceTrendPercent >= 0 ? '+' : ''}
            {player.priceTrendPercent}%
          </span>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="font-data text-[10px] text-[#C3CAAC] uppercase">CURRENT PRICE</div>
              <div className="text-xl font-bold text-white font-data mt-0.5">
                {formatBP(player.bpPrice)}
              </div>
            </div>

            {/* Time interval selector */}
            <div className="flex gap-1 bg-[#141C25] p-1 rounded-lg border border-[#2D333B]">
              {(['1W', '1M', '3M'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-2 py-0.5 rounded font-data text-[10px] transition-all ${
                    selectedTimeRange === range
                      ? 'bg-[#B9F600] text-[#141F00] font-bold'
                      : 'text-[#C3CAAC] hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="pt-2">
            <div className="h-28 w-full flex items-end gap-1.5 pt-2 border-b border-[#2D333B] pb-1">
              {player.priceHistory.map((pt, i) => {
                const maxPrice = Math.max(...player.priceHistory.map((p) => p.price));
                const minPrice = Math.min(...player.priceHistory.map((p) => p.price));
                const heightPercent =
                  maxPrice === minPrice
                    ? 60
                    : 25 + ((pt.price - minPrice) / (maxPrice - minPrice)) * 70;
                const isLast = i === player.priceHistory.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-[#141C25] text-white text-[9px] font-data px-1.5 py-0.5 rounded border border-[#2D333B] whitespace-nowrap z-20 pointer-events-none">
                      {formatBP(pt.price)}
                    </div>
                    <div
                      className={`w-full rounded-t-xs transition-all duration-300 ${
                        isLast
                          ? 'bg-[#B9F600] border-t-2 border-white shadow-[0_0_8px_rgba(185,246,0,0.6)]'
                          : 'bg-[#B9F600]/30 group-hover:bg-[#B9F600]/60'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-2 font-data text-[10px] text-[#C3CAAC]">
              {player.priceHistory.map((pt, i) => (
                <span key={i}>{pt.date}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Player Comparison Section */}
      {comparePlayer ? (
        <section className="px-4 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#2D333B] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#B9F600]">compare_arrows</span>
              <h2 className="text-base font-bold text-white font-headline uppercase">
                Player Stat Comparison
              </h2>
            </div>
            <button
              onClick={() => setComparePlayer(null)}
              className="text-xs text-[#C3CAAC] hover:text-white underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              비교 종료
            </button>
          </div>

          {/* Header Cards (Player 1 VS Player 2) */}
          <div className="grid grid-cols-12 gap-2 items-stretch">
            {/* Player 1 Card */}
            <div className="col-span-5 bg-[#182029] border-2 border-[#B9F600]/80 rounded-2xl p-3 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-[0_0_15px_rgba(185,246,0,0.15)]">
              <div className="flex items-center gap-2">
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#B9F600] bg-[#232B34]"
                />
                <div className="overflow-hidden">
                  <span className="bg-[#B9F600] text-[#141F00] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                    {player.season}
                  </span>
                  <h3 className="text-xs font-black text-white truncate mt-0.5">{player.name}</h3>
                  <p className="text-[10px] text-[#C3CAAC] truncate">{player.position} • {player.club}</p>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-[#2D333B] pt-2">
                <div>
                  <span className="text-[9px] text-[#C3CAAC] block">OVR</span>
                  <span className="text-xl font-black text-[#B9F600]">{currentOvr}</span>
                </div>
                {/* Grade Selector */}
                <div className="flex gap-1">
                  {[1, 3, 5, 8].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-data transition-all ${
                        selectedGrade === g
                          ? 'bg-[#B9F600] text-[#141F00]'
                          : 'bg-[#232B34] text-[#C3CAAC] hover:text-white'
                      }`}
                    >
                      +{g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="col-span-2 flex flex-col items-center justify-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-[#232B34] border border-[#2D333B] flex items-center justify-center font-black text-xs text-[#B9F600] shadow-md">
                VS
              </div>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="text-[9px] text-[#38BDF8] hover:underline font-bold"
              >
                선수 변경
              </button>
            </div>

            {/* Player 2 Card */}
            <div className="col-span-5 bg-[#182029] border-2 border-[#38BDF8]/80 rounded-2xl p-3 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <div className="flex items-center gap-2">
                <img
                  src={comparePlayer.image}
                  alt={comparePlayer.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#38BDF8] bg-[#232B34]"
                />
                <div className="overflow-hidden">
                  <span className="bg-[#38BDF8] text-[#032838] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                    {comparePlayer.season}
                  </span>
                  <h3 className="text-xs font-black text-white truncate mt-0.5">{comparePlayer.name}</h3>
                  <p className="text-[10px] text-[#C3CAAC] truncate">{comparePlayer.position} • {comparePlayer.club}</p>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-[#2D333B] pt-2">
                <div>
                  <span className="text-[9px] text-[#C3CAAC] block">OVR</span>
                  <span className="text-xl font-black text-[#38BDF8]">{compareOvr}</span>
                </div>
                {/* Grade Selector */}
                <div className="flex gap-1">
                  {[1, 3, 5, 8].map((g) => (
                    <button
                      key={g}
                      onClick={() => setCompareGrade(g)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-data transition-all ${
                        compareGrade === g
                          ? 'bg-[#38BDF8] text-[#032838]'
                          : 'bg-[#232B34] text-[#C3CAAC] hover:text-white'
                      }`}
                    >
                      +{g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dual Radar Chart Panel */}
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
            <div className="text-xs font-bold text-[#C3CAAC] flex items-center justify-between w-full px-2">
              <span className="flex items-center gap-1.5 text-[#B9F600]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B9F600] inline-block shadow-[0_0_8px_#B9F600]" />
                {player.name} (+{selectedGrade})
              </span>
              <span className="text-[10px] text-[#8A99AD] font-mono">Radar Overview</span>
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_8px_#38BDF8]" />
                {comparePlayer.name} (+{compareGrade})
              </span>
            </div>

            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={rechartsData}>
                  <PolarGrid stroke="#2D333B" />
                  <PolarAngleAxis
                    dataKey="attribute"
                    tick={{ fill: '#C3CAAC', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, maxStat]} tick={false} axisLine={false} />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Radar
                    name={player.name}
                    dataKey="p1"
                    stroke="#B9F600"
                    fill="#B9F600"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name={comparePlayer.name}
                    dataKey="p2"
                    stroke="#38BDF8"
                    fill="#38BDF8"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side-by-Side Stats Comparison Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-[#2D333B] font-data text-xs">
            <div className="bg-[#232B34] p-2.5 text-center font-bold text-white uppercase tracking-wider text-[11px]">
              Detailed Stat Comparison
            </div>
            <div className="divide-y divide-[#2D333B]">
              {[
                { label: 'OVR Rating', p1: currentOvr, p2: compareOvr },
                { label: 'PAC (스피드)', p1: p1Stats[0].value, p2: p2Stats[0].value },
                { label: 'SHO (슛)', p1: p1Stats[1].value, p2: p2Stats[1].value },
                { label: 'PAS (패스)', p1: p1Stats[2].value, p2: p2Stats[2].value },
                { label: 'DRI (드리블)', p1: p1Stats[3].value, p2: p2Stats[3].value },
                { label: 'DEF (수비)', p1: p1Stats[4].value, p2: p2Stats[4].value },
                { label: 'PHY (피지컬)', p1: p1Stats[5].value, p2: p2Stats[5].value },
                { label: 'Weak Foot (약발)', p1: player.weakFoot, p2: comparePlayer.weakFoot },
                { label: 'Skill Moves (개인기)', p1: player.skillMoves, p2: comparePlayer.skillMoves },
                { label: 'BP Price (시세)', p1: formatBP(player.bpPrice), p2: formatBP(comparePlayer.bpPrice), rawP1: player.bpPrice, rawP2: comparePlayer.bpPrice },
              ].map((row, i) => {
                const val1 = typeof row.p1 === 'number' ? row.p1 : row.rawP1 || 0;
                const val2 = typeof row.p2 === 'number' ? row.p2 : row.rawP2 || 0;
                const p1Wins = val1 > val2;
                const p2Wins = val2 > val1;

                return (
                  <div
                    key={i}
                    className={`grid grid-cols-12 p-2.5 items-center transition-all ${
                      p1Wins
                        ? 'bg-gradient-to-r from-[#B9F600]/10 via-transparent to-transparent'
                        : p2Wins
                        ? 'bg-gradient-to-l from-[#38BDF8]/10 via-transparent to-transparent'
                        : 'hover:bg-[#232B34]/30'
                    }`}
                  >
                    <div className="col-span-4 text-left">
                      {p1Wins ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#B9F600]/20 text-[#B9F600] border border-[#B9F600]/60 rounded-lg shadow-[0_0_12px_rgba(185,246,0,0.25)] font-black text-xs">
                          <span>{row.p1}</span>
                          {typeof row.p1 === 'number' && typeof row.p2 === 'number' && (
                            <span className="text-[9px] bg-[#B9F600]/30 text-[#B9F600] px-1 rounded font-bold">
                              +{row.p1 - row.p2}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#8A99AD] font-semibold text-xs px-2.5 py-1 inline-block">
                          {row.p1}
                        </span>
                      )}
                    </div>
                    <div className="col-span-4 text-center text-[#C3CAAC] text-[10px] font-bold uppercase tracking-wide">
                      {row.label}
                    </div>
                    <div className="col-span-4 text-right">
                      {p2Wins ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/60 rounded-lg shadow-[0_0_12px_rgba(56,189,248,0.25)] font-black text-xs">
                          {typeof row.p1 === 'number' && typeof row.p2 === 'number' && (
                            <span className="text-[9px] bg-[#38BDF8]/30 text-[#38BDF8] px-1 rounded font-bold">
                              +{row.p2 - row.p1}
                            </span>
                          )}
                          <span>{row.p2}</span>
                        </span>
                      ) : (
                        <span className="text-[#8A99AD] font-semibold text-xs px-2.5 py-1 inline-block">
                          {row.p2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* Standard Attribute DNA (Radar Chart & Specialty Badges) */
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Attribute DNA</h2>
            <button
              onClick={() => {
                if (similarPlayers.length > 0) setComparePlayer(similarPlayers[0]);
                else setIsPickerOpen(true);
              }}
              className="text-xs text-[#B9F600] hover:underline font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              선수 비교하기
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Radar Chart Panel */}
            <div className="glass-card rounded-xl p-3 flex flex-col items-center justify-center min-h-[240px]">
              <div className="w-full h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={rechartsData}>
                    <PolarGrid stroke="#2D333B" />
                    <PolarAngleAxis
                      dataKey="attribute"
                      tick={{ fill: '#C3CAAC', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, maxStat]} tick={false} axisLine={false} />
                    <Tooltip content={<CustomRadarTooltip />} />
                    <Radar
                      name={player.name}
                      dataKey="p1"
                      stroke="#B9F600"
                      fill="#B9F600"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Attribute Cards */}
            <div className="space-y-3 flex flex-col justify-center">
              <div className="glass-card rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="font-data text-[10px] text-[#C3CAAC]">Weak Foot</div>
                  <div className="font-data text-xs text-white font-bold mt-0.5">
                    Left {player.weakFoot} / Right 5
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#B9F600] font-data text-sm font-bold">
                  {player.weakFoot}
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  5
                </div>
              </div>

              <div className="glass-card rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="font-data text-[10px] text-[#C3CAAC]">Skill Moves</div>
                  <div className="font-data text-xs text-white font-bold mt-0.5">
                    {player.skillMoves} Stars
                  </div>
                </div>
                <div className="text-[#B9F600] font-data text-sm">
                  {'★'.repeat(player.skillMoves)}
                </div>
              </div>

              <div className="glass-card rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <div className="font-data text-[10px] text-[#C3CAAC]">Preferred Foot</div>
                  <div className="font-data text-xs text-white font-bold mt-0.5">Right</div>
                </div>
                <span className="material-symbols-outlined text-[#B9F600]">sports_soccer</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhancement Table */}
      <section className="px-4">
        <h2 className="text-base font-bold text-white mb-3">Enhancement Table</h2>
        <div className="glass-card rounded-xl overflow-hidden border border-[#2D333B]">
          <table className="w-full text-left font-data text-xs">
            <thead className="bg-[#232B34] text-[#C3CAAC]">
              <tr>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5">OVR</th>
                <th className="px-4 py-2.5 text-right">Price (BP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D333B]">
              {player.enhancements.map((enh) => {
                const isSelected = selectedGrade === enh.grade;
                return (
                  <tr
                    key={enh.grade}
                    onClick={() => setSelectedGrade(enh.grade)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#B9F600]/15 font-bold' : 'hover:bg-[#232B34]/40'
                    }`}
                  >
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-black text-[11px] ${
                          enh.grade === 1
                            ? 'bg-[#D4AF37]'
                            : enh.grade === 3
                            ? 'bg-[#E5E4E2]'
                            : enh.grade === 5
                            ? 'bg-[#B9F600]'
                            : 'bg-[#FF4B4B] text-white'
                        }`}
                      >
                        +{enh.grade}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-[#B9F600] uppercase font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-white">{enh.ovr}</td>
                    <td className="px-4 py-2.5 text-right text-white font-bold">
                      {formatBP(enh.bpPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Similar Profiles */}
      {similarPlayers.length > 0 && (
        <section className="px-4">
          <h2 className="text-base font-bold text-white mb-3">Similar Profiles</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {similarPlayers.map((sim) => (
              <div
                key={sim.id}
                className="min-w-[140px] glass-card rounded-xl p-3 flex flex-col items-center hover:border-[#B9F600]/50 transition-all group relative"
              >
                <div
                  onClick={() => onSelectPlayer(sim)}
                  className="w-full flex flex-col items-center cursor-pointer"
                >
                  <div className="relative w-16 h-16 mb-2">
                    <img
                      src={sim.image}
                      alt={sim.name}
                      className="w-full h-full rounded-full object-cover border-2 border-[#2D333B] group-hover:border-[#B9F600] transition-colors bg-[#232B34]"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-[#182029] rounded-full px-1.5 py-0.5 font-data text-[9px] text-[#B9F600] border border-[#2D333B]">
                      {sim.ovr}
                    </div>
                  </div>
                  <div className="font-semibold text-xs text-white text-center truncate w-full group-hover:text-[#B9F600]">
                    {sim.name}
                  </div>
                  <div className="font-data text-[10px] text-[#C3CAAC] mt-0.5">
                    {sim.season} • {sim.position}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparePlayer(sim);
                  }}
                  className="mt-2 w-full py-1 bg-[#232B34] hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 rounded-lg font-data text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[12px]">compare_arrows</span>
                  <span>VS 비교</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Player Picker Modal for Comparison */}
      <PlayerPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        positionLabel={player.position}
        players={allPlayers}
        onSelectPlayer={(p) => {
          setComparePlayer(p);
          setIsPickerOpen(false);
        }}
      />
    </div>
  );
};
