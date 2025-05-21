/**
 * Represents a cue in the pool game.
 * Cues can be unlocked with points earned from playing matches.
 */
export type Cue = {
  /** Unique identifier for the cue */
  id: string;
  
  /** Display name of the cue */
  name: string;
  
  /** URL or path to the cue's image */
  image: string;
  
  /** Cost in points to unlock the cue (0 means it's free/default) */
  price: number;
  
  /** Optional description of the cue's features or appearance */
  description?: string;
  
  /** Whether the cue is unlocked for the current user */
  isUnlocked?: boolean;
  
  /** Whether the cue is currently equipped by the user */
  isEquipped?: boolean;
};

/**
 * Response type for the cue shop endpoint.
 * Contains all available cues and the player's points information.
 */
export type CueShopResponse = {
  /** Array of all cues available in the shop */
  cues: Cue[];
  
  /** Current points balance of the player */
  playerPoints: number;
  
  /** Points awarded for winning a match */
  pointsPerWin: number;
  
  /** Points awarded for losing a match */
  pointsPerLoss: number;
};
