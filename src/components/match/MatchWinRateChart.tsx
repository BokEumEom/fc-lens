import React, { useState } from 'react';
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
import type { MatchSummary, MatchesSummary } from '../../lib/api/types';

interface MatchWinRateChartProps {
  matches: MatchSummary[];
  summary: MatchesSummary | null;
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
