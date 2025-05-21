import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { CueService } from '../services/cue.service';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { Request } from 'express';

@Controller('cues')
export class CueController {
  
  constructor(
    private readonly cueService: CueService
  ) { }

  @Get('shop')
  @UseGuards(AccessTokenGuard)
  async getCueShop(@Req() request: Request) {
    return this.cueService.getCueShop(request.user.userId);
  }

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
