import { Injectable } from '@nestjs/common';
import { GameOverReason } from '@shared/socket.types';
import { StatsService } from 'src/services/stats.service';
import { IGamePlayer } from '../interfaces/game-player.interface';

@Injectable()
export class GameResultHandlerService {
  
  private statsService: StatsService | null = null;

  /**
   * Sets the StatsService instance
   * This approach avoids circular dependencies
   */
  public setStatsService(statsService: StatsService): void {
    this.statsService = statsService;
  }

  /**
   * Save a completed match to the database
   */
  async saveMatchResult(
    players: [IGamePlayer, IGamePlayer],
    winner: IGamePlayer,
    duration: number,
    reason: GameOverReason
  ): Promise<any> {
    // Collect player-specific stats
    const playerStats = {};
    
    // Add basic stats for each player
    for (const player of players) {
      
      const ballGroup = player.ballGroup;
      
      playerStats[player.userId] = {
        ballsPocketed: player.ballsPocketed,
        shotsTaken: player.shotsTaken,
        fouls: player.fouls,
        ballGroup
      };
    }
    
    // Save to database if statsService is available
    if (this.statsService) {
      try {
        await this.statsService.saveMatch(
          players,
          winner,
          duration,
          reason,
          playerStats
        );
      } catch (error) {
        console.error(
          'Failed to save match statistics:', 
          error
        );
      }
    }
    
    // Return match data for external processing
    return {
      players,
      winner,
      duration,
      reason,
      playerStats
    };
  }
}
