import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { Request } from 'express';

@Controller('stats')
export class StatsController {
  
  constructor(
    private readonly statsService: StatsService
  ) { }

  @Get('rankings')
  async getPlayerRankings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.statsService.getPlayerRankings(
      page, 
      limit
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
