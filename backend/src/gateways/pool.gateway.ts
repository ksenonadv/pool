import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/services/users.service';
import { WsJwtGuard } from 'src/guards/wsAuth.guard';

@WebSocketGateway({
  namespace: 'pool',
  cors: {
    origin: '*',
  }
})
export class PoolGateway implements OnGatewayDisconnect {
  
  @WebSocketServer()
  private server: Server;

  // Map containing database userId and their socket.
  private readonly users: Map<string, Socket> = new Map();

  // Map containing socketId and their database userId.
  private readonly sockets: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) { }

  handleDisconnect(client: Socket) {
    // Remove the user from the users map
    const userId = this.sockets.get(client.id);
    if (userId) {
      this.users.delete(userId);
      this.sockets.delete(client.id);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinWaitingRoom')
  joinWaitingRoom(@ConnectedSocket() client: Socket) {

    const userId = client['user'].sub;

    // Check if the user is already connected to the pool gateway.
    if (this.users.has(userId)) {
      throw new WsException(
        'You are already connected to the pool gateway.'
      );
    }

    this.users.set(
      userId,
      client
    );

    this.sockets.set(
      client.id,
      userId
    );
  }
}
