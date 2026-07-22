import React, { useState, useEffect } from 'react';
import { Player, Formation, SquadSlot } from '../types';
import { FORMATIONS, formatBP } from '../data/mockData';
import { PlayerPickerModal } from './PlayerPickerModal';

interface SquadAnalysisViewProps {
  allPlayers: Player[];
  onSelectPlayerDetail: (player: Player) => void;
}

export const SquadAnalysisView: React.FC<SquadAnalysisViewProps> = ({
  allPlayers,
  onSelectPlayerDetail,
}) => {
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS[0]);
  const [slots, setSlots] = useState<SquadSlot[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize squad slots based on default formation and default players
  useEffect(() => {
    // Try loading saved squad from localStorage
    const saved = localStorage.getItem('fc_lens_saved_squad');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.slots && parsed.slots.length === selectedFormation.slots.length) {
          setSlots(parsed.slots);
          return;
        }
      } catch (e) {
        console.error('Error loading saved squad:', e);
      }
    }

    // Default squad setup if no saved data
    const defaultSlots: SquadSlot[] = selectedFormation.slots.map((fSlot, idx) => {
      // Pick suitable player from default pool
      const matchingPlayer =
        allPlayers.find((p) => p.position === fSlot.position) || allPlayers[idx % allPlayers.length];
      return {
        slotId: fSlot.id,
        positionLabel: fSlot.position,
        player: matchingPlayer || null,
        grade: idx === 0 ? 5 : idx % 2 === 0 ? 3 : 1, // sample grades
      };
    });

    setSlots(defaultSlots);
    setBench(allPlayers.slice(11, 15));
  }, [selectedFormation]);

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
          player: existingSlot ? existingSlot.player : allPlayers[idx % allPlayers.length] || null,
          grade: existingSlot ? existingSlot.grade : 1,
        };
      });
    });
  };

  // Helper calculation for OVR with grade
  const getSlotOvr = (slot: SquadSlot) => {
    if (!slot.player) return 0;
    const gradeBonus =
      slot.grade === 1 ? 0 : slot.grade === 3 ? 2 : slot.grade === 5 ? 5 : 10;
    return slot.player.ovr + gradeBonus;
  };

  // Statistics
  const filledSlots = slots.filter((s) => s.player !== null);
  const avgOvr =
    filledSlots.length > 0
      ? (
          filledSlots.reduce((acc, s) => acc + getSlotOvr(s), 0) / filledSlots.length
        ).toFixed(1)
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

  const nationalBondText = maxNation && maxNation[1] >= 2 ? `${maxNation[1]}x ${maxNation[0]} Players` : 'Mixed Nationalities';
  const nationalBonus = maxNation && maxNation[1] >= 4 ? '+8 ACC' : maxNation && maxNation[1] >= 2 ? '+4 ACC' : 'No Sync';

  const clubLegendText = maxClub && maxClub[1] >= 2 ? `${maxClub[0]} Core (${maxClub[1]})` : 'Mixed Clubs';
  const clubBonus = maxClub && maxClub[1] >= 4 ? '+5 DRI' : maxClub && maxClub[1] >= 2 ? '+2 DRI' : 'No Sync';

  // Key strength & weak point
  const isPacy = filledSlots.every((s) => (s.player?.pac || 0) >= 110);
  const keyStrength = isPacy ? 'Explosive Counters' : 'High Precision Passing';
  const weakPoint = totalSalary > 230 ? 'Salary Cap Exceeded' : 'Aerial Defending';

  // Save squad
  const handleSaveSquad = () => {
    const dataToSave = {
      formationId: selectedFormation.id,
      slots,
    };
    localStorage.setItem('fc_lens_saved_squad', JSON.stringify(dataToSave));
    showToast('Squad saved successfully!');
  };

  // Share squad link
  const handleShareSquad = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Squad share link copied to clipboard!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Assign player from picker modal
  const handlePickerSelectPlayer = (player: Player) => {
    if (!pickerSlotId) return;
    setSlots((prev) =>
      prev.map((s) => (s.slotId === pickerSlotId ? { ...s, player } : s))
    );
    setPickerSlotId(null);
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

  return (
    <div className="pb-24 pt-2 px-4 space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#B9F600] text-[#141F00] font-data font-bold text-xs px-4 py-2 rounded-full shadow-2xl z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header & Primary Action Buttons */}
      <div className="flex justify-between items-end">
        <div>
          <p className="font-data text-[10px] text-[#B9F600] uppercase tracking-widest">
            LIVE ANALYSIS
          </p>
          <h1 className="text-xl font-bold text-white">Squad Analysis</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveSquad}
            className="bg-[#B9F600] text-[#141F00] px-3.5 py-2 rounded-lg font-data font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(185,246,0,0.25)] hover:brightness-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            SAVE
          </button>
          <button
            onClick={handleShareSquad}
            className="bg-[#232B34] border border-[#2D333B] text-white p-2 rounded-lg hover:bg-[#2e353f] transition-all"
            aria-label="Share Squad"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
          </button>
        </div>
      </div>

      {/* Squad Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">AVG OVR</span>
          <span className="text-2xl font-black text-[#B9F600] font-headline">{avgOvr}</span>
        </div>

        <div className="bg-[#161A1E] border border-[#2D333B] p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">SALARY</span>
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
          <span className="font-data text-[10px] text-[#C3CAAC] uppercase mb-1">VALUE</span>
          <span className="text-2xl font-black text-white font-headline">
            {formatBP(totalValueBP)}
          </span>
        </div>
      </div>

      {/* Salary Cap Warning Badge */}
      {totalSalary > 230 && (
        <div className="bg-[#93000A]/40 border border-[#FF4B4B]/60 text-[#FFDAD6] p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[#FF4B4B] text-[18px]">
            warning
          </span>
          <span>Salary cap exceeded ({totalSalary}/230)! Please adjust player salary.</span>
        </div>
      )}

      {/* Formation Selector Bar */}
      <div className="flex justify-between items-center bg-[#161A1E] border border-[#2D333B] px-3.5 py-2.5 rounded-xl">
        <span className="text-xs font-data text-[#C3CAAC]">Formation:</span>
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

      {/* Tactical Pitch Canvas */}
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

            return (
              <div
                key={fSlot.id}
                onClick={() => setPickerSlotId(fSlot.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group transition-transform active:scale-95"
                style={{ left: `${fSlot.x}%`, top: `${fSlot.y}%` }}
              >
                {/* Player Node Avatar */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#B9F600] bg-[#232B34] p-0.5 relative shadow-lg group-hover:shadow-[0_0_15px_rgba(185,246,0,0.4)] transition-all">
                  {slot.player ? (
                    <img
                      src={slot.player.image}
                      alt={slot.player.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-[#B9F600]">
                      <span className="material-symbols-outlined text-lg">add</span>
                    </div>
                  )}

                  {/* OVR Badge */}
                  {slot.player && (
                    <div className="absolute -top-1 -right-1 bg-[#B9F600] text-[#141F00] text-[10px] font-black px-1 rounded-sm shadow-sm font-data">
                      {slotOvr}
                    </div>
                  )}

                  {/* Grade Multiplier Badge Button */}
                  {slot.player && (
                    <button
                      onClick={(e) => handleCycleGrade(e, slot.slotId)}
                      className="absolute -bottom-1 -left-1 bg-[#2E353F] text-white text-[9px] font-bold px-1 rounded border border-[#2D333B] hover:bg-[#B9F600] hover:text-[#141F00] transition-colors"
                      title="Click to cycle enhancement grade (+1, +3, +5, +8)"
                    >
                      +{slot.grade}
                    </button>
                  )}
                </div>

                {/* Position Label / Player Name */}
                <span className="font-data text-[10px] text-white font-bold bg-[#161A1E]/80 backdrop-blur-sm px-1.5 py-0.5 rounded mt-1 max-w-[70px] truncate text-center border border-[#2D333B]">
                  {slot.player ? slot.player.name.split(' ').pop() : fSlot.position}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chemistry Analysis Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Chemistry Analysis</h3>
          <span className="text-[#00FF87] flex items-center gap-1 font-bold font-data text-xs">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            100% Sync
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
                <p className="font-semibold text-xs text-white">National Bond</p>
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
                <p className="font-semibold text-xs text-white">Club Legend</p>
                <p className="text-[11px] text-[#C3CAAC]">{clubLegendText}</p>
              </div>
            </div>
            <span className="font-data text-xs text-[#00FF87] font-bold">{clubBonus}</span>
          </div>
        </div>
      </section>

      {/* Tactical Insights Bento */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel p-3.5 rounded-xl">
          <span className="material-symbols-outlined text-[#B9F600] text-xl mb-1 block">
            bolt
          </span>
          <p className="font-data text-[10px] text-[#C3CAAC] uppercase">Key Strength</p>
          <p className="font-bold text-sm text-white mt-0.5">{keyStrength}</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border-l-4 border-l-[#FF4B4B]">
          <span className="material-symbols-outlined text-[#FF4B4B] text-xl mb-1 block">
            warning
          </span>
          <p className="font-data text-[10px] text-[#C3CAAC] uppercase">Weak Point</p>
          <p className="font-bold text-sm text-white mt-0.5">{weakPoint}</p>
        </div>
      </section>

      {/* Player Picker Popup Modal */}
      {pickerSlotId && (
        <PlayerPickerModal
          isOpen={!!pickerSlotId}
          onClose={() => setPickerSlotId(null)}
          positionLabel={
            slots.find((s) => s.slotId === pickerSlotId)?.positionLabel || 'ST'
          }
          players={allPlayers}
          onSelectPlayer={handlePickerSelectPlayer}
        />
      )}
    </div>
  );
};
