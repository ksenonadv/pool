import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchPlayer } from '../entities/match-player.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { User } from '../entities/user.entity';
import { IGamePlayer } from 'src/game/interfaces/game-player.interface';
import { GameOverReason } from '@shared/socket.types';
import { MatchHistoryResult, PlayerRankingsResult, UserStats } from '@shared/stats.types';

@Injectable()
export class StatsService {  constructor(
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
   * Save a completed match and update player statistics
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
   * Update a player's statistics
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
        totalPlayTime: 0
      });
    }

    // Update stats
    playerStats.totalMatches += 1;
    playerStats.totalBallsPocketed += matchStats.ballsPocketed;
    playerStats.totalShotsTaken += matchStats.shotsTaken;
    playerStats.totalFouls += matchStats.fouls;
    playerStats.totalPlayTime += durationSeconds;

    if (isWinner)
      playerStats.wins ++;
    else
      playerStats.losses --;

    playerStats.winRate = playerStats.wins / playerStats.totalMatches;    
    playerStats.averageMatchDuration = playerStats.totalPlayTime / playerStats.totalMatches;

    await this.playerStatsRepository.save(playerStats);
  }

  /**
   * Get player rankings
   */
  async getPlayerRankings(page: number = 1, limit: number = 10): Promise<PlayerRankingsResult> {
    
    const [players, total] = await this.playerStatsRepository.findAndCount({
      relations: ['user'],
      order: { winRate: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    const formattedPlayers = players.map(stats => ({
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
      averageMatchDuration: stats.averageMatchDuration
    }));

    return {
      players: formattedPlayers,
      total,
      page,
      totalPages: Math.ceil(
        total / limit
      )
    };
  }
  
  /**
   * Get match history for a specific player
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
        totalPlayTime: 0
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
      totalPlayTime: playerStats.totalPlayTime
    };
  }
}
