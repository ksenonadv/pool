import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/guards/refreshToken.guard';
import { AuthDto, SignUpDto } from 'src/dto/auth.dto';
import { AuthService } from 'src/services/auth.service';
import { User } from 'src/entities/user.entity';

@Controller('auth')
export class AuthController {
  
  constructor(
    private readonly authService: AuthService
  ) { /* */ }

  @Post('signup')
  signup(@Body() createUserDto: SignUpDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signin')
  signin(@Body() data: AuthDto) {
    return this.authService.signIn(data);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  logout(@Req() req: Request) {
    this.authService.logout(req.user.userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  refreshTokens(@Req() req: Request) {
    
    const userId = req.user.userId;
    const refreshToken = req.user.refreshToken;
    
    return this.authService.refreshTokens(
      userId, 
      refreshToken
    );
  }

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordLogin() {
    // This route initiates the Discord OAuth2 flow
    // The guard will redirect to Discord
  }

  @Get('discord/redirect')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    
    const user = req.user as Partial<User>;
    const tokens = await this.authService.getTokens(user.id, user.username);
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);
    
    res.redirect(
      `${process.env.FRONTEND_URL}/discord-callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`
    );
  }
}
