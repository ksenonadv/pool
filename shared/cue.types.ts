export type Cue = {
  id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  isUnlocked?: boolean;
  isEquipped?: boolean;
};

export type CueShopResponse = {
  cues: Cue[];
  playerPoints: number;
  pointsPerWin: number;
  pointsPerLoss: number;
};
