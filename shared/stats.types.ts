/**
 * Represents a player's cumulative statistics across all matches.
 */
export type UserStats = {
  /** Total number of matches played */
  totalMatches: number;
  /** Number of matches won */
  wins: number;
  /** Number of matches lost */
  losses: number;
  /** Win rate as a decimal (0-1) */
  winRate: number;
  /** Total number of balls pocketed across all matches */
  totalBallsPocketed: number;
  /** Total number of shots taken across all matches */
  totalShotsTaken: number;
  /** Total number of fouls committed */
  totalFouls?: number;
  /** Ratio of balls pocketed to shots taken */
  efficiency: number;
  /** Average duration of a match in seconds */
  averageMatchDuration: number;
  /** Total time played in seconds */
  totalPlayTime?: number;
  /** Player's accumulated points (for progression and rewards) */
  points?: number;
};

/**
 * Represents a single match in a player's history.
 */
export type MatchHistory = {
  /** Unique identifier for the match */
  matchId: string;
  /** When the match was played */
  playedAt: Date;
  /** How long the match lasted in seconds */
  durationSeconds: number;
  /** The reason the game ended (e.g., "EIGHT_BALL_POTTED") */
  gameOverReason: string;
  /** Whether the current player won the match */
  isWinner: boolean;
  /** Information about the opponent */
  opponent: {
    /** Unique identifier for the opponent */
    userId: string;
    /** Display name of the opponent */
    username: string;
    /** URL to the opponent's avatar */
    avatar: string;
  };
  /** Statistics for the current player in this match */
  playerStats: {
    /** The ball group assigned to the player (solids/stripes) */
    ballGroup: string;
    /** Number of balls pocketed by the player */
    ballsPocketed: number;
    /** Number of shots taken by the player */
    shotsTaken: number;
    /** Number of fouls committed by the player */
    fouls: number;
  };
};

/**
 * Represents a paginated result of match history.
 */
export type MatchHistoryResult = {
  /** Array of match records */
  matches: Array<MatchHistory>;
  /** Total number of matches available */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Total number of pages available */
  totalPages: number;
};

/**
 * Represents a paginated result of player rankings.
 */
export type PlayerRankingsResult = {
  /** Array of players with their stats */
  players: Array<{
    /** Unique identifier for the player */
    userId: string;
    /** Display name of the player */
    username: string;
    /** URL to the player's avatar */
    avatar: string;
  } & UserStats>;
  /** Total number of players available */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Total number of pages available */
  totalPages: number;
};

/**
 * Enum for sorting options in player rankings.
 */
export enum PlayerRankingsSortBy {
  /** Sort by win rate */
  winRate = 'winRate',
  /** Sort by total matches played */
  totalMatches = 'totalMatches',
  /** Sort by efficiency (balls pocketed / shots taken) */
  efficiency = 'efficiency',
  /** Sort by average match duration */
  averageMatchDuration = 'averageMatchDuration',
};

/**
 * Enum for sort direction in player rankings.
 */
export enum PlayerRankingsSortOrder {
  /** Ascending order (low to high) */
  ASC = 'ASC',
  /** Descending order (high to low) */
  DESC = 'DESC'
};