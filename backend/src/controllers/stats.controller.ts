import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { Request } from 'express';
import { PlayerRankingsSortBy, PlayerRankingsSortOrder } from '@shared/stats.types';

/**
 * Controller handling statistics and rankings-related endpoints.
 * 
 * Provides access to player rankings, individual player statistics, 
 * and match history data.
 */
@Controller('stats')
export class StatsController {
  
  constructor(
    private readonly statsService: StatsService
  ) { }

  /**
   * Retrieve a paginated list of players sorted by selected statistics.
   * 
   * Publicly accessible endpoint that returns the leaderboard of all players.
   * 
   * @param page - Page number to retrieve (1-based)
   * @param limit - Number of players per page
   * @param sortBy - Field to sort by (winRate, totalMatches, efficiency, etc.)
   * @param sortOrder - Sort direction (ASC or DESC)
   * @returns Paginated list of players with their statistics
   * @throws BadRequestException if invalid sort parameters are provided
   */
  @Get('rankings')
  async getPlayerRankings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: PlayerRankingsSortBy = PlayerRankingsSortBy.winRate,
    @Query('sortOrder') sortOrder: PlayerRankingsSortOrder = PlayerRankingsSortOrder.DESC
  ) {
    
    const isValidSortBy = Object.values(PlayerRankingsSortBy).includes(sortBy);
    const isValidSortOrder = Object.values(PlayerRankingsSortOrder).includes(sortOrder);

    if (!isValidSortBy || !isValidSortOrder) {
      throw new BadRequestException(
        `Invalid sorting parameters.`
      );
    }

    return this.statsService.getPlayerRankings(
      page,
      limit,
      sortBy,
      sortOrder
    );
  }

  /**
   * Get the authenticated user's statistics.
   * 
   * Returns detailed statistics for the current user including wins,
   * losses, efficiency, and other performance metrics.
   * 
   * @returns The user's statistics
   */
  @Get('player')
  @UseGuards(AccessTokenGuard)
  async getPlayerStatistics(@Req() request: Request) {
    return this.statsService.getPlayerStatistics(
      request.user.userId
    );
  }

  /**
   * Get the authenticated user's match history.
   * 
   * Returns a paginated list of matches the user has played,
   * including details about opponents and performance.
   * 
   * @param page - Page number to retrieve (1-based)
   * @param limit - Number of matches per page
   * @returns Paginated list of the user's matches
   */
  @Get('player/history')
  @UseGuards(AccessTokenGuard)
  async getPlayerMatchHistory(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.statsService.getPlayerMatchHistory(
      request.user.userId, 
      page, 
      limit
    );
  }
}
