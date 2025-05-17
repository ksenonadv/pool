import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto, SignUpDto } from 'src/dto/auth.dto';
import { Profile } from 'passport-discord';

@Injectable()
export class AuthService {
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async signUp(createUserDto: SignUpDto): Promise<any> {

    const userExists = await this.usersService.findByUsername(
      createUserDto.username
    );

    if (userExists) {
      throw new BadRequestException(
        'User already exists'
      );
    }

    const hash = await this.hashData(
      createUserDto.password
    );
    
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hash,
    });

    const tokens = await this.getTokens(newUser.id, newUser.username);
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    return tokens;
  }

  async signIn(data: AuthDto) {

    const user = await this.usersService.findByUsername(data.username);

    if (!user) { 
      throw new BadRequestException(
        'User does not exist'
      );
    }

    const passwordMatches = await argon2.verify(user.password, data.password);
    
    if (!passwordMatches) {
      throw new BadRequestException(
        'Password is incorrect'
      );
    }

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    this.usersService.update(
      userId, { 
        refreshToken: null 
      }
    );
  }

  async refreshTokens(userId: string, refreshToken: string) {
    
    const user = await this.usersService.findById(
      userId
    );
    
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException(
        'Access Denied'
      );
    }

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);

    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getTokens(userId: string, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          userId
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken
    };
  }

  async validateDiscordUser(profile: Profile) {

    let user = await this.usersService.findByDiscordId(
      profile.id
    );

    if (user) {
      return user;
    }

    // User doesn't exist, create a new one
    // Generate a unique username if needed
    let username = profile.username;
    let usernameExists = await this.usersService.findByUsername(username);
    let counter = 1;

    // If username exists, append numbers until we find a unique one
    while (usernameExists) {
      username = `${profile.username}${counter}`;
      usernameExists = await this.usersService.findByUsername(username);
      counter++;
    }

    const created = await this.usersService.create({
      username,
      discordId: profile.id,
      avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
    });

    return created;
  }
}
