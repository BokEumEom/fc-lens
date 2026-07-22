import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

type NexonTab = 'account' | 'match' | 'ranker' | 'metadata' | 'images';

interface NexonAccount {
  ouid: string;
  nickname: string;
  level: number;
  maxDivision: string;
  divisionCode: number;
  achievementDate?: string;
  matchTypeCounts?: {
    official1v1: number;
    officialVolta: number;
    customMatch: number;
  };
}

interface MatchTeamPlayer {
  spId: number;
  name: string;
  season: string;
  position: string;
  grade: number;
  ovr: number;
  goals: number;
  assists: number;
  rating: number;
  image: string;
}

interface MatchTeam {
  ouid: string;
  nickname: string;
  result: string;
  score: number;
  possession: number;
  totalShots: number;
  effectiveShots: number;
  passSuccessRate: number;
  tackleSuccessRate: number;
  controller: string;
  squad: MatchTeamPlayer[];
}

interface MatchDetail {
  matchId: string;
  matchDate: string;
  matchType: string;
  stadium?: string;
  teams: MatchTeam[];
}

interface RankerInfo {
  rank: number;
  nickname: string;
  ouid: string;
  winRate: string;
  totalMatches: number;
  topFormation: string;
  mainPlayer: string;
  division: string;
}

export interface GoalScorer {
  name: string;
  goals: number;
  spId?: number;
  rating?: number;
}

export interface UserMatch {
  matchId: string;
  matchDate: string;
  matchType: string;
  result: '승' | '패' | '무' | string;
  score: string;
  myGoals: number;
  opponentGoals: number;
  opponentNickname: string;
  possession: number;
  shots: number;
  effectiveShots: number;
  controller: string;
  stadium?: string;
  myGoalScorers?: GoalScorer[];
  oppGoalScorers?: GoalScorer[];
  passSuccessRate?: number;
  tackleSuccessRate?: number;
  mvpPlayer?: string;
}

export interface UserMatchSummary {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: string;
  avgGoals: string;
  avgPossession: string;
}

export interface LiveMatchInfo {
  matchId: string;
  matchType: string;
  currentMinute: number;
  period: string;
  stadium: string;
  myTeam: {
    ouid: string;
    nickname: string;
    score: number;
    possession: number;
    shots: number;
    effectiveShots: number;
    color: string;
    scorers: { minute: number; name: string }[];
  };
  opponentTeam: {
    ouid: string;
    nickname: string;
    score: number;
    possession: number;
    shots: number;
    effectiveShots: number;
    color: string;
    scorers: { minute: number; name: string }[];
  };
  recentEvents: {
    minute: number;
    type: string;
    player: string;
    team: 'MY' | 'OPP';
    text: string;
  }[];
}

