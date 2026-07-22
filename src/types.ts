export interface Player {
  id: string;
  name: string;
  ovr: number;
  salary: number;
  position: string; // e.g. "ST", "LW", "CAM", "GK"
  preferredPositions: string[]; // e.g. ["LW", "ST"]
  season: string; // e.g. "24TY", "ICON", "23HW", "LN", "UTOTY", "22WorldCup"
  seasonFullName: string;
  class: string; // e.g. "Legendary Class", "Hero Class"
  club: string; // e.g. "Real Madrid", "Tottenham Hotspur", "Manchester City"
  nationality: string; // e.g. "France", "South Korea", "Belgium"
  bpPrice: number; // in BP e.g. 1240000000
  priceTrendPercent: number; // e.g. 2.4 or -0.8
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  weakFoot: number; // e.g. 5
  skillMoves: number; // e.g. 5
  image: string; // Hotlinked image URL or high quality player portrait
  priceHistory: { date: string; price: number }[];
  enhancements: { grade: number; ovr: number; bpPrice: number }[];
}

export interface Formation {
  id: string;
  name: string;
  slots: {
    id: string;
    position: string;
    x: number; // percentage 0-100 for pitch positioning
    y: number; // percentage 0-100 for pitch positioning
  }[];
}

export interface SquadSlot {
  slotId: string;
  positionLabel: string;
  player: Player | null;
  grade: number; // +1, +3, +5, etc.
}

export type TabType = 'home' | 'search' | 'squad' | 'ranker' | 'nexon' | 'detail';

export interface FilterOptions {
  searchKeyword: string;
  position: string;
  season: string;
  maxSalary: number;
  minOvr: number;
  sortOption: 'popularity' | 'price_desc' | 'price_asc' | 'ovr_desc';
}
