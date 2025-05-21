import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { CueService } from '../services/cue.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { Request } from 'express';

/**
 * Controller responsible for managing cue-related operations in the pool game.
 * Provides endpoints for retrieving available cues and equipping cues for players.
 */
@Controller('cues')
export class CueController {
  
  /**
   * Creates an instance of the CueController.
   */
  constructor(
    private readonly cueService: CueService
  ) { }

  /**
   * Retrieves the cue shop information for the authenticated user.
   * Returns a list of all available cues with information about which ones
   * are unlocked for the user and which one is currently equipped.
   * 
   * @returns A CueShopResponse containing cues, player points, and point rewards
   */
  @Get('shop')
  @UseGuards(AccessTokenGuard)
  async getCueShop(@Req() request: Request) {
    return this.cueService.getCueShop(request.user.userId);
  }

  /**
   * Equips a specific cue for the authenticated user.
   * The user must have enough points to unlock the cue before equipping it.
   * 
   * @throws BadRequestException if the user doesn't have enough points or if the cue is already equipped
   * @throws NotFoundException if the cue or player stats are not found
   */
  @Patch('equip/:cueId')
  @UseGuards(AccessTokenGuard)
  async purchaseCue(
    @Req() request: Request,
    @Param('cueId') cueId: string
  ) {

    await this.cueService.equipCue(
      request.user.userId, 
      cueId
    );

    return;
  }
}
