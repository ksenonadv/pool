import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { Request } from 'express';
import { PlayerRankingsSortBy, PlayerRankingsSortOrder } from '@shared/stats.types';

@Controller('stats')
export class StatsController {
  
  constructor(
    private readonly statsService: StatsService
  ) { }

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

  @Get('player')
  @UseGuards(AccessTokenGuard)
  async getPlayerStatistics(@Req() request: Request) {
    return this.statsService.getPlayerStatistics(
      request.user.userId
    );
  }

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
