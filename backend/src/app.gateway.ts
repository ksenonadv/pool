import { WebSocketGateway, SubscribeMessage, OnGatewayDisconnect, ConnectedSocket, WebSocketServer, OnGatewayInit, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/guards/wsAuth.guard';
import { GameService } from 'src/services/game.service';
import { ClientGameEventData, SocketEvent } from '@shared/socket.types';

@WebSocketGateway({
  namespace: 'pool',
  cors: {
    origin: '*',
  }
})
export class GameGateway implements OnGatewayInit, OnGatewayDisconnect {
  
  constructor(
    private readonly socketService: GameService,
  ) { }

  afterInit(server: Server) {
    this.socketService.setServer(
      server
    );
  }

  handleDisconnect(client: Socket) {
    this.socketService.onDisconnect(
      client
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SocketEvent.JOIN)
  async handleJoin(@ConnectedSocket() client: Socket) {
    try {
      this.socketService.onJoin(
        client
      );
    } catch(error) {
      client.disconnect(
        true
      );
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SocketEvent.CHAT_MESSAGE)
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() 
    message: string
  ) {
    this.socketService.onChatMessage(
      client,
      message
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SocketEvent.CLIENT_GAME_EVENT)
  async handleClientGameEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() 
    data: ClientGameEventData
  ) {

    const { event, data: payload } = data;

    if (!event || payload === undefined)
      return;

    this.socketService.processGameEvent(
      client,
      event,
      payload
    );
  }
}
