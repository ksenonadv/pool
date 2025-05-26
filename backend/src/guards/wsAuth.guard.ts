import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {

      const client: Socket = context.switchToWs().getClient<Socket>();
      
      const token = 
        client.handshake.auth.token || 
        client.handshake.headers.authorization?.split(' ')[1] || 
        client.handshake.query.token;
      
      if (!token) {
        throw new WsException(
          'Unauthorized access'
        );
      }

      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET'
        ),
        ignoreExpiration: true
      });

      client['user'] = payload;
      
      return true;
    } catch (error) {
      throw new WsException(
        'Unauthorized access'
      );
    }
  }
}
