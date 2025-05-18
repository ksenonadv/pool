export type UserStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalBallsPocketed: number;
  totalShotsTaken: number;
  totalFouls?: number;
  efficiency: number;
  averageMatchDuration: number;
  totalPlayTime?: number;
};

export type MatchHistory = {
  matchId: string;
  playedAt: Date;
  durationSeconds: number;
  gameOverReason: string;
  isWinner: boolean;
  opponent: {
    userId: string;
    username: string;
    avatar: string;
  };
  playerStats: {
    ballGroup: string;
    ballsPocketed: number;
    shotsTaken: number;
    fouls: number;
  };
};

export type MatchHistoryResult = {
  matches: Array<MatchHistory>;
  total: number;
  page: number;
  totalPages: number;
};

export type PlayerRankingsResult = {
  players: Array<{
    userId: string;
    username: string;
    avatar: string;
  } & UserStats>;
  total: number;
  page: number;
  totalPages: number;
};