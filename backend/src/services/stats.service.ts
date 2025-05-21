import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchPlayer } from '../entities/match-player.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { User } from '../entities/user.entity';
import { IGamePlayer } from 'src/game/interfaces/game-player.interface';
import { GameOverReason } from '@shared/socket.types';
import { MatchHistoryResult, PlayerRankingsResult, PlayerRankingsSortBy, PlayerRankingsSortOrder, UserStats } from '@shared/stats.types';
import { POINTS_PER_LOSS, POINTS_PER_WIN } from 'src/config/cues.config';

/**
 * Service responsible for managing player statistics and match history.
 * 
 * Provides methods for:
 * - Storing completed matches
 * - Calculating player statistics
 * - Retrieving player rankings and match history
 */
@Injectable()
export class StatsService {  
  
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(MatchPlayer)
    private matchPlayerRepository: Repository<MatchPlayer>,
    @InjectRepository(PlayerStats)
    private playerStatsRepository: Repository<PlayerStats>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) { }

  /**
   * Save a completed match and update player statistics.
   * 
   * Creates a match record and associated player statistics, then updates
   * the players' overall statistics.
   * 
   * @param players - Array of players who participated in the match
   * @param winner - The player who won the match
   * @param durationSeconds - The total duration of the match in seconds
   * @param gameOverReason - The reason the game ended (e.g., EIGHT_BALL_POTTED)
   * @param playerStats - Record of statistics for each player in the match
   * @returns Promise that resolves when the match is saved
   */
  async saveMatch(
    players: IGamePlayer[], 
    winner: IGamePlayer, 
    durationSeconds: number,
    gameOverReason: GameOverReason,
    playerStats: Record<string, { 
      ballsPocketed: number, 
      shotsTaken: number, 
      fouls: number, 
      ballGroup: any 
    }>
  ): Promise<Match> {
    
    const match = this.matchRepository.create({
      durationSeconds,
      winnerId: winner?.userId,
      gameOverReason: gameOverReason.toString()
    });

    await this.matchRepository.save(
      match
    );

    // Create match player records
    for (const player of players) {
      
      const stats = playerStats[player.userId] || { 
        ballsPocketed: 0, 
        shotsTaken: 0, 
        fouls: 0, 
        ballGroup: null 
      };

      const isWinner = player.userId === winner?.userId;

      const matchPlayer = this.matchPlayerRepository.create({
        matchId: match.id,
        userId: player.userId,
        ballGroup: stats.ballGroup,
        ballsPocketed: stats.ballsPocketed,
        shotsTaken: stats.shotsTaken,
        fouls: stats.fouls,
        isWinner
      });

      await this.matchPlayerRepository.save(matchPlayer);

      await this.updatePlayerStats(
        player.userId, 
        stats, 
        isWinner, 
        durationSeconds
      );
    }

    return match;
  }

  /**
   * Update a player's statistics based on match results.
   * 
   * Updates cumulative statistics for a player including:
   * - Total matches played
   * - Wins/losses and win rate
   * - Balls pocketed and shots taken
   * - Fouls committed
   * - Play time and average match duration
   * - Player points (used for progressions and rewards)
   * 
   * @param userId - The user ID of the player to update
   * @param matchStats - Statistics from the current match
   * @param isWinner - Whether this player won the match
   * @param durationSeconds - Duration of the match in seconds
   */
  private async updatePlayerStats(
    userId: string, 
    matchStats: { 
      ballsPocketed: number, 
      shotsTaken: number, 
      fouls: number 
    },
    isWinner: boolean,
    durationSeconds: number
  ): Promise<void> {
    
    // Get existing stats or create new ones
    let playerStats = await this.playerStatsRepository.findOne({ where: { 
        userId 
      } 
    });
    
    if (!playerStats) {
      playerStats = this.playerStatsRepository.create({
        userId,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalBallsPocketed: 0,
        totalShotsTaken: 0,
        totalFouls: 0,
        averageMatchDuration: 0,
        totalPlayTime: 0,
        points: 0
      });
    }

    // Update stats
    playerStats.totalMatches += 1;
    playerStats.totalBallsPocketed += matchStats.ballsPocketed;
    playerStats.totalShotsTaken += matchStats.shotsTaken;
    playerStats.totalFouls += matchStats.fouls;
    playerStats.totalPlayTime += durationSeconds;

    if (isWinner) {
      playerStats.wins ++;
      playerStats.points += POINTS_PER_WIN;
    } else {
      playerStats.losses ++;
      playerStats.points += POINTS_PER_LOSS;
    }

    playerStats.winRate = playerStats.wins / playerStats.totalMatches;    
    playerStats.averageMatchDuration = playerStats.totalPlayTime / playerStats.totalMatches;

    await this.playerStatsRepository.save(playerStats);
  }

  /**
   * Get player rankings with pagination and sorting.
   * 
   * Retrieves a leaderboard of players sorted by the specified criteria.
   * 
   * @param page - The page number to retrieve (1-based)
   * @param limit - The number of players to retrieve per page
   * @param sortBy - The field to sort by (winRate, totalMatches, efficiency, etc.)
   * @param sortOrder - The sort direction (ASC or DESC)
   * @returns Paginated player rankings with statistics
   */
  async getPlayerRankings(
    page: number = 1, 
    limit: number = 10,
    sortBy: PlayerRankingsSortBy = PlayerRankingsSortBy.winRate,
    sortOrder: PlayerRankingsSortOrder = PlayerRankingsSortOrder.DESC
  ): Promise<PlayerRankingsResult> {

    const order = this.createSortOrder(
      sortBy, 
      sortOrder
    );
        
    const [players, total] = await this.playerStatsRepository.findAndCount({
      relations: ['user'],
      order,
      take: limit,
      skip: (page - 1) * limit
    });    
    
    return {
      players: players.map(stats => ({
        userId: stats.userId,
        username: stats.user.username,
        avatar: stats.user.avatar,
        totalMatches: stats.totalMatches,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.winRate,
        totalBallsPocketed: stats.totalBallsPocketed,
        totalShotsTaken: stats.totalShotsTaken,
        efficiency: stats.totalBallsPocketed / (stats.totalShotsTaken || 1),
        averageMatchDuration: stats.averageMatchDuration,
        points: stats.points
      })),
      total,
      page,
      totalPages: Math.ceil(
        total / limit
      )
    };
  }

  /**
   * Create sort order configuration for player rankings query.
   * 
   * Maps the sortBy parameter to the appropriate sort criteria for TypeORM.
   * Handles special cases like efficiency which requires multiple fields.
   * 
   * @param sortBy - The field to sort by
   * @param sortOrder - The sort direction (ASC or DESC)
   * @returns TypeORM-compatible sort order object
   */
  private createSortOrder(
    sortBy: PlayerRankingsSortBy, 
    sortOrder: PlayerRankingsSortOrder
  ) {
  
    switch (sortBy) {
      case 'winRate':
      case 'totalMatches':
      case 'averageMatchDuration': {
        return {
          [sortBy]: sortOrder
        };
      }
      case 'efficiency': {
        return {
          totalBallsPocketed: sortOrder,
          totalShotsTaken: sortOrder
        };
      }
    }
  }
  
  /**
   * Get match history for a specific player
   * 
   * @param userId - The user ID of the player to retrieve match history for
   * @param page - The page number to retrieve (1-based)
   * @param limit - The number of matches to retrieve per page
   * @returns MatchHistoryResult object containing the player's match history
   */
  async getPlayerMatchHistory(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<MatchHistoryResult> {
    
    const [matchPlayers, total] = await this.matchPlayerRepository.findAndCount({
      where: { userId },
      relations: ['match', 'match.matchPlayers', 'match.matchPlayers.user', 'match.winner'],
      order: { match: { playedAt: 'DESC' } },
      take: limit,
      skip: (page - 1) * limit
    });

    return {
      matches: matchPlayers.map(mp => {
        
        const match = mp.match;
        const opponent = match.matchPlayers.find(p => p.userId !== userId);

        return {
          matchId: match.id,
          playedAt: match.playedAt,
          durationSeconds: match.durationSeconds,
          gameOverReason: match.gameOverReason,
          isWinner: mp.isWinner,
          opponent: {
            userId: opponent?.userId,
            username: opponent?.user?.username,
            avatar: opponent?.user?.avatar
          },
          playerStats: {
            ballGroup: mp.ballGroup,
            ballsPocketed: mp.ballsPocketed,
            shotsTaken: mp.shotsTaken,
            fouls: mp.fouls
          }
        };
      }),
      total,
      page,
      totalPages: Math.ceil(
        total / limit
      )
    };
  }

  /**
   * Get detailed statistics for a single player
   * 
   * @param userId - The user ID of the player to retrieve statistics for
   * @returns UserStats object containing the player's statistics
   */
  async getPlayerStatistics(userId: string): Promise<UserStats> {
    
    const playerStats = await this.playerStatsRepository.findOne({ 
      where: { 
        userId 
      }
    });   
    
    if (!playerStats) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalBallsPocketed: 0,
        totalShotsTaken: 0,
        totalFouls: 0,
        averageMatchDuration: 0,
        efficiency: 0,
        totalPlayTime: 0,
        points: 0
      };
    }

    return {
      totalMatches: playerStats.totalMatches,
      wins: playerStats.wins,
      losses: playerStats.losses,
      winRate: playerStats.winRate,
      totalBallsPocketed: playerStats.totalBallsPocketed,
      totalShotsTaken: playerStats.totalShotsTaken,
      totalFouls: playerStats.totalFouls,
      efficiency: playerStats.totalBallsPocketed / (playerStats.totalShotsTaken || 1),
      averageMatchDuration: playerStats.averageMatchDuration,
      totalPlayTime: playerStats.totalPlayTime,
      points: playerStats.points
    };
  }
}
