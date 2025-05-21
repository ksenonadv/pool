import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/guards/refreshToken.guard';
import { AuthDto, SignUpDto } from 'src/dto/auth.dto';
import { AuthService } from 'src/services/auth.service';
import { User } from 'src/entities/user.entity';

/**
 * Controller responsible for authentication operations in the pool game.
 * Handles user registration, login, logout, token refresh, and OAuth flows.
 */
@Controller('auth')
export class AuthController {
  
  /**
   * Creates an instance of the AuthController.
   */
  constructor(
    private readonly authService: AuthService
  ) { /* */ }

  /**
   * Registers a new user in the system.
   * 
   * @param createUserDto - Data transfer object containing the username and password
   * @returns Access and refresh tokens for the newly created user
   * @throws BadRequestException if a user with the same username already exists
   */
  @Post('signup')
  signup(@Body() createUserDto: SignUpDto) {
    return this.authService.signUp(createUserDto);
  }

  /**
   * Authenticates a user with username and password.
   * 
   * @param data - Data transfer object containing login credentials
   * @returns Access and refresh tokens for the authenticated user
   * @throws BadRequestException if the user doesn't exist, is registered with Discord,
   *         or if the password is incorrect
   */
  @Post('signin')
  signin(@Body() data: AuthDto) {
    return this.authService.signIn(data);
  }

  /**
   * Logs out the currently authenticated user by invalidating their refresh token.
   * 
   */
  @UseGuards(AccessTokenGuard)
  @Get('logout')
  logout(@Req() req: Request) {
    this.authService.logout(req.user.userId);
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * 
   * @returns New access and refresh tokens
   * @throws ForbiddenException if the refresh token is invalid or doesn't exist
   */
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

  /**
   * Initiates the Discord OAuth2 flow for user authentication.
   * The AuthGuard redirects the user to Discord's authorization page.
   */
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordLogin() {
    // This route initiates the Discord OAuth2 flow
    // The guard will redirect to Discord
  }

  /**
   * Handles the callback from Discord OAuth2 authentication.
   * Creates a new user if one doesn't exist with the Discord ID,
   * or logs in an existing user linked with the Discord account.
   */
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
