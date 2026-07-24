import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { Player, Formation, SquadSlot } from '../types';
import { FORMATIONS, formatBP } from '../data/mockData';
import { PlayerPickerModal } from './PlayerPickerModal';

interface SquadAnalysisViewProps {
  allPlayers: Player[];
  onSelectPlayerDetail: (player: Player) => void;
}

export interface SquadPreset {
  id: string;
  name: string;
  formationId: string;
  slots: SquadSlot[];
  bench: Player[];
  updatedAt: string;
}

export const SquadAnalysisView: React.FC<SquadAnalysisViewProps> = ({
  allPlayers,
  onSelectPlayerDetail,
}) => {
  // Saved presets state
  const [presets, setPresets] = useState<SquadPreset[]>(() => {
    try {
      const saved = localStorage.getItem('fclens_squad_presets_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load squad presets:', e);
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string>('');
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS[0]);
  const [slots, setSlots] = useState<SquadSlot[]>([]);
  const [bench, setBench] = useState<Player[]>([]);

  // Picker modal state
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);
  const [isBenchPickerOpen, setIsBenchPickerOpen] = useState(false);

  // Drag and Drop state
  const [dragSource, setDragSource] = useState<{
    type: 'slot' | 'bench';
    id: string; // slotId or bench index
    player: Player;
  } | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Click-to-swap state for touch / mobile tap convenience
  const [selectedSwapSource, setSelectedSwapSource] = useState<{
    type: 'slot' | 'bench';
    id: string;
    player: Player;
  } | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  // Initialize presets on mount
  useEffect(() => {
    if (presets.length === 0) {
      // Create initial default squad
      const initialSlots: SquadSlot[] = FORMATIONS[0].slots.map((fSlot, idx) => {
        const matchingPlayer =
          allPlayers.find((p) => p.position === fSlot.position) || allPlayers[idx % allPlayers.length];
        return {
          slotId: fSlot.id,
          positionLabel: fSlot.position,
          player: matchingPlayer || null,
          grade: idx === 0 ? 5 : idx % 2 === 0 ? 3 : 1,
        };
      });

      const defaultPreset: SquadPreset = {
        id: 'preset-default',
        name: '메인 4-3-3 스쿼드',
        formationId: FORMATIONS[0].id,
        slots: initialSlots,
        bench: allPlayers.slice(11, 15),
        updatedAt: new Date().toISOString(),
      };

      const budgetPresetSlots: SquadSlot[] = FORMATIONS[1].slots.map((fSlot, idx) => {
        const p = allPlayers[(idx + 3) % allPlayers.length];
        return {
          slotId: fSlot.id,
          positionLabel: fSlot.position,
          player: p || null,
          grade: 5,
        };
      });

      const budgetPreset: SquadPreset = {
        id: 'preset-budget',
        name: '200억 가성비 4-2-3-1',
        formationId: FORMATIONS[1].id,
        slots: budgetPresetSlots,
        bench: allPlayers.slice(5, 9),
        updatedAt: new Date().toISOString(),
      };

      const initialList = [defaultPreset, budgetPreset];
      setPresets(initialList);
      setActivePresetId(defaultPreset.id);
      setSlots(defaultPreset.slots);
      setBench(defaultPreset.bench);
      setSelectedFormation(FORMATIONS[0]);
      localStorage.setItem('fclens_squad_presets_v2', JSON.stringify(initialList));
    } else {
      const active = presets.find((p) => p.id === activePresetId) || presets[0];
      setActivePresetId(active.id);
      setSlots(active.slots);
      setBench(active.bench || []);
      const form = FORMATIONS.find((f) => f.id === active.formationId) || FORMATIONS[0];
      setSelectedFormation(form);
    }
  }, []);

  // Save current presets list to localStorage
  const savePresetsToStorage = (updatedList: SquadPreset[]) => {
    setPresets(updatedList);
    try {
      localStorage.setItem('fclens_squad_presets_v2', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save squad presets:', e);
    }
  };

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;

    setActivePresetId(target.id);
    setSlots(target.slots);
    setBench(target.bench || []);
    const form = FORMATIONS.find((f) => f.id === target.formationId) || FORMATIONS[0];
    setSelectedFormation(form);
    setSelectedSwapSource(null);
    showToast(`'${target.name}' 스쿼드로 전환되었습니다.`);
  };

  // Create new preset
  const handleCreatePreset = () => {
    const newId = `preset-${Date.now()}`;
    const newName = `새 스쿼드 ${presets.length + 1}`;
    const defaultForm = FORMATIONS[0];

    const newSlots: SquadSlot[] = defaultForm.slots.map((fSlot) => ({
      slotId: fSlot.id,
      positionLabel: fSlot.position,
      player: null,
      grade: 1,
    }));

    const newPreset: SquadPreset = {
      id: newId,
      name: newName,
      formationId: defaultForm.id,
      slots: newSlots,
      bench: [],
      updatedAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    savePresetsToStorage(updated);
    setActivePresetId(newId);
    setSlots(newSlots);
    setBench([]);
    setSelectedFormation(defaultForm);
    showToast(`새 스쿼드 '${newName}'가 생성되었습니다.`);
  };

  // Save current active squad edits
  const handleSaveCurrentSquad = () => {
    const updated = presets.map((p) => {
      if (p.id === activePresetId) {
        return {
          ...p,
          formationId: selectedFormation.id,
          slots,
          bench,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    savePresetsToStorage(updated);
    showToast('스쿼드가 성공적으로 저장되었습니다!');
  };

  // Delete current preset
  const handleDeletePreset = (presetId: string) => {
    if (presets.length <= 1) {
      showToast('최소 1개의 스쿼드는 유지되어야 합니다.');
      return;
    }
    const filtered = presets.filter((p) => p.id !== presetId);
    savePresetsToStorage(filtered);
    const next = filtered[0];
    setActivePresetId(next.id);
    setSlots(next.slots);
    setBench(next.bench || []);
    const form = FORMATIONS.find((f) => f.id === next.formationId) || FORMATIONS[0];
    setSelectedFormation(form);
    showToast('스쿼드가 삭제되었습니다.');
  };

  // Rename current preset
  const handleRenamePreset = () => {
    if (!presetNameInput.trim()) return;
    const updated = presets.map((p) =>
      p.id === activePresetId ? { ...p, name: presetNameInput.trim() } : p
    );
    savePresetsToStorage(updated);
    setEditingPresetName(false);
    showToast('스쿼드 이름이 변경되었습니다.');
  };

  // Handle formation change
  const handleFormationChange = (formId: string) => {
    const newForm = FORMATIONS.find((f) => f.id === formId) || FORMATIONS[0];
    setSelectedFormation(newForm);

    setSlots((prevSlots) => {
      return newForm.slots.map((newSlot, idx) => {
        const existingSlot = prevSlots[idx];
        return {
          slotId: newSlot.id,
          positionLabel: newSlot.position,
          player: existingSlot ? existingSlot.player : null,
          grade: existingSlot ? existingSlot.grade : 1,
        };
      });
    });
  };

  // Quick Auto-Fill Empty Slots
  const handleAutoFill = () => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.player) return slot;
        // Find best unused player
        const usedIds = slots.map((s) => s.player?.id).filter(Boolean);
        const candidate = allPlayers.find(
          (p) =>
            !usedIds.includes(p.id) &&
            (p.position === slot.positionLabel || p.preferredPositions.includes(slot.positionLabel))
        ) || allPlayers.find((p) => !usedIds.includes(p.id));

        return {
          ...slot,
          player: candidate || null,
          grade: 3,
        };
      })
    );
    showToast('빈 포지션에 추천 선수가 자동 배치되었습니다.');
  };

  // Clear all slots
  const handleClearAllSlots = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, player: null })));
    showToast('모든 선수가 라인업에서 해제되었습니다.');
  };

  // Helper calculation for OVR with grade
  const getSlotOvr = (slot: SquadSlot) => {
    if (!slot.player) return 0;
    const gradeBonus = slot.grade === 1 ? 0 : slot.grade === 3 ? 2 : slot.grade === 5 ? 5 : 10;
    return slot.player.ovr + gradeBonus;
  };

  // Statistics
  const filledSlots = slots.filter((s) => s.player !== null);
  const avgOvr =
    filledSlots.length > 0
      ? (filledSlots.reduce((acc, s) => acc + getSlotOvr(s), 0) / filledSlots.length).toFixed(1)
      : '0.0';

  const totalSalary = filledSlots.reduce((acc, s) => acc + (s.player?.salary || 0), 0);
  const totalValueBP = filledSlots.reduce((acc, s) => acc + (s.player?.bpPrice || 0), 0);

  // Chemistry Analysis
  const nationalityCounts: Record<string, number> = {};
  const clubCounts: Record<string, number> = {};
  filledSlots.forEach((s) => {
    if (s.player) {
      nationalityCounts[s.player.nationality] = (nationalityCounts[s.player.nationality] || 0) + 1;
      clubCounts[s.player.club] = (clubCounts[s.player.club] || 0) + 1;
    }
  });

  const maxNation = Object.entries(nationalityCounts).sort((a, b) => b[1] - a[1])[0];
  const maxClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0];

  const nationalBondText =
    maxNation && maxNation[1] >= 2
      ? `${maxNation[0]} ${maxNation[1]}명 조합`
      : '국가 케미 미적용';
  const nationalBonus =
    maxNation && maxNation[1] >= 4
      ? '+8 가속력'
      : maxNation && maxNation[1] >= 2
      ? '+4 가속력'
      : '케미 없음';

  const clubLegendText =
    maxClub && maxClub[1] >= 2 ? `${maxClub[0]} (${maxClub[1]}명)` : '클럽 케미 미적용';
  const clubBonus =
    maxClub && maxClub[1] >= 4 ? '+5 드리블' : maxClub && maxClub[1] >= 2 ? '+2 드리블' : '케미 없음';

  // Key strength & weak point
  const isPacy = filledSlots.every((s) => (s.player?.pac || 0) >= 110);
  const keyStrength = isPacy ? '폭발적인 역습 속도' : '정교한 빌드업 & 패스';
  const weakPoint = totalSalary > 230 ? '급여 제한 초과 (230 급여 제한)' : '공중볼 경합 보완 필요';

  // Helper calculation for Average Team Attributes
  const getTeamAvgStat = (statKey: 'pac' | 'sho' | 'pas' | 'dri' | 'def' | 'phy') => {
    if (filledSlots.length === 0) return 0;
    const sum = filledSlots.reduce((acc, slot) => {
      if (!slot.player) return acc;
      const gradeBonus = slot.grade === 1 ? 0 : slot.grade === 3 ? 2 : slot.grade === 5 ? 5 : 10;
      return acc + (slot.player[statKey] || 0) + gradeBonus;
    }, 0);
    return Math.round(sum / filledSlots.length);
  };

  const avgPac = getTeamAvgStat('pac');
  const avgSho = getTeamAvgStat('sho');
  const avgPas = getTeamAvgStat('pas');
  const avgDri = getTeamAvgStat('dri');
  const avgDef = getTeamAvgStat('def');
  const avgPhy = getTeamAvgStat('phy');

  const teamRadarData = [
    { subject: '스피드 (PAC)', value: avgPac, fullMark: 130 },
    { subject: '슛 (SHO)', value: avgSho, fullMark: 130 },
    { subject: '패스 (PAS)', value: avgPas, fullMark: 130 },
    { subject: '드리블 (DRI)', value: avgDri, fullMark: 130 },
    { subject: '수비 (DEF)', value: avgDef, fullMark: 130 },
    { subject: '피지컬 (PHY)', value: avgPhy, fullMark: 130 },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Cycle enhancement grade for slot
  const handleCycleGrade = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    const nextGrades = [1, 3, 5, 8];
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slotId === slotId) {
          const currentIdx = nextGrades.indexOf(s.grade);
          const nextIdx = (currentIdx + 1) % nextGrades.length;
          return { ...s, grade: nextGrades[nextIdx] };
        }
        return s;
      })
    );
  };

  // --- DRAG AND DROP & TAP-TO-SWAP LOGIC ---

  // Swap or Move Player between two targets (slot or bench)
  const executeSwapOrMove = (
    src: { type: 'slot' | 'bench'; id: string; player: Player },
    target: { type: 'slot' | 'bench'; id: string }
  ) => {
    if (src.type === target.type && src.id === target.id) return; // Same node

    // Case 1: Slot to Slot (Swap two pitch positions)
    if (src.type === 'slot' && target.type === 'slot') {
      const srcSlot = slots.find((s) => s.slotId === src.id);
      const targetSlot = slots.find((s) => s.slotId === target.id);
      if (!srcSlot || !targetSlot) return;

      setSlots((prev) =>
        prev.map((s) => {
          if (s.slotId === src.id) return { ...s, player: targetSlot.player };
          if (s.slotId === target.id) return { ...s, player: srcSlot.player };
          return s;
        })
      );
      showToast(`${srcSlot.positionLabel} ↔ ${targetSlot.positionLabel} 선수 위치 교체`);
    }

    // Case 2: Bench to Slot
    if (src.type === 'bench' && target.type === 'slot') {
      const benchIdx = parseInt(src.id, 10);
      const benchPlayer = bench[benchIdx];
      const targetSlot = slots.find((s) => s.slotId === target.id);
      if (!benchPlayer || !targetSlot) return;

      const oldSlotPlayer = targetSlot.player;

      // Update slot
      setSlots((prev) =>
        prev.map((s) => (s.slotId === target.id ? { ...s, player: benchPlayer } : s))
      );

      // Update bench: replace bench item with old slot player, or filter out if null
      setBench((prev) => {
        const newBench = [...prev];
        if (oldSlotPlayer) {
          newBench[benchIdx] = oldSlotPlayer;
        } else {
          newBench.splice(benchIdx, 1);
        }
        return newBench;
      });

      showToast(`${targetSlot.positionLabel} 포지션으로 주전 등록 완료`);
    }

    // Case 3: Slot to Bench
    if (src.type === 'slot' && target.type === 'bench') {
      const srcSlot = slots.find((s) => s.slotId === src.id);
      if (!srcSlot || !srcSlot.player) return;

      const playerToBench = srcSlot.player;

      // Clear slot
      setSlots((prev) =>
        prev.map((s) => (s.slotId === src.id ? { ...s, player: null } : s))
      );

      // Add to bench
      setBench((prev) => [...prev, playerToBench]);
      showToast(`${playerToBench.name} 선수가 후보 명단으로 이동되었습니다.`);
    }

    // Reset selection & drag state
    setDragSource(null);
    setDragOverTarget(null);
    setSelectedSwapSource(null);
  };

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: 'slot' | 'bench',
    id: string,
    player: Player
  ) => {
    setDragSource({ type, id, player });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetType: 'slot' | 'bench', targetId: string) => {
    e.preventDefault();
    if (!dragSource) return;
    executeSwapOrMove(dragSource, { type: targetType, id: targetId });
  };

  // Touch / Tap-to-Swap toggle handler
  const handleNodeClick = (type: 'slot' | 'bench', id: string, player: Player | null) => {
    // If no player in source and no selection, open picker modal
    if (!selectedSwapSource && !player && type === 'slot') {
      setPickerSlotId(id);
      return;
    }

    if (!selectedSwapSource) {
      if (player) {
        setSelectedSwapSource({ type, id, player });
        showToast('교체할 다른 위치나 후보 선수를 터치하세요.');
      } else if (type === 'slot') {
        setPickerSlotId(id);
      }
      return;
    }

    // If tap same source again, cancel selection
    if (selectedSwapSource.type === type && selectedSwapSource.id === id) {
      setSelectedSwapSource(null);
      showToast('교체 선택이 취소되었습니다.');
      return;
    }

    // Perform swap/move
    executeSwapOrMove(selectedSwapSource, { type, id });
  };

  // Add Bench Player from Modal
  const handleAddBenchPlayer = (player: Player) => {
    if (bench.some((p) => p.id === player.id)) {
      showToast('이미 후보 명단에 등록된 선수입니다.');
      return;
    }
    setBench((prev) => [...prev, player]);
    setIsBenchPickerOpen(false);
    showToast(`${player.name} 선수가 후보 명단에 추가되었습니다.`);
  };

  const activePreset = presets.find((p) => p.id === activePresetId);

  return (
    <div className="pb-28 pt-2 px-4 space-y-5">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-4 py-2 rounded-full shadow-2xl z-50 text-center border border-white/20"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Squad Presets Selector Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B9F600] inline-block animate-pulse" />
            SQUAD BUILDER PRESETS
          </p>

          <button
            onClick={handleCreatePreset}
            className="flex items-center gap-1 text-[11px] font-bold text-[#B9F600] hover:underline"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>+ 새 스쿼드</span>
          </button>
        </div>

        {/* Preset Tabs Header */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-[#B9F600] text-[#141F00] border-[#B9F600] shadow-[0_0_15px_rgba(185,246,0,0.3)]'
                    : 'bg-[#161A1E] text-[#8A99AD] border-[#2D333B] hover:text-white hover:border-[#38BDF8]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
                <span>{preset.name}</span>
                {isActive && presets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                    className="p-0.5 hover:bg-black/20 rounded text-[#141F00]"
                    title="스쿼드 삭제"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Header Title & Primary Action Buttons */}
      <div className="flex justify-between items-center bg-[#141C25] border border-[#2D333B] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          {editingPresetName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                className="bg-[#0F1318] text-white text-sm font-bold px-2 py-1 rounded border border-[#B9F600] focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleRenamePreset}
                className="p-1 bg-[#B9F600] text-[#141F00] rounded font-bold text-xs"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">
                {activePreset?.name || '스쿼드 빌더'}
              </h1>
              <button
                onClick={() => {
                  setPresetNameInput(activePreset?.name || '');
                  setEditingPresetName(true);
                }}
                className="text-[#8A99AD] hover:text-white p-1"
                title="이름 수정"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveCurrentSquad}
            className="bg-[#B9F600] text-[#141F00] px-3.5 py-1.5 rounded-xl font-data font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(185,246,0,0.25)] hover:bg-[#a3d800] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            저장
          </button>
        </div>
      </div>

      {/* Squad Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">평균 OVR</span>
          <span className="text-2xl font-black text-[#B9F600] font-headline">{avgOvr}</span>
        </div>

        <div className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">총 급여</span>
          <span
            className={`text-2xl font-black font-headline ${
              totalSalary > 230 ? 'text-[#FF4B4B]' : 'text-white'
            }`}
          >
            {totalSalary}
            <span className="text-xs text-[#C3CAAC] font-data font-normal">/230</span>
          </span>
        </div>

        <div className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">구단 가치</span>
          <span className="text-xl sm:text-2xl font-black text-white font-headline">
            {formatBP(totalValueBP)}
          </span>
        </div>
      </div>

      {/* Salary Cap Warning Badge */}
      {totalSalary > 230 && (
        <div className="bg-[#93000A]/40 border border-[#FF4B4B]/60 text-[#FFDAD6] p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[#FF4B4B] text-[18px]">warning</span>
          <span>급여 제한을 초과했습니다 ({totalSalary}/230)! 선수를 조정해주세요.</span>
        </div>
      )}

      {/* Toolbar & Formation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#161A1E] border border-[#2D333B] px-3.5 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-data text-[#C3CAAC]">포메이션:</span>
          <select
            value={selectedFormation.id}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="bg-[#232B34] border border-[#2D333B] text-xs font-data text-white font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B9F600] cursor-pointer"
          >
            {FORMATIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoFill}
            className="px-2.5 py-1.5 bg-[#232B34] hover:bg-[#2D333B] text-[#B9F600] border border-[#2D333B] text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            title="빈 자리에 자동 추천 배치"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            <span>자동 채우기</span>
          </button>
          <button
            onClick={handleClearAllSlots}
            className="px-2.5 py-1.5 bg-[#232B34] hover:bg-red-500/20 text-[#8A99AD] hover:text-red-400 border border-[#2D333B] text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            title="라인업 초기화"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            <span>초기화</span>
          </button>
        </div>
      </div>

      {/* Drag & Touch Instruction Helper Banner */}
      <div className="bg-[#141C25] border border-[#2D333B] p-2.5 rounded-xl flex items-center justify-between text-xs text-[#8A99AD]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#38BDF8] text-base">touch_app</span>
          <span>
            선수를 <strong className="text-white">드래그</strong>하거나{' '}
            <strong className="text-white">터치/클릭</strong>하여 위치 교체 또는 후보 선수를
            배치하세요.
          </span>
        </div>
        {selectedSwapSource && (
          <button
            onClick={() => setSelectedSwapSource(null)}
            className="text-[11px] font-bold text-[#FF4B4B] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 hover:bg-red-500/20"
          >
            선택 취소
          </button>
        )}
      </div>

      {/* Tactical Pitch Canvas with Drag and Drop Support */}
      <section className="relative w-full aspect-[3/4] bg-[#0B110B] rounded-2xl border-2 border-[#2D333B] overflow-hidden pitch-pattern shadow-2xl">
        {/* Pitch Field Markings */}
        <div className="absolute inset-3 border border-[#2D333B]/40 rounded-lg pointer-events-none">
          {/* Penalty Boxes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-x border-b border-[#2D333B]/40"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-16 border-x border-t border-[#2D333B]/40"></div>
          {/* Halfway Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#2D333B]/40"></div>
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-[#2D333B]/40 rounded-full"></div>
        </div>

        {/* Player Nodes Layer */}
        <div className="absolute inset-0 z-10">
          {selectedFormation.slots.map((fSlot, idx) => {
            const slot = slots.find((s) => s.slotId === fSlot.id) || {
              slotId: fSlot.id,
              positionLabel: fSlot.position,
              player: null,
              grade: 1,
            };

            const slotOvr = getSlotOvr(slot);

            const isSelectedForSwap =
              selectedSwapSource?.type === 'slot' && selectedSwapSource.id === fSlot.id;

            const isDragOver = dragOverTarget === fSlot.id;

            const isPositionMatched =
              slot.player &&
              (slot.player.position === fSlot.position ||
                slot.player.preferredPositions.includes(fSlot.position));

            const activePlayer = dragSource?.player || selectedSwapSource?.player;
            const isDraggingOrSelecting = !!activePlayer;
            const isValidDropZone = activePlayer
              ? activePlayer.position === fSlot.position ||
                activePlayer.preferredPositions.includes(fSlot.position)
              : false;
            const isExactMatch = activePlayer ? activePlayer.position === fSlot.position : false;

            return (
              <motion.div
                key={fSlot.id}
                layout
                initial={false}
                animate={{
                  left: `${fSlot.x}%`,
                  top: `${fSlot.y}%`,
                  scale: isDragOver ? 1.18 : isSelectedForSwap ? 1.12 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 24,
                  mass: 0.8,
                }}
                draggable={!!slot.player}
                onDragStart={(e: any) =>
                  slot.player && handleDragStart(e, 'slot', fSlot.id, slot.player)
                }
                onDragEnd={handleDragEnd}
                onDragOver={(e: any) => handleDragOver(e, fSlot.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e: any) => handleDrop(e, 'slot', fSlot.id)}
                onClick={() => handleNodeClick('slot', fSlot.id, slot.player)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group select-none ${
                  isSelectedForSwap ? 'z-30' : 'hover:scale-105'
                }`}
              >
                {/* Node Avatar Box */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 p-0.5 relative shadow-lg transition-all duration-200 ${
                    isDragOver
                      ? 'border-[#00FF87] ring-4 ring-[#00FF87]/80 bg-[#162E1C] shadow-[0_0_25px_rgba(0,255,135,0.8)]'
                      : isSelectedForSwap
                      ? 'border-[#38BDF8] ring-4 ring-[#38BDF8]/50 bg-[#16212E]'
                      : isDraggingOrSelecting && isValidDropZone
                      ? 'border-[#00FF87] ring-2 ring-[#00FF87]/60 bg-[#00FF87]/15 shadow-[0_0_15px_rgba(0,255,135,0.4)] animate-pulse'
                      : isDraggingOrSelecting
                      ? 'border-[#2D333B] bg-[#161A1E]/50 opacity-40'
                      : slot.player
                      ? 'border-[#B9F600] bg-[#232B34] hover:shadow-[0_0_18px_rgba(185,246,0,0.5)] hover:border-white'
                      : 'border-dashed border-[#8A99AD]/60 bg-[#161A1E]/80 hover:border-[#B9F600]'
                  }`}
                >
                  {slot.player ? (
                    <img
                      src={slot.player.image}
                      alt={slot.player.name}
                      className="w-full h-full rounded-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-[#8A99AD] group-hover:text-[#B9F600]">
                      <span className="material-symbols-outlined text-lg">add</span>
                    </div>
                  )}

                  {/* Position Suitability Indicator Badge */}
                  {slot.player && !isDraggingOrSelecting && (
                    <div
                      className={`absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md ${
                        isPositionMatched ? 'bg-[#00FF87]' : 'bg-[#FF9F00]'
                      }`}
                      title={
                        isPositionMatched
                          ? '적정 포지션 (100% 성능)'
                          : '포지션 부적합 (약간의 능력치 감소 가능)'
                      }
                    >
                      {isPositionMatched ? '✓' : '!'}
                    </div>
                  )}

                  {/* Valid Drop Zone Indicator Pill */}
                  {isDraggingOrSelecting && isValidDropZone && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#00FF87] text-[#0A1A0D] font-black text-[9px] px-1.5 py-0.2 rounded-full shadow-lg whitespace-nowrap animate-bounce z-30"
                    >
                      {isExactMatch ? '적정' : '선호'}
                    </div>
                  )}

                  {/* OVR Badge */}
                  {slot.player && (
                    <div className="absolute -top-1 -right-1 bg-[#B9F600] text-[#141F00] text-[10px] font-black px-1 rounded-sm shadow-sm font-data">
                      {slotOvr}
                    </div>
                  )}

                  {/* Grade Multiplier Badge Button */}
                  {slot.player && !isDraggingOrSelecting && (
                    <button
                      onClick={(e) => handleCycleGrade(e, slot.slotId)}
                      className="absolute -bottom-1 -left-1 bg-[#2E353F] text-white text-[9px] font-bold px-1 rounded border border-[#2D333B] hover:bg-[#B9F600] hover:text-[#141F00] transition-colors"
                      title="강화 단계 변경 (+1, +3, +5, +8)"
                    >
                      +{slot.grade}
                    </button>
                  )}
                </div>

                {/* Position Label / Player Name */}
                <div className="flex flex-col items-center mt-1">
                  <span className="font-data text-[10px] text-white font-bold bg-[#161A1E]/90 backdrop-blur-sm px-1.5 py-0.5 rounded max-w-[75px] truncate text-center border border-[#2D333B]">
                    {slot.player ? slot.player.name.split(' ').pop() : fSlot.position}
                  </span>
                  <span className="font-data text-[9px] text-[#B9F600] font-semibold">
                    {fSlot.position}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Bench / Reserves Tray */}
      <section className="space-y-2 bg-[#141C25] border border-[#2D333B] p-3.5 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38BDF8] text-base">groups</span>
            <h3 className="text-sm font-bold text-white">후보 및 교체 명단 ({bench.length}명)</h3>
          </div>
          <button
            onClick={() => setIsBenchPickerOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:underline"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>+ 후보 추가</span>
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          {bench.map((bPlayer, idx) => {
            const isBenchSelected =
              selectedSwapSource?.type === 'bench' && selectedSwapSource.id === idx.toString();

            return (
              <div
                key={`${bPlayer.id}-${idx}`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'bench', idx.toString(), bPlayer)}
                onClick={() => handleNodeClick('bench', idx.toString(), bPlayer)}
                className={`flex-none w-28 bg-[#182029] border rounded-xl p-2 flex flex-col items-center relative cursor-pointer transition-all select-none ${
                  isBenchSelected
                    ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/40 bg-[#1E2C3D]'
                    : 'border-[#2D333B] hover:border-[#38BDF8]'
                }`}
              >
                {/* Remove bench player button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBench((prev) => prev.filter((_, i) => i !== idx));
                    showToast(`${bPlayer.name} 후보 해제`);
                  }}
                  className="absolute top-1 right-1 text-[#8A99AD] hover:text-red-400 p-0.5 rounded"
                  title="후보에서 삭제"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>

                <img
                  src={bPlayer.image}
                  alt={bPlayer.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#2D333B] bg-[#232B34] pointer-events-none"
                />
                <span className="text-xs font-bold text-white mt-1.5 truncate max-w-full">
                  {bPlayer.name}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-[#C3CAAC] font-data">
                  <span className="text-[#38BDF8] font-bold">{bPlayer.position}</span>
                  <span>•</span>
                  <span className="text-[#B9F600] font-bold">{bPlayer.ovr} OVR</span>
                </div>
              </div>
            );
          })}

          {bench.length === 0 && (
            <div className="w-full text-center py-4 text-xs text-[#8A99AD] border border-dashed border-[#2D333B] rounded-xl">
              후보 선수가 없습니다. '+ 후보 추가' 버튼을 눌러 선수를 등록해보세요.
            </div>
          )}
        </div>
      </section>

      {/* Chemistry Analysis Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">팀 케미스트리 분석</h3>
          <span className="text-[#00FF87] flex items-center gap-1 font-bold font-data text-xs">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            100% 케미 적용
          </span>
        </div>

        <div className="space-y-2">
          {/* National Bond */}
          <div className="glass-panel p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#232B34] flex items-center justify-center text-[#B9F600]">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <div>
                <p className="font-semibold text-xs text-white">국가대표 케미</p>
                <p className="text-[11px] text-[#C3CAAC]">{nationalBondText}</p>
              </div>
            </div>
            <span className="font-data text-xs text-[#00FF87] font-bold">{nationalBonus}</span>
          </div>

          {/* Club Legend */}
          <div className="glass-panel p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#232B34] flex items-center justify-center text-[#B9F600]">
                <span className="material-symbols-outlined text-[20px]">stadium</span>
              </div>
              <div>
                <p className="font-semibold text-xs text-white">클럽 팀케미</p>
                <p className="text-[11px] text-[#C3CAAC]">{clubLegendText}</p>
              </div>
            </div>
            <span className="font-data text-xs text-[#00FF87] font-bold">{clubBonus}</span>
          </div>
        </div>
      </section>

      {/* Team Average Attributes Radar Chart Section */}
      <section className="bg-[#141C25] border border-[#2D333B] p-4 rounded-2xl space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#B9F600] text-lg">radar</span>
            <h3 className="text-sm font-bold text-white">팀 평균 능력치 육각형 분석</h3>
          </div>
          <span className="font-data text-xs text-[#B9F600] font-bold bg-[#B9F600]/10 px-2 py-0.5 rounded border border-[#B9F600]/30">
            주전 {filledSlots.length}/11명 평균
          </span>
        </div>

        {/* Radar Chart Container */}
        <div className="w-full h-64 sm:h-72 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teamRadarData}>
              <PolarGrid stroke="#2D333B" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#C3CAAC', fontSize: 11, fontWeight: 700 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 130]} tick={false} axisLine={false} />
              <Radar
                name="팀 평균"
                dataKey="value"
                stroke="#B9F600"
                fill="#B9F600"
                fillOpacity={0.35}
                dot={{ r: 4, fill: '#B9F600', stroke: '#141C25', strokeWidth: 2 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Numeric Stat Badges Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-[#2D333B]">
          {[
            { label: '스피드 (PAC)', val: avgPac },
            { label: '슛 (SHO)', val: avgSho },
            { label: '패스 (PAS)', val: avgPas },
            { label: '드리블 (DRI)', val: avgDri },
            { label: '수비 (DEF)', val: avgDef },
            { label: '피지컬 (PHY)', val: avgPhy },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#182029] border border-[#2D333B] p-2 rounded-xl text-center flex flex-col items-center justify-center hover:border-[#B9F600]/50 transition-colors"
            >
              <span className="text-[10px] text-[#8A99AD] font-data font-semibold">{stat.label}</span>
              <span className="text-sm font-black text-[#B9F600] font-data mt-0.5">{stat.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tactical Insights Bento */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel p-3.5 rounded-xl">
          <span className="material-symbols-outlined text-[#B9F600] text-xl mb-1 block">
            bolt
          </span>
          <p className="font-data text-[10px] text-[#C3CAAC] uppercase">핵심 강점</p>
          <p className="font-bold text-sm text-white mt-0.5">{keyStrength}</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border-l-4 border-l-[#FF4B4B]">
          <span className="material-symbols-outlined text-[#FF4B4B] text-xl mb-1 block">
            warning
          </span>
          <p className="font-data text-[10px] text-[#C3CAAC] uppercase">취약점 / 주의점</p>
          <p className="font-bold text-sm text-white mt-0.5">{weakPoint}</p>
        </div>
      </section>

      {/* Player Picker Popup Modal for Pitch Slot */}
      {pickerSlotId && (
        <PlayerPickerModal
          isOpen={!!pickerSlotId}
          onClose={() => setPickerSlotId(null)}
          positionLabel={
            slots.find((s) => s.slotId === pickerSlotId)?.positionLabel || 'ST'
          }
          players={allPlayers}
          onSelectPlayer={(p) => {
            setSlots((prev) =>
              prev.map((s) => (s.slotId === pickerSlotId ? { ...s, player: p } : s))
            );
            setPickerSlotId(null);
            showToast(`${p.name} 선수가 라인업에 추가되었습니다.`);
          }}
        />
      )}

      {/* Player Picker Popup Modal for Bench */}
      {isBenchPickerOpen && (
        <PlayerPickerModal
          isOpen={isBenchPickerOpen}
          onClose={() => setIsBenchPickerOpen(false)}
          positionLabel="BENCH"
          players={allPlayers}
          onSelectPlayer={handleAddBenchPlayer}
        />
      )}
    </div>
  );
};