export const LiveMatchCard: React.FC<{
  liveData: LiveMatchInfo | null;
  loading: boolean;
  onRefresh: () => void;
  onSimulateToggle?: () => void;
}> = ({ liveData, loading, onRefresh, onSimulateToggle }) => {
  if (loading) {
    return (
      <div className="bg-[#182029] p-4 rounded-2xl border border-red-500/30 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-[#232B34] rounded" />
          <div className="h-4 w-24 bg-[#232B34] rounded" />
        </div>
        <div className="h-16 bg-[#232B34] rounded-xl" />
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="bg-[#161A1E] p-3 rounded-2xl border border-[#2D333B] flex items-center justify-between gap-3 text-xs font-data">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
          </span>
          <div>
            <span className="text-[#C3CAAC] font-bold">진행 중인 실시간 경기 없음</span>
            <span className="text-[10px] text-[#8A99AD] ml-2 hidden sm:inline">
              (게임 플레이 중 실시간 스코어 연동)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 bg-[#232B34] hover:bg-[#2d3642] text-[#C3CAAC] hover:text-white rounded-xl text-[11px] border border-[#2D333B] flex items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">refresh</span>
            <span>조회</span>
          </button>
          {onSimulateToggle && (
            <button
              onClick={onSimulateToggle}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">play_circle</span>
              <span>LIVE 테스트</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#1E1112] via-[#1A1822] to-[#111A1A] p-4 rounded-2xl border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] space-y-3 relative overflow-hidden font-data animate-in fade-in">
      {/* Background Watermark */}
      <div className="absolute right-[-15px] top-[-15px] text-red-500/10 text-8xl font-black pointer-events-none select-none">
        LIVE
      </div>

      {/* Live Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/30 pb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-1">
            🔴 LIVE MATCH IN PROGRESS
          </span>
          <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
            {liveData.period} {liveData.currentMinute}'
          </span>
          <span className="text-[10px] text-[#C3CAAC] hidden md:inline">
            ({liveData.matchType})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-2 py-1 bg-[#232B34] hover:bg-red-500/20 text-[#C3CAAC] hover:text-red-300 rounded-lg text-[10px] border border-[#2D333B] flex items-center gap-1 transition-all"
            title="실시간 경기 정보 갱신"
          >
            <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
            <span>실시간 갱신</span>
          </button>
          {onSimulateToggle && (
            <button
              onClick={onSimulateToggle}
              className="px-2 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] border border-zinc-700"
            >
              종료
            </button>
          )}
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="grid grid-cols-12 gap-2 items-center bg-[#0F1318]/80 p-3 rounded-xl border border-red-500/30 relative z-10">
        {/* My Team */}
        <div className="col-span-5 text-right space-y-1">
          <p className="text-xs font-black text-[#B9F600] truncate">{liveData.myTeam.nickname}</p>
          <div className="text-[10px] text-[#C3CAAC] flex items-center justify-end gap-2">
            <span>슈팅 {liveData.myTeam.effectiveShots}/{liveData.myTeam.shots}</span>
            <span>점유 {liveData.myTeam.possession}%</span>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="col-span-2 text-center">
          <div className="bg-red-500/20 border border-red-500/60 rounded-xl py-1 px-2 text-center shadow-[0_0_10px_rgba(239,68,68,0.4)]">
            <span className="text-xl font-black text-white font-headline tracking-widest">
              {liveData.myTeam.score} : {liveData.opponentTeam.score}
            </span>
          </div>
          <p className="text-[9px] text-red-400 font-bold mt-1 uppercase animate-pulse">LIVE</p>
        </div>

        {/* Opponent Team */}
        <div className="col-span-5 text-left space-y-1">
          <p className="text-xs font-black text-sky-400 truncate">{liveData.opponentTeam.nickname}</p>
          <div className="text-[10px] text-[#C3CAAC] flex items-center justify-start gap-2">
            <span>점유 {liveData.opponentTeam.possession}%</span>
            <span>슈팅 {liveData.opponentTeam.effectiveShots}/{liveData.opponentTeam.shots}</span>
          </div>
        </div>
      </div>

      {/* Possession Progress Bar */}
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between text-[10px] text-[#C3CAAC]">
          <span className="text-[#B9F600] font-bold">내 팀 점유율 {liveData.myTeam.possession}%</span>
          <span className="text-sky-400 font-bold">상대팀 점유율 {liveData.opponentTeam.possession}%</span>
        </div>
        <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
          <div className="bg-[#B9F600] h-full transition-all duration-500" style={{ width: `${liveData.myTeam.possession}%` }} />
          <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${liveData.opponentTeam.possession}%` }} />
        </div>
      </div>

      {/* Real-time Events Log */}
      {liveData.recentEvents && liveData.recentEvents.length > 0 && (
        <div className="bg-[#0F1318]/60 p-2.5 rounded-xl border border-[#2D333B] space-y-1.5 relative z-10">
          <p className="text-[10px] font-bold text-red-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">bolt</span>
            실시간 주요 타임라인 이벤트 (Live Feed)
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {liveData.recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-[#182029] border border-[#2D333B] text-white flex items-center gap-1"
              >
                <span className="font-bold text-red-400">{evt.minute}'</span>
                <span>{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MatchWinRateChartProps {
  matches: UserMatch[];
  summary: UserMatchSummary | null;
  onSelectMatch?: (matchId: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    const isWin = data.result === '승';
    const isLoss = data.result === '패';
    const resColor = isWin ? 'text-[#00FF87]' : isLoss ? 'text-[#FF4B4B]' : 'text-amber-400';

    return (
      <div className="bg-[#182029] border border-[#2D333B] p-2.5 rounded-xl shadow-2xl font-data text-xs space-y-1 z-50">
        <div className="flex items-center justify-between gap-3 border-b border-[#2D333B] pb-1">
          <span className="font-bold text-white">경기 #{data.idx} ({data.dateLabel})</span>
          <span className={`font-bold ${resColor}`}>[{data.result}] {data.score}</span>
        </div>
        <div className="text-[11px] text-[#C3CAAC] space-y-0.5">
          <p>상대: <span className="text-white font-bold">{data.opponent}</span></p>
          <p>누적 승률: <span className="text-[#B9F600] font-bold">{data.winRate}%</span></p>
          <p>득실: <span className="text-white">{data.myGoals}득 {data.opponentGoals}실</span> | 점유율: <span className="text-sky-400">{data.possession}%</span></p>
          <p>유효슈팅: <span className="text-emerald-400">{data.effectiveShots} / {data.shots}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export const MatchWinRateChart: React.FC<MatchWinRateChartProps> = ({
  matches,
  summary,
  onSelectMatch,
}) => {
  const [chartType, setChartType] = useState<'trend' | 'stats' | 'pie'>('trend');

  if (!matches || matches.length === 0) {
    return null;
  }

  // Sort chronological ascending (oldest first for trend line)
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  let winsCount = 0;
  let drawsCount = 0;
  let lossesCount = 0;

  const trendData = sortedMatches.map((m, idx) => {
    if (m.result === '승') winsCount++;
    else if (m.result === '무') drawsCount++;
    else if (m.result === '패') lossesCount++;

    const totalSoFar = idx + 1;
    const winRate = Math.round((winsCount / totalSoFar) * 100);

    const dateObj = new Date(m.matchDate);
    const dateLabel = !isNaN(dateObj.getTime())
      ? `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
      : `#${idx + 1}`;

    return {
      idx: idx + 1,
      matchId: m.matchId,
      dateLabel,
      opponent: m.opponentNickname,
      result: m.result,
      score: m.score,
      winRate,
      myGoals: m.myGoals,
      opponentGoals: m.opponentGoals,
      possession: m.possession,
      shots: m.shots,
      effectiveShots: m.effectiveShots,
    };
  });

  const pieData = [
    { name: '승리 (WIN)', value: summary?.wins ?? winsCount, color: '#00FF87' },
    { name: '무승부 (DRAW)', value: summary?.draws ?? drawsCount, color: '#FBBF24' },
    { name: '패배 (LOSS)', value: summary?.losses ?? lossesCount, color: '#FF4B4B' },
  ].filter((item) => item.value > 0);

  const currentWinRate = trendData.length > 0 ? trendData[trendData.length - 1].winRate : 0;

  return (
    <div className="bg-[#182029] p-4 rounded-xl border border-[#2D333B] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D333B] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#B9F600] text-base">monitoring</span>
          <h4 className="text-xs font-bold text-white font-headline">
            최근 경기 승률 및 전력 시각화 (Match Performance Visualizer)
          </h4>
          <span className="bg-[#B9F600]/20 text-[#B9F600] text-[10px] px-1.5 py-0.5 rounded font-data font-bold">
            Recharts
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-[#232B34] p-1 rounded-lg border border-[#2D333B]">
          {[
            { id: 'trend', label: '승률 추이', icon: 'show_chart' },
            { id: 'stats', label: '득실 & 점유율', icon: 'bar_chart' },
            { id: 'pie', label: '승/무/패 비율', icon: 'pie_chart' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setChartType(mode.id as any)}
              className={`px-2 py-1 rounded-md text-[10px] font-data transition-all flex items-center gap-1 ${
                chartType === mode.id
                  ? 'bg-[#B9F600] text-[#141F00] font-bold shadow-sm'
                  : 'text-[#C3CAAC] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-52 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'trend' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B9F600" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#B9F600" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D333B" vertical={false} />
              <XAxis
                dataKey="idx"
                stroke="#8A99AD"
                fontSize={10}
                tickFormatter={(v) => `${v}경기`}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#8A99AD"
                fontSize={10}
                unit="%"
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={50}
                stroke="#FF4B4B"
                strokeDasharray="3 3"
                label={{ value: '50% 평균', fill: '#FF4B4B', fontSize: 10, position: 'insideBottomRight' }}
              />
              <Area
                type="monotone"
                dataKey="winRate"
                name="누적 승률 (%)"
                stroke="#B9F600"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#winRateGrad)"
                dot={{ r: 4, fill: '#B9F600', stroke: '#141F00', strokeWidth: 2 }}
                activeDot={{
                  r: 6,
                  fill: '#FFFFFF',
                  stroke: '#B9F600',
                  strokeWidth: 2,
                  onClick: (_: any, p: any) => p?.payload?.matchId && onSelectMatch?.(p.payload.matchId),
                }}
              />
            </AreaChart>
          ) : chartType === 'stats' ? (
            <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D333B" vertical={false} />
              <XAxis dataKey="idx" stroke="#8A99AD" fontSize={10} tickFormatter={(v) => `${v}경기`} />
              <YAxis stroke="#8A99AD" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
              <Bar dataKey="myGoals" name="내 득점" fill="#00FF87" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="opponentGoals" name="상대 득점" fill="#FF4B4B" radius={[4, 4, 0, 0]} barSize={12} />
              <Line type="monotone" dataKey="possession" name="점유율 (%)" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          ) : (
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip formatter={(value: any) => [`${value} 경기`, '판수']} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={4}
                label={({ name, percent }: any) => `${name.split(' ')[0]} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info / Insights */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-[#C3CAAC] pt-2 border-t border-[#2D333B]/60 font-data">
        <div className="flex items-center gap-3">
          <span>총 분석 매치: <strong className="text-white">{trendData.length}경기</strong></span>
          <span>최종 누적 승률: <strong className="text-[#B9F600]">{currentWinRate}%</strong></span>
        </div>
        <span className="text-[#8A99AD]">💡 차트 포인트를 클릭하면 해당 경기 상세전술 페이지로 이동합니다.</span>
      </div>
    </div>
  );
};

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

export const NexonUserView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<NexonTab>('account');

  // API Key Management
  const [customKey, setCustomKey] = useState<string>(
    localStorage.getItem('fconline_nexon_api_key') || ''
  );
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyValidating, setKeyValidating] = useState<boolean>(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  // Common notification / toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 1. Account State
  const [nickname, setNickname] = useState('두치와뿌꾸');
  const [searchQuery, setSearchQuery] = useState('두치와뿌꾸');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountData, setAccountData] = useState<NexonAccount | null>(null);
  const [accountMatches, setAccountMatches] = useState<string[]>([]);
  const [accountIsDemo, setAccountIsDemo] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // 2. User Recent Match History State
  const [userMatchesLoading, setUserMatchesLoading] = useState(false);
  const [userMatchesSummary, setUserMatchesSummary] = useState<UserMatchSummary | null>(null);
  const [userMatchesList, setUserMatchesList] = useState<UserMatch[]>([]);
  const [selectedMatchType, setSelectedMatchType] = useState<string>('50'); // 50 = 공식경기 1v1, 52 = 볼타 라이브, 60 = 클래식
  const [userMatchesFilter, setUserMatchesFilter] = useState<'ALL' | 'WIN' | 'DRAW' | 'LOSS'>('ALL');
  const [userMatchesError, setUserMatchesError] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Live Match State
  const [liveMatchLoading, setLiveMatchLoading] = useState(false);
  const [liveMatchData, setLiveMatchData] = useState<LiveMatchInfo | null>(null);
  const [liveSimulate, setLiveSimulate] = useState(false);

  const fetchLiveMatch = async (targetOuid?: string, forceSimulate?: boolean) => {
    const ouidToUse = targetOuid || accountData?.ouid;
    const shouldSim = forceSimulate !== undefined ? forceSimulate : liveSimulate;

    setLiveMatchLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (customKey) headers['x-nxopen-api-key'] = customKey;

      let url = `/api/nexon/live-match?`;
      if (ouidToUse) url += `ouid=${encodeURIComponent(ouidToUse)}&`;
      if (nickname) url += `nickname=${encodeURIComponent(nickname)}&`;
      if (shouldSim) url += `simulate=true&`;

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.isPlaying && data.liveMatch) {
        setLiveMatchData(data.liveMatch);
      } else {
        setLiveMatchData(null);
      }
    } catch {
      setLiveMatchData(null);
    } finally {
      setLiveMatchLoading(false);
    }
  };

  const toggleLiveSimulate = () => {
    const nextState = !liveSimulate;
    setLiveSimulate(nextState);
    fetchLiveMatch(accountData?.ouid, nextState);
    showToast(nextState ? '🔴 LIVE 경기 시뮬레이션 모드 활성화' : '🟢 LIVE 경기 모드 해제');
  };

  // 3. Match Detail State
  const [selectedMatchId, setSelectedMatchId] = useState('m_001');
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // 4. Ranker State
  const [rankerLoading, setRankerLoading] = useState(false);
  const [rankers, setRankers] = useState<RankerInfo[]>([]);
  const [rankerIsDemo, setRankerIsDemo] = useState(false);

  // 5. Metadata State
  const [metaType, setMetaType] = useState<'matchtype' | 'seasonid' | 'spposition' | 'division' | 'spid'>('matchtype');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaData, setMetaData] = useState<any[]>([]);

  // 6. Image Assets State
  const [spIdInput, setSpIdInput] = useState('250102143');
  const [seasonIdInput, setSeasonIdInput] = useState('101');
  const [imageUrls, setImageUrls] = useState<{
    portrait: string;
    action: string;
    seasonBadge: string;
  }>({
    portrait: 'https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102143.png',
    action: 'https://fconline.gcdn.nexon.com/live/externalAssets/common/playersAction/p250102143.png',
    seasonBadge: 'https://fconline.gcdn.nexon.com/live/externalAssets/common/season/101.png',
  });

  const popularNicknames = ['두치와뿌꾸', '감스트', '김병지', '환경', '신보석'];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 1. Fetch Account Data & Match History
  const fetchUserMatchHistory = async (targetOuid?: string, matchType: string = selectedMatchType) => {
    const ouidToUse = targetOuid || accountData?.ouid;

    setUserMatchesLoading(true);
    setUserMatchesError(null);

    try {
      const headers: Record<string, string> = {};
      if (customKey) headers['x-nxopen-api-key'] = customKey;

      let url = `/api/nexon/user-matches?matchtype=${matchType}&limit=10`;
      if (ouidToUse) {
        url += `&ouid=${encodeURIComponent(ouidToUse)}`;
      } else if (nickname) {
        url += `&nickname=${encodeURIComponent(nickname)}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok || data.error) {
        setUserMatchesError(data.message || 'Failed to fetch match history.');
        setUserMatchesList([]);
        setUserMatchesSummary(null);
      } else {
        setUserMatchesSummary(data.summary || null);
        setUserMatchesList(data.matches || []);
      }
      fetchLiveMatch(ouidToUse);
    } catch (err: any) {
      setUserMatchesError(`Match history error: ${err.message}`);
    } finally {
      setUserMatchesLoading(false);
    }
  };

  const handleMatchTypeChange = (mType: string) => {
    setSelectedMatchType(mType);
    fetchUserMatchHistory(accountData?.ouid, mType);
  };

  const fetchAccount = async (targetNickname: string) => {
    setAccountLoading(true);
    setAccountError(null);

    try {
      const headers: Record<string, string> = {};
      if (customKey) headers['x-nxopen-api-key'] = customKey;

      const res = await fetch(`/api/nexon/account?nickname=${encodeURIComponent(targetNickname)}`, {
        headers,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setAccountError(data.message || 'Owner not found in NEXON FC Online.');
        setAccountData(null);
        setAccountMatches([]);
        setUserMatchesList([]);
        setUserMatchesSummary(null);
      } else {
        setAccountData(data.account);
        setAccountMatches(data.recentMatchIds || []);
        setAccountIsDemo(Boolean(data.isDemoData));
        if (data.recentMatchIds?.length > 0) {
          setSelectedMatchId(data.recentMatchIds[0]);
        }
        // Fetch detailed match history
        fetchUserMatchHistory(data.account.ouid, selectedMatchType);
      }
    } catch (err: any) {
      setAccountError(`Failed to fetch account: ${err.message}`);
    } finally {
      setAccountLoading(false);
    }
  };

  // 2. Fetch Match Detail
  const fetchMatchDetail = async (mId: string) => {
    setMatchLoading(true);
    setMatchError(null);

    try {
      const headers: Record<string, string> = {};
      if (customKey) headers['x-nxopen-api-key'] = customKey;

      const res = await fetch(`/api/nexon/match-detail?matchid=${mId}`, { headers });
      const data = await res.json();

      if (!res.ok || data.error) {
        setMatchError(data.message || 'Match details unavailable.');
        setMatchDetail(null);
      } else {
        setMatchDetail(data);
      }
    } catch (err: any) {
      setMatchError(`Match fetch error: ${err.message}`);
    } finally {
      setMatchLoading(false);
    }
  };

  // 3. Fetch Rankers
  const fetchRankers = async () => {
    setRankerLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (customKey) headers['x-nxopen-api-key'] = customKey;

      const res = await fetch('/api/nexon/rankers?matchtype=50', { headers });
      const data = await res.json();

      if (res.ok && data.rankers) {
        setRankers(data.rankers);
        setRankerIsDemo(Boolean(data.isDemoData));
      }
    } catch (err) {
      console.error('Failed to load rankers', err);
    } finally {
      setRankerLoading(false);
    }
  };

  // 4. Fetch Metadata
  const fetchMetadata = async (type: typeof metaType) => {
    setMetaLoading(true);

    try {
      const res = await fetch(`/api/nexon/metadata?type=${type}`);
      const data = await res.json();

      if (res.ok && data.data) {
        setMetaData(Array.isArray(data.data) ? data.data : [data.data]);
      }
    } catch (err) {
      console.error('Metadata fetch error', err);
    } finally {
      setMetaLoading(false);
    }
  };

  // 5. Generate Image Asset URLs
  const handleUpdateImageUrls = () => {
    const spId = spIdInput.trim() || '250102143';
    const season = seasonIdInput.trim() || '101';

    setImageUrls({
      portrait: `https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p${spId}.png`,
      action: `https://fconline.gcdn.nexon.com/live/externalAssets/common/playersAction/p${spId}.png`,
      seasonBadge: `https://fconline.gcdn.nexon.com/live/externalAssets/common/season/${season}.png`,
    });
    showToast('Updated CDN asset URLs!');
  };

  useEffect(() => {
    fetchAccount(nickname);
    fetchMatchDetail('m_001');
    fetchRankers();
    fetchMetadata('matchtype');
  }, []);

  useEffect(() => {
    if (activeSubTab === 'metadata') {
      fetchMetadata(metaType);
    }
  }, [metaType, activeSubTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setNickname(searchQuery.trim());
    fetchAccount(searchQuery.trim());
  };

  const handleSaveCustomKey = async () => {
    if (!customKey.trim()) {
      localStorage.removeItem('fconline_nexon_api_key');
      setKeyStatusMsg('Cleared custom API key. Using fallback mode.');
      setTimeout(() => setShowKeyModal(false), 1200);
      fetchAccount(nickname);
      return;
    }

    setKeyValidating(true);
    setKeyStatusMsg(null);

    try {
      const res = await fetch('/api/nexon/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: customKey.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem('fconline_nexon_api_key', customKey.trim());
        setKeyStatusMsg('✅ Valid NEXON Open API Key saved!');
        setTimeout(() => {
          setShowKeyModal(false);
          fetchAccount(nickname);
        }, 1000);
      } else {
        setKeyStatusMsg(`❌ Invalid API Key: ${data.error || 'Check key and try again.'}`);
      }
    } catch (err: any) {
      setKeyStatusMsg(`❌ Verification error: ${err.message}`);
    } finally {
      setKeyValidating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-5 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-1.5 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Main Title & API Key Status Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest font-bold">
              OFFICIAL NEXON OPEN API
            </span>
            <span className="bg-[#B9F600]/15 text-[#B9F600] border border-[#B9F600]/40 font-data text-[9px] px-1.5 py-0.2 rounded font-bold">
              FC ONLINE v1.0
            </span>
          </div>
          <h1 className="text-xl font-black text-white font-headline">NEXON FC Online Integration Hub</h1>
        </div>

        <button
          onClick={() => setShowKeyModal(true)}
          className={`px-3 py-1.5 rounded-xl border font-data text-xs flex items-center gap-1.5 transition-all ${
            customKey
              ? 'bg-[#B9F600]/15 border-[#B9F600] text-[#B9F600] font-bold shadow-[0_0_10px_rgba(185,246,0,0.2)]'
              : 'bg-[#161A1E] border-[#2D333B] text-[#C3CAAC] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">key</span>
          <span>{customKey ? 'Key Active (API Key)' : 'Set API Key'}</span>
        </button>
      </div>

      {/* 5 Core Feature Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#161A1E] p-2 rounded-2xl border border-[#2D333B] shadow-inner scroll-smooth">
        {[
          { id: 'account', label: '1. 계정 정보', icon: 'account_box' },
          { id: 'match', label: '2. 매치 정보', icon: 'sports_score' },
          { id: 'ranker', label: '3. 랭커 정보', icon: 'leaderboard' },
          { id: 'metadata', label: '4. 메타데이터', icon: 'schema' },
          { id: 'images', label: '5. 이미지 정보', icon: 'image' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as NexonTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-data text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeSubTab === tab.id
                ? 'bg-[#B9F600] text-[#141F00] shadow-[0_0_12px_rgba(185,246,0,0.3)]'
                : 'text-[#C3CAAC] hover:text-white hover:bg-[#232B34] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. 계정 정보 (Account Info) Tab */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'account' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Owner Search Input */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#C3CAAC] text-sm">
                person_search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FC Online coach / owner name (e.g. 두치와뿌꾸)"
                className="w-full bg-[#161A1E] border border-[#2D333B] rounded-xl py-2.5 pl-9 pr-24 text-white text-xs placeholder-[#C3CAAC]/60 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
              />
              <button
                type="submit"
                disabled={accountLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-3 py-1.5 rounded-lg hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                {accountLoading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="font-data text-[10px] text-[#C3CAAC] whitespace-nowrap">Quick Select:</span>
              {popularNicknames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSearchQuery(name);
                    setNickname(name);
                    fetchAccount(name);
                  }}
                  className={`px-2.5 py-1 rounded-full font-data text-[11px] whitespace-nowrap border transition-all ${
                    nickname === name
                      ? 'bg-[#B9F600] text-[#141F00] font-bold border-[#B9F600]'
                      : 'bg-[#182029] text-[#C3CAAC] border-[#2D333B] hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </form>

          {/* Account Card */}
          {accountLoading && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 flex flex-col items-center justify-center space-y-2 text-center">
              <span className="material-symbols-outlined text-[#B9F600] text-3xl animate-spin">
                sync
              </span>
              <p className="font-data text-xs text-white font-bold">Querying NEXON Open API...</p>
              <p className="text-[11px] text-[#C3CAAC]">Fetching OUID, max division, and match logs</p>
            </div>
          )}

          {!accountLoading && accountError && (
            <div className="bg-[#93000A]/30 border border-[#FF4B4B]/60 rounded-2xl p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-[#FF4B4B] text-3xl">error</span>
              <p className="text-sm font-bold text-white">{accountError}</p>
              <p className="text-xs text-[#C3CAAC]">Please verify the exact nickname spelled in FC Online.</p>
            </div>
          )}

          {!accountLoading && accountData && (
            <div className="space-y-4">
              <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-xl">
                <div className="flex items-start justify-between border-b border-[#2D333B] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#232B34] border-2 border-[#B9F600] flex items-center justify-center text-[#B9F600] font-black font-headline text-lg shadow-[0_0_15px_rgba(185,246,0,0.2)]">
                      <span>Lv.{accountData.level}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white font-headline">
                          {accountData.nickname}
                        </h2>
                        <span className="bg-[#B9F600] text-[#141F00] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-data">
                          {accountIsDemo ? 'DEMO MODE' : 'VERIFIED LIVE'}
                        </span>
                      </div>
                      <p className="font-data text-[10px] text-[#C3CAAC] mt-0.5 font-mono">
                        OUID: {accountData.ouid}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(accountData.ouid)}
                    className="p-2 bg-[#232B34] hover:bg-[#2d3642] text-[#C3CAAC] hover:text-white rounded-xl text-xs flex items-center gap-1 border border-[#2D333B]"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span className="font-data text-[10px]">Copy OUID</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#182029] p-3 rounded-xl border border-[#2D333B]">
                    <p className="font-data text-[10px] text-[#C3CAAC] uppercase">Official Max Rank</p>
                    <p className="text-sm font-bold text-[#00FF87] mt-0.5">{accountData.maxDivision}</p>
                  </div>
                  <div className="bg-[#182029] p-3 rounded-xl border border-[#2D333B]">
                    <p className="font-data text-[10px] text-[#C3CAAC] uppercase">Achievement Date</p>
                    <p className="font-data text-xs text-white mt-0.5">
                      {accountData.achievementDate
                        ? new Date(accountData.achievementDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 2. Recent Match History Section */}
                <div className="space-y-3 pt-3 border-t border-[#2D333B]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="font-data text-xs text-white font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#B9F600] text-sm">history</span>
                        최근 매치 전적 기록 (Recent Match History)
                      </h3>
                      <p className="text-[10px] text-[#C3CAAC]">NEXON Open API /user/match live query</p>
                    </div>

                    {/* Match Type Pills */}
                    <div className="flex items-center gap-1 bg-[#182029] p-1 rounded-xl border border-[#2D333B]">
                      {[
                        { code: '50', label: '공식경기 1v1' },
                        { code: '52', label: '볼타 라이브' },
                        { code: '60', label: '클래식' },
                      ].map((mt) => (
                        <button
                          key={mt.code}
                          type="button"
                          onClick={() => handleMatchTypeChange(mt.code)}
                          className={`px-2.5 py-1 rounded-lg font-data text-[10px] transition-all ${
                            selectedMatchType === mt.code
                              ? 'bg-[#B9F600] text-[#141F00] font-bold shadow-sm'
                              : 'text-[#C3CAAC] hover:text-white'
                          }`}
                        >
                          {mt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIVE Ongoing Match Indicator Card */}
                  <LiveMatchCard
                    liveData={liveMatchData}
                    loading={liveMatchLoading}
                    onRefresh={() => fetchLiveMatch(accountData?.ouid)}
                    onSimulateToggle={toggleLiveSimulate}
                  />

                  {/* Summary Banner */}
                  {userMatchesLoading ? (
                    <MatchSummarySkeleton />
                  ) : userMatchesSummary ? (
                    <div className="bg-[#182029] p-3.5 rounded-xl border border-[#2D333B] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">최근 승률</p>
                        <p className="text-base font-black text-[#B9F600] font-headline">{userMatchesSummary.winRate}</p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">전적 (승/무/패)</p>
                        <p className="text-xs font-bold text-white mt-1">
                          <span className="text-[#00FF87]">{userMatchesSummary.wins}승</span>{' '}
                          <span className="text-amber-400">{userMatchesSummary.draws}무</span>{' '}
                          <span className="text-[#FF4B4B]">{userMatchesSummary.losses}패</span>
                        </p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">평균 득점</p>
                        <p className="text-xs font-bold text-white mt-1">{userMatchesSummary.avgGoals} 골</p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] text-[#C3CAAC] uppercase">평균 점유율</p>
                        <p className="text-xs font-bold text-white mt-1">{userMatchesSummary.avgPossession}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Recharts Match Win-Rate Trends & Performance Charts */}
                  {userMatchesLoading ? (
                    <MatchChartSkeleton />
                  ) : userMatchesList.length > 0 ? (
                    <MatchWinRateChart
                      matches={userMatchesList}
                      summary={userMatchesSummary}
                      onSelectMatch={(mId) => {
                        setSelectedMatchId(mId);
                        fetchMatchDetail(mId);
                        setActiveSubTab('match');
                        showToast(`Selected Match #${mId.slice(0, 8)}`);
                      }}
                    />
                  ) : null}

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#C3CAAC] font-data">필터:</span>
                      {[
                        { key: 'ALL', label: '전체' },
                        { key: 'WIN', label: '승리' },
                        { key: 'DRAW', label: '무승부' },
                        { key: 'LOSS', label: '패배' },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setUserMatchesFilter(f.key as any)}
                          className={`px-2 py-0.5 rounded-md font-data text-[10px] transition-all ${
                            userMatchesFilter === f.key
                              ? 'bg-[#232B34] text-white border border-[#B9F600]'
                              : 'text-[#C3CAAC] hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => fetchUserMatchHistory(accountData.ouid, selectedMatchType)}
                      disabled={userMatchesLoading}
                      className="text-[10px] text-[#B9F600] hover:underline flex items-center gap-1 font-data"
                    >
                      <span className={`material-symbols-outlined text-[12px] ${userMatchesLoading ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      새로고침
                    </button>
                  </div>

                  {/* Match Cards List */}
                  {userMatchesLoading && <MatchCardSkeleton />}

                  {!userMatchesLoading && userMatchesError && (
                    <div className="p-4 text-center text-xs text-[#FF4B4B] bg-[#FF4B4B]/10 rounded-xl border border-[#FF4B4B]/30">
                      {userMatchesError}
                    </div>
                  )}

                  {!userMatchesLoading && userMatchesList.length === 0 && !userMatchesError && (
                    <div className="p-6 text-center text-xs text-[#C3CAAC] bg-[#182029] rounded-xl border border-[#2D333B]">
                      최근 플레이한 매치 기록이 없습니다.
                    </div>
                  )}

                  {!userMatchesLoading && userMatchesList.length > 0 && (
                    <div className="space-y-2">
                      {userMatchesList
                        .filter((m) => {
                          if (userMatchesFilter === 'WIN') return m.result === '승';
                          if (userMatchesFilter === 'DRAW') return m.result === '무';
                          if (userMatchesFilter === 'LOSS') return m.result === '패';
                          return true;
                        })
                        .map((m) => {
                          const isWin = m.result === '승';
                          const isLoss = m.result === '패';
                          const resultColor = isWin
                            ? 'border-l-4 border-l-[#00FF87] bg-[#00FF87]/5'
                            : isLoss
                            ? 'border-l-4 border-l-[#FF4B4B] bg-[#FF4B4B]/5'
                            : 'border-l-4 border-l-amber-400 bg-amber-400/5';

                          const resultBadge = isWin
                            ? 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87]'
                            : isLoss
                            ? 'bg-[#FF4B4B]/20 border-[#FF4B4B] text-[#FF4B4B]'
                            : 'bg-amber-400/20 border-amber-400 text-amber-300';

                          const isExpanded = expandedMatchId === m.matchId;

                          return (
                            <div
                              key={m.matchId}
                              className={`p-3.5 rounded-2xl border border-[#2D333B] bg-[#182029] ${resultColor} hover:border-[#B9F600]/60 transition-all space-y-3`}
                            >
                              {/* Primary Row: Result, Score, Opponent & Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border font-data ${resultBadge}`}
                                    >
                                      {m.result === '승' ? 'WIN 승' : m.result === '패' ? 'LOSS 패' : 'DRAW 무'}
                                    </span>
                                    <span className="text-sm font-black text-white font-headline">
                                      {m.score}
                                    </span>
                                    <span className="text-xs text-[#C3CAAC]">
                                      vs <strong className="text-white">{m.opponentNickname}</strong>
                                    </span>
                                    <span className="bg-[#232B34] text-[#C3CAAC] text-[9px] px-1.5 py-0.2 rounded font-data border border-[#2D333B]">
                                      {m.matchType}
                                    </span>
                                    {m.stadium && (
                                      <span className="text-[10px] text-[#8A99AD] hidden md:inline font-data">
                                        🏟️ {m.stadium}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#C3CAAC] font-data">
                                    <span>📅 {new Date(m.matchDate).toLocaleDateString()} {new Date(m.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>⚽ 슈팅 {m.effectiveShots}/{m.shots}</span>
                                    <span>📊 점유율 {m.possession}%</span>
                                    {m.passSuccessRate !== undefined && (
                                      <span>🎯 패스성공 {m.passSuccessRate}%</span>
                                    )}
                                    <span>🎮 {m.controller === 'pad' ? '게임패드' : '키보드'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {/* Toggle Expand Stats Button */}
                                  <button
                                    onClick={() => setExpandedMatchId(isExpanded ? null : m.matchId)}
                                    className={`px-2.5 py-1.5 rounded-xl border font-data text-xs transition-all flex items-center gap-1 ${
                                      isExpanded
                                        ? 'bg-[#B9F600]/20 border-[#B9F600] text-[#B9F600] font-bold'
                                        : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-white'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      {isExpanded ? 'expand_less' : 'analytics'}
                                    </span>
                                    <span>{isExpanded ? '접기' : '득점자 & 상세'}</span>
                                  </button>

                                  {/* Full Match Tactical Breakdown */}
                                  <button
                                    onClick={() => {
                                      setSelectedMatchId(m.matchId);
                                      fetchMatchDetail(m.matchId);
                                      setActiveSubTab('match');
                                      showToast(`Selected Match #${m.matchId.slice(0, 8)}`);
                                    }}
                                    className="px-3 py-1.5 bg-[#232B34] hover:bg-[#B9F600] hover:text-[#141F00] text-white border border-[#2D333B] rounded-xl font-data text-xs transition-all flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <span>전술 분석</span>
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                  </button>
                                </div>
                              </div>

                              {/* Goalscorers Pill Bar */}
                              <div className="pt-2 border-t border-[#2D333B]/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-data">
                                {/* My Team Goalscorers */}
                                <div className="flex items-center gap-2 bg-[#161A1E] px-2.5 py-1.5 rounded-xl border border-[#2D333B]">
                                  <span className="text-[10px] text-[#C3CAAC] font-bold min-w-[55px] flex items-center gap-1">
                                    <span className="text-[#00FF87]">⚽</span> 내 팀:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    {m.myGoalScorers && m.myGoalScorers.length > 0 ? (
                                      m.myGoalScorers.map((gs, gIdx) => (
                                        <span
                                          key={gIdx}
                                          className="px-2 py-0.5 bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                        >
                                          <span>{gs.name}</span>
                                          <span className="bg-[#00FF87] text-[#141F00] text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                            {gs.goals}골
                                          </span>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-[#8A99AD] italic">득점 없음 (0골)</span>
                                    )}
                                  </div>
                                </div>

                                {/* Opponent Team Goalscorers */}
                                <div className="flex items-center gap-2 bg-[#161A1E] px-2.5 py-1.5 rounded-xl border border-[#2D333B]">
                                  <span className="text-[10px] text-[#C3CAAC] font-bold min-w-[55px] flex items-center gap-1">
                                    <span className="text-[#FF4B4B]">⚽</span> 상대팀:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    {m.oppGoalScorers && m.oppGoalScorers.length > 0 ? (
                                      m.oppGoalScorers.map((gs, gIdx) => (
                                        <span
                                          key={gIdx}
                                          className="px-2 py-0.5 bg-[#FF4B4B]/15 text-[#FF4B4B] border border-[#FF4B4B]/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                        >
                                          <span>{gs.name}</span>
                                          <span className="bg-[#FF4B4B] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                            {gs.goals}골
                                          </span>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-[#8A99AD] italic">무득점 (0골)</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Match Deep Analytics Drawer */}
                              {isExpanded && (
                                <div className="p-3 bg-[#13171B] rounded-xl border border-[#2D333B] space-y-3 animate-in fade-in text-xs font-data">
                                  <div className="flex justify-between items-center border-b border-[#2D333B] pb-2">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[#B9F600] text-sm">equalizer</span>
                                      매치 상세 통계 분석 (Detailed Match Breakdown)
                                    </span>
                                    {m.mvpPlayer && (
                                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                        ⭐ MVP: {m.mvpPlayer}
                                      </span>
                                    )}
                                  </div>

                                  {/* Side by side Stats Bar Comparisons */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Possession Bar */}
                                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                                        <span>점유율</span>
                                        <span className="text-white font-bold">{m.possession}% vs {100 - m.possession}%</span>
                                      </div>
                                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
                                        <div className="bg-[#00FF87] h-full" style={{ width: `${m.possession}%` }} />
                                        <div className="bg-[#FF4B4B] h-full" style={{ width: `${100 - m.possession}%` }} />
                                      </div>
                                    </div>

                                    {/* Shot Accuracy */}
                                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                                        <span>슈팅 유효율</span>
                                        <span className="text-[#00FF87] font-bold">
                                          {m.shots > 0 ? Math.round((m.effectiveShots / m.shots) * 100) : 0}% ({m.effectiveShots}/{m.shots})
                                        </span>
                                      </div>
                                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-[#B9F600] h-full"
                                          style={{ width: `${m.shots > 0 ? (m.effectiveShots / m.shots) * 100 : 0}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Pass / Tackle Success */}
                                    <div className="bg-[#182029] p-2.5 rounded-lg border border-[#2D333B] space-y-1">
                                      <div className="flex justify-between text-[10px] text-[#C3CAAC]">
                                        <span>패스 / 태클 성공률</span>
                                        <span className="text-sky-400 font-bold">
                                          패스 {m.passSuccessRate ?? 85}% | 태클 {m.tackleSuccessRate ?? 70}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex gap-0.5">
                                        <div className="bg-sky-400 h-full" style={{ width: `${m.passSuccessRate ?? 85}%` }} />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] text-[#8A99AD] pt-1">
                                    <span>경기 ID: <strong className="text-white font-data">{m.matchId}</strong></span>
                                    <button
                                      onClick={() => {
                                        setSelectedMatchId(m.matchId);
                                        fetchMatchDetail(m.matchId);
                                        setActiveSubTab('match');
                                      }}
                                      className="text-[#B9F600] hover:underline flex items-center gap-0.5"
                                    >
                                      <span>상세 라인업 & 선수별 평점 이동</span>
                                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. 매치 정보 (Match Detail Info) Tab */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'match' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Select from User Recent Matches */}
          {userMatchesList.length > 0 && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-data text-xs text-white font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#B9F600] text-sm">history</span>
                  Recent Matches Quick Select ({nickname})
                </span>
                <span className="text-[10px] text-[#C3CAAC]">Select to load detail breakdown</span>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                {userMatchesList.map((m) => {
                  const isSelected = selectedMatchId === m.matchId;
                  const isWin = m.result === '승';
                  const isLoss = m.result === '패';
                  const resBadge = isWin ? 'text-[#00FF87]' : isLoss ? 'text-[#FF4B4B]' : 'text-amber-400';

                  return (
                    <button
                      key={m.matchId}
                      onClick={() => {
                        setSelectedMatchId(m.matchId);
                        fetchMatchDetail(m.matchId);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-data transition-all flex flex-col items-start min-w-[140px] whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#B9F600] text-[#141F00] font-bold border-[#B9F600] shadow-[0_0_10px_rgba(185,246,0,0.2)]'
                          : 'bg-[#182029] text-[#C3CAAC] border-[#2D333B] hover:text-white hover:bg-[#232B34]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[11px]">
                        <span className={`font-bold ${isSelected ? 'text-[#141F00]' : resBadge}`}>
                          [{m.result}] {m.score}
                        </span>
                        <span className="text-[9px] opacity-75">{new Date(m.matchDate).toLocaleDateString().slice(5)}</span>
                      </div>
                      <span className="text-[10px] truncate max-w-[120px] mt-0.5 opacity-90">
                        vs {m.opponentNickname}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#B9F600] text-base">analytics</span>
                Match Detail Query
              </h2>
              <span className="font-data text-[10px] text-[#C3CAAC]">Match ID: {selectedMatchId}</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                placeholder="Enter NEXON Match ID"
                className="flex-1 bg-[#182029] border border-[#2D333B] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#B9F600]"
              />
              <button
                onClick={() => fetchMatchDetail(selectedMatchId)}
                className="bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-4 py-2 rounded-xl hover:brightness-105"
              >
                Fetch Match
              </button>
            </div>
          </div>

          {matchLoading && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center text-xs text-[#C3CAAC] space-y-2">
              <span className="material-symbols-outlined text-[#B9F600] text-3xl animate-spin">sync</span>
              <p className="font-bold text-white">Loading match statistics & squad performance...</p>
            </div>
          )}

          {!matchLoading && matchError && (
            <div className="bg-[#93000A]/30 border border-[#FF4B4B]/60 rounded-2xl p-6 text-center text-xs text-white">
              {matchError}
            </div>
          )}

          {!matchLoading && matchDetail && (
            <div className="space-y-4">
              {/* Scoreboard Header */}
              <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="text-center space-y-1">
                  <span className="font-data text-[10px] text-[#B9F600] uppercase tracking-wider font-bold">
                    {matchDetail.matchType}
                  </span>
                  <p className="text-[11px] text-[#C3CAAC]">
                    {new Date(matchDetail.matchDate).toLocaleString()}
                  </p>
                </div>

                {/* Teams Score Grid */}
                {matchDetail.teams && matchDetail.teams.length >= 2 && (
                  <div className="flex items-center justify-around py-3 border-y border-[#2D333B]">
                    <div className="text-center space-y-1">
                      <p className="text-base font-bold text-white">{matchDetail.teams[0].nickname}</p>
                      <span className="bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40 text-[10px] font-bold px-2 py-0.5 rounded font-data">
                        {matchDetail.teams[0].result === '승' ? 'WIN 승' : matchDetail.teams[0].result}
                      </span>
                    </div>

                    <div className="text-center font-headline font-black text-3xl text-[#B9F600]">
                      {matchDetail.teams[0].score} : {matchDetail.teams[1].score}
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-base font-bold text-white">{matchDetail.teams[1].nickname}</p>
                      <span className="bg-[#FF4B4B]/20 text-[#FF4B4B] border border-[#FF4B4B]/40 text-[10px] font-bold px-2 py-0.5 rounded font-data">
                        {matchDetail.teams[1].result === '패' ? 'LOSS 패' : matchDetail.teams[1].result}
                      </span>
                    </div>
                  </div>
                )}

                {/* Match Stats Comparison Bars */}
                {matchDetail.teams && matchDetail.teams.length >= 2 && (
                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-[#C3CAAC] mb-1 font-data">
                        <span>{matchDetail.teams[0].possession}%</span>
                        <span className="text-white font-bold uppercase">Possession (점유율)</span>
                        <span>{matchDetail.teams[1].possession}%</span>
                      </div>
                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#B9F600] h-full"
                          style={{ width: `${matchDetail.teams[0].possession}%` }}
                        />
                        <div
                          className="bg-[#3D4754] h-full"
                          style={{ width: `${matchDetail.teams[1].possession}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-[#C3CAAC] mb-1 font-data">
                        <span>{matchDetail.teams[0].effectiveShots}/{matchDetail.teams[0].totalShots}</span>
                        <span className="text-white font-bold uppercase">Effective Shots (유효슈팅/총슈팅)</span>
                        <span>{matchDetail.teams[1].effectiveShots}/{matchDetail.teams[1].totalShots}</span>
                      </div>
                      <div className="w-full bg-[#232B34] h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#00FF87] h-full"
                          style={{
                            width: `${(matchDetail.teams[0].effectiveShots / (matchDetail.teams[0].totalShots || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-[#FF4B4B] h-full"
                          style={{
                            width: `${(matchDetail.teams[1].effectiveShots / (matchDetail.teams[1].totalShots || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Ratings Squad Cards */}
              {matchDetail.teams?.[0]?.squad && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white font-headline">
                    Starting Player Match Ratings ({matchDetail.teams[0].nickname})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchDetail.teams[0].squad.map((p) => (
                      <div
                        key={p.spId}
                        className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-contain bg-[#182029] rounded-lg border border-[#2D333B]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-[#B9F600] text-[#141F00] text-[9px] font-bold px-1 rounded font-data">
                                {p.season}
                              </span>
                              <span className="text-xs font-bold text-white">{p.name}</span>
                            </div>
                            <p className="font-data text-[10px] text-[#C3CAAC]">
                              {p.position} • OVR {p.ovr} • Grade +{p.grade}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-data text-xs text-[#B9F600] font-bold">
                            ★ {p.rating}
                          </span>
                          <p className="text-[10px] text-[#C3CAAC] font-data">
                            {p.goals}G {p.assists}A
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. 랭커 정보 (Ranker Info) Tab */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'ranker' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white">FC Online Top 100 Ranker Leaderboard</h2>
              <p className="text-xs text-[#C3CAAC]">Official 1v1 match rankers and top meta setups</p>
            </div>
            <button
              onClick={fetchRankers}
              disabled={rankerLoading}
              className="p-2 bg-[#232B34] hover:bg-[#2d3642] text-[#B9F600] rounded-xl text-xs font-data flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Reload</span>
            </button>
          </div>

          {rankerLoading && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center text-xs text-[#C3CAAC]">
              Loading official top ranker statistics...
            </div>
          )}

          {!rankerLoading && rankers.length > 0 && (
            <div className="space-y-2">
              {rankers.map((r) => (
                <div
                  key={r.rank}
                  className="bg-[#161A1E] border border-[#2D333B] hover:border-[#B9F600]/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-black text-sm ${
                        r.rank === 1
                          ? 'bg-[#B9F600] text-[#141F00] shadow-[0_0_10px_rgba(185,246,0,0.3)]'
                          : r.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : r.rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#232B34] text-white'
                      }`}
                    >
                      {r.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-headline">
                          {r.nickname}
                        </span>
                        <span className="bg-[#232B34] text-[#C3CAAC] text-[9px] font-data px-1.5 py-0.5 rounded">
                          {r.division}
                        </span>
                      </div>
                      <p className="font-data text-[11px] text-[#C3CAAC] mt-0.5">
                        Win Rate: <strong className="text-[#00FF87]">{r.winRate}</strong> ({r.totalMatches} matches)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-data">
                    <div className="bg-[#182029] border border-[#2D333B] px-3 py-1.5 rounded-xl text-right">
                      <p className="text-[9px] text-[#C3CAAC] uppercase">Formation</p>
                      <p className="text-white font-bold">{r.topFormation}</p>
                    </div>
                    <div className="bg-[#182029] border border-[#2D333B] px-3 py-1.5 rounded-xl text-right">
                      <p className="text-[9px] text-[#C3CAAC] uppercase">Key Ace Player</p>
                      <p className="text-[#B9F600] font-bold">{r.mainPlayer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. 메타데이터 (Metadata Info) Tab */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'metadata' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white">FC Online Static Metadata JSON APIs</h2>
              <p className="text-xs text-[#C3CAAC]">Fetch reference JSON codes for match types, seasons, positions, and SPIDs</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'matchtype', label: 'matchtype.json' },
                { id: 'seasonid', label: 'seasonid.json' },
                { id: 'spposition', label: 'spposition.json' },
                { id: 'division', label: 'division.json' },
                { id: 'spid', label: 'spid.json (Sample)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetaType(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-data text-xs font-bold border transition-all ${
                    metaType === m.id
                      ? 'bg-[#B9F600] text-[#141F00] border-[#B9F600]'
                      : 'bg-[#232B34] text-[#C3CAAC] border-[#2D333B] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {metaLoading && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-8 text-center text-xs text-[#C3CAAC]">
              Loading static metadata JSON...
            </div>
          )}

          {!metaLoading && metaData.length > 0 && (
            <div className="bg-[#161A1E] border border-[#2D333B] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[#2D333B] pb-2">
                <span className="font-data text-xs text-[#B9F600] font-bold uppercase">
                  Metadata Type: {metaType}.json ({metaData.length} entries)
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(metaData, null, 2))}
                  className="px-2.5 py-1 bg-[#232B34] text-xs font-data text-white rounded-lg flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>Copy JSON</span>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto font-mono text-[11px] bg-[#182029] p-3 rounded-xl border border-[#2D333B] text-[#00FF87] space-y-1">
                <pre>{JSON.stringify(metaData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. 이미지 정보 (Image CDN Info) Tab */}
      {/* ------------------------------------------------------------------ */}
      {activeSubTab === 'images' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white">NEXON FC Online Official Image Asset CDN</h2>
              <p className="text-xs text-[#C3CAAC]">
                Construct live player portraits, action shots, and season badge image links
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-data text-[#C3CAAC] uppercase mb-1">
                  Player SPID (e.g. 250102143)
                </label>
                <input
                  type="text"
                  value={spIdInput}
                  onChange={(e) => setSpIdInput(e.target.value)}
                  placeholder="250102143"
                  className="w-full bg-[#182029] border border-[#2D333B] rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#B9F600]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-data text-[#C3CAAC] uppercase mb-1">
                  Season ID (e.g. 101)
                </label>
                <input
                  type="text"
                  value={seasonIdInput}
                  onChange={(e) => setSeasonIdInput(e.target.value)}
                  placeholder="101"
                  className="w-full bg-[#182029] border border-[#2D333B] rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#B9F600]"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateImageUrls}
              className="w-full bg-[#B9F600] text-[#141F00] font-data font-bold text-xs py-2.5 rounded-xl hover:brightness-105"
            >
              Generate CDN Image Links
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-data text-[#C3CAAC] self-center">Presets:</span>
            {[
              { name: 'Kylian Mbappé', spId: '250102143', season: '101' },
              { name: 'Son Heung-min', spId: '240000001', season: '101' },
              { name: 'Jude Bellingham', spId: '101000001', season: '101' },
              { name: 'Erling Haaland', spId: '250102144', season: '101' },
            ].map((preset) => (
              <button
                key={preset.spId}
                onClick={() => {
                  setSpIdInput(preset.spId);
                  setSeasonIdInput(preset.season);
                  setImageUrls({
                    portrait: `https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p${preset.spId}.png`,
                    action: `https://fconline.gcdn.nexon.com/live/externalAssets/common/playersAction/p${preset.spId}.png`,
                    seasonBadge: `https://fconline.gcdn.nexon.com/live/externalAssets/common/season/${preset.season}.png`,
                  });
                }}
                className="px-3 py-1 bg-[#182029] hover:bg-[#232B34] text-xs font-data text-white rounded-lg border border-[#2D333B]"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Image Asset Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Player Portrait */}
            <div className="bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl text-center space-y-3">
              <span className="font-data text-[10px] text-[#B9F600] font-bold uppercase">
                1. Player Portrait (상반신 이미지)
              </span>
              <div className="h-40 bg-[#182029] rounded-xl border border-[#2D333B] flex items-center justify-center overflow-hidden p-2">
                <img
                  src={imageUrls.portrait}
                  alt="Player Portrait"
                  className="max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102143.png';
                  }}
                />
              </div>
              <button
                onClick={() => copyToClipboard(imageUrls.portrait)}
                className="w-full py-2 bg-[#232B34] hover:bg-[#2d3642] text-xs font-data text-white rounded-xl flex items-center justify-center gap-1 border border-[#2D333B]"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>Copy Portrait URL</span>
              </button>
            </div>

            {/* 2. Player Action Shot */}
            <div className="bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl text-center space-y-3">
              <span className="font-data text-[10px] text-[#B9F600] font-bold uppercase">
                2. Action Shot (액션샷 이미지)
              </span>
              <div className="h-40 bg-[#182029] rounded-xl border border-[#2D333B] flex items-center justify-center overflow-hidden p-2">
                <img
                  src={imageUrls.action}
                  alt="Player Action"
                  className="max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://fconline.gcdn.nexon.com/live/externalAssets/common/players/p250102143.png';
                  }}
                />
              </div>
              <button
                onClick={() => copyToClipboard(imageUrls.action)}
                className="w-full py-2 bg-[#232B34] hover:bg-[#2d3642] text-xs font-data text-white rounded-xl flex items-center justify-center gap-1 border border-[#2D333B]"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>Copy Action URL</span>
              </button>
            </div>

            {/* 3. Season Badge */}
            <div className="bg-[#161A1E] border border-[#2D333B] p-4 rounded-2xl text-center space-y-3">
              <span className="font-data text-[10px] text-[#B9F600] font-bold uppercase">
                3. Season Badge (시즌 클래스 로고)
              </span>
              <div className="h-40 bg-[#182029] rounded-xl border border-[#2D333B] flex items-center justify-center overflow-hidden p-2">
                <img
                  src={imageUrls.seasonBadge}
                  alt="Season Badge"
                  className="max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://fconline.gcdn.nexon.com/live/externalAssets/common/season/101.png';
                  }}
                />
              </div>
              <button
                onClick={() => copyToClipboard(imageUrls.seasonBadge)}
                className="w-full py-2 bg-[#232B34] hover:bg-[#2d3642] text-xs font-data text-white rounded-xl flex items-center justify-center gap-1 border border-[#2D333B]"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>Copy Season URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#161A1E] border border-[#2D333B] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-headline">NEXON Open API Key</h3>
                <p className="text-xs text-[#C3CAAC]">Configure official NEXON developer key</p>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-[#C3CAAC] hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#C3CAAC]">
              <p>
                Get your key from{' '}
                <a
                  href="https://openapi.nexon.com/ko/game/fconline/?id=2"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#B9F600] underline font-bold"
                >
                  NEXON Open API Developer Portal
                </a>
                .
              </p>

              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste your live test_nxapi_... key here"
                className="w-full bg-[#232B34] border border-[#2D333B] rounded-xl p-2.5 text-white text-xs font-mono placeholder-[#C3CAAC]/50 focus:outline-none focus:ring-2 focus:ring-[#B9F600]"
              />

              {keyStatusMsg && (
                <div className="p-2 bg-[#182029] rounded-lg font-data text-xs text-white">
                  {keyStatusMsg}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2D333B]">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-2 bg-[#232B34] text-[#C3CAAC] hover:text-white font-data text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomKey}
                disabled={keyValidating}
                className="px-4 py-2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs rounded-xl hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                {keyValidating ? (
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                ) : (
                  <span>Verify & Save Key</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
