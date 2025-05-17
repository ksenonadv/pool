import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { ChatMessage, ClientGameEvent, ClientGameEventData, ConnectionStateEventData, SocketEvent } from "@shared/socket.types";
import { Server, Socket } from "socket.io";
import { UsersService } from "./users.service";
import { POOL_GAME_MIN_PLAYERS, WAITING_ROOM_ID } from "src/config/constants/pool.constants";
import { Game } from "src/game";

@Injectable()
export class SocketService {

  private server: Server;

  private readonly userIdToSocket: Map<string, Socket> = new Map();
  private readonly socketToUserId: Map<string, string> = new Map();
  private socketToRoomId: Map<string /* socketId */, string /* roomId */> = new Map();
  private readonly games: Set<Game> = new Set();

  constructor(
    private readonly usersService: UsersService
  ) { }

  public setServer(server: Server) {
    this.server = server;
  }

  public async onJoin(client: Socket) {
    
    const userId = client['user']['userId'];

    if (!userId) {
      throw new WsException(
        'Client is not authenticated'
      );
    }

    if (this.userIdToSocket.has(userId)) {
      throw new WsException(
        'User is already connected'
      );
    }

    this.userIdToSocket.set(userId, client);
    this.socketToUserId.set(client.id, userId);

    // We are now connected. 
    // Join the waiting room.
    await this.addToWaitingRoom(client);
  }

  public async onDisconnect(client: Socket) {

    const userId = this.socketToUserId.get(
      client.id
    );
    
    if (!userId)
      return;

    this.userIdToSocket.delete(userId);
    this.socketToUserId.delete(client.id);

    // Remove from current room.
    this.socketToRoomId.delete(client.id);
  }

  private setRoom(client: Socket, roomId: string) {
    this.socketToRoomId.set(
      client.id,
      roomId
    );

    client.join(
      roomId
    );
  }

  private async addToWaitingRoom(client: Socket) {

    this.setRoom(
      client,
      WAITING_ROOM_ID
    );

    client.emit(
      SocketEvent.SET_CONNECTION_STATE,
      ConnectionStateEventData.InWaitingRoom
    );

    this.sendSystemMessage(
      client,
      `Welcome to the waiting room.<br>Please wait for more players to join.`
    );

    const { username } = await this.getUserFromSocket(
      client
    );

    this.server.to(WAITING_ROOM_ID).emit(
      SocketEvent.CHAT_MESSAGE,
      {
        name: 'System',
        text: `${username} has joined.`,
        date: new Date()
      } as ChatMessage
    );

    this.attemptToStartGame();
  }

  public async onChatMessage(client: Socket, message: string) {

    const room = this.socketToRoomId.get(
      client.id
    );

    if (!room || room === WAITING_ROOM_ID) {
      throw new WsException(
        'Only players in a game can send messages.'
      );
    }

    const user = await this.getUserFromSocket(
      client
    );

    if (!user)
      return;

    this.server.to(room).emit(
      SocketEvent.CHAT_MESSAGE,
      {
        name: user.username,
        text: message,
        date: new Date()
      }
    );
  }

  private sendSystemMessage(client: Socket, text: string) {
    client.emit(
      SocketEvent.CHAT_MESSAGE,
      {
        name: 'System',
        text,
        date: new Date()
      } as ChatMessage
    );
  }

  private async attemptToStartGame() {

    const waitingPlayersCount = await this.server.in(
      WAITING_ROOM_ID
    ).fetchSockets();

    if (waitingPlayersCount.length < POOL_GAME_MIN_PLAYERS)
      return;

    const [
      player1, 
      player2
    ] = waitingPlayersCount;

    const game = new Game([
      await this.createGamePlayer(
        player1 as unknown as Socket
      ),
      await this.createGamePlayer(
        player2 as unknown as Socket
      )
    ]);

    this.games.add(
      game
    );

    this.setRoom(
      player1 as unknown as Socket,
      game.id
    );

    this.setRoom(
      player2 as unknown as Socket,
      game.id
    );
  }

  public processGameEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    data: ClientGameEventData['data']
  ) 
  {
    const roomId = this.socketToRoomId.get(
      sender.id
    );

    if (!roomId || roomId === WAITING_ROOM_ID) {
      throw new WsException(
        'Client is not in a game.'
      );
    }

    const game = [...this.games].find(
      (game) => game.id === roomId
    );

    game.processEvent(
      sender,
      event,
      data
    );
  }

  private async createGamePlayer(client: Socket) {

    const { id, username, avatar } = await this.getUserFromSocket(
      client
    );

    return {
      userId: id,
      name: username,
      avatar,
      socket: client
    };
  }

  private async getUserFromSocket(client: Socket) {

    const userId = this.socketToUserId.get(
      client.id
    );

    if (!userId) 
      return null;

    return this.usersService.findById(
      userId
    );
  }

}