import { Injectable, Logger } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { ChatMessage, ClientGameEventData, ConnectionStateEventData, ServerEvent, SocketEvent } from "@shared/socket.types";
import { Server, Socket } from "socket.io";
import { UsersService } from "./users.service";
import { POOL_GAME_MIN_PLAYERS, WAITING_ROOM_ID } from "../config/game.config";
import { StatsService } from "./stats.service";

import { Game } from "src/game/game";
import { IGamePlayer } from "src/game/interfaces/game-player.interface";
import { GameFactoryService } from "src/game/services/game-factory.service";
import { DEFAULT_CUES } from "src/config/cues.config";

@Injectable()
export class GameService {
  private server: Server;

  private readonly userIdToSocket: Map<string, Socket> = new Map();
  private readonly socketToUserId: Map<string, string> = new Map();
  private socketToRoomId: Map<string /* socketId */, string /* roomId */> = new Map();
  private readonly games: Set<Game> = new Set();
  private readonly logger = new Logger('GameService');
  
  constructor(
    private readonly usersService: UsersService,
    private readonly gameFactoryService: GameFactoryService,
    private readonly statsService: StatsService
  ) { }

  public setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Handle a new client connection and join the waiting room
   */
  public async onJoin(client: Socket): Promise<void> {
    
    try {
      
      const userId = client['user']?.['userId'];

      if (!userId) {
        throw new WsException(
          'Client is not authenticated'
        );
      }

      // Prevent multiple connections from the same user
      if (this.userIdToSocket.has(userId))
        return;

      this.userIdToSocket.set(userId, client);
      this.socketToUserId.set(client.id, userId);

      // Join the waiting room
      await this.addToWaitingRoom(client);

    } catch (error) {
      
      this.logger.error(`Error in onJoin: ${error.message}`);

      throw new WsException(
        'Failed to join: ' + error.message
      );
    }
  }

  /**
   * Handle client disconnection and clean up resources
   */
  public async onDisconnect(client: Socket): Promise<void> {
    try {
      
      const userId = this.socketToUserId.get(client.id);
      
      if (!userId)
        return;

      this.userIdToSocket.delete(userId);
      this.socketToUserId.delete(client.id);

      this.removeFromRoom(client);
    } catch (error) {
      this.logger.error(
        `Error in onDisconnect: ${error.message}`
      );
    }
  }

  /**
   * Add a client to a specific room
   */
  private setRoom(client: Socket, roomId: string): void {

    
    // Remove from any previous room
    const previousRoomId = this.socketToRoomId.get(client.id);
    if (previousRoomId) {
      client.leave(
        previousRoomId
      );
    }


    this.socketToRoomId.set(client.id, roomId);
    client.join(roomId);
  }

  /**
   * Remove a client from its current room and clean up any associated game
   */
  private removeFromRoom(client: Socket): void {
    
    // Clean up any game the user was in
    const roomId = this.socketToRoomId.get(client.id);
    
    if (roomId && roomId !== WAITING_ROOM_ID) {
      this.notifyDisconnect(
        client, 
        roomId
      );
    }

    // Remove from current room
    this.socketToRoomId.delete(client.id);
  }

  private notifyDisconnect(client: Socket, roomId: string): void {

    const game = Array.from(
      this.games
    ).find((game) => game.id === roomId);
    
    if (!game)
      return;

    game.handleDisconnect(
      client.id
    );
  }

  /**
   * Add a client to the waiting room and attempt to start a game
   */
  private async addToWaitingRoom(client: Socket): Promise<void> {
    this.setRoom(client, WAITING_ROOM_ID);

    client.emit(
      SocketEvent.SET_CONNECTION_STATE,
      ConnectionStateEventData.InWaitingRoom
    );

    this.sendSystemMessage(
      client,
      `Welcome to the waiting room.<br>Please wait for more players to join.`
    );

    await this.attemptToStartGame();
  }
  /**
   * Handle chat messages from clients
   */
  public async onChatMessage(client: Socket, message: string): Promise<void> {
    try {
      const room = this.socketToRoomId.get(client.id);

      if (!room || room === WAITING_ROOM_ID) {
        throw new WsException('Only players in a game can send messages.');
      }

      const user = await this.getUserFromSocket(client);

      if (!user) {
        throw new WsException('User not found.');
      }

      this.server.to(room).emit(
        SocketEvent.CHAT_MESSAGE,
        {
          name: user.username,
          text: message,
          date: new Date()
        }
      );
    } catch (error) {
      throw new WsException(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Send a system message to a client
   */
  private sendSystemMessage(client: Socket, text: string): void {
    client.emit(
      SocketEvent.CHAT_MESSAGE,
      {
        name: 'System',
        text,
        date: new Date()
      } as ChatMessage
    );
  }

  /**
   * Attempt to start a game if there are enough players in the waiting room
   */
  private async attemptToStartGame(): Promise<void> {
    try {
      
      const waitingSockets = await this.server.in(WAITING_ROOM_ID).fetchSockets() as unknown as Array<Socket>;

      if (waitingSockets.length < POOL_GAME_MIN_PLAYERS)
        return;

      const [
        player1, 
        player2
      ] = waitingSockets;

      this.createGame(
        player1,
        player2
      );

    } catch (error) {
      this.logger.error(
        `Failed to start game: ${error.message}`
      );
    }
  }

  /**
   * Process a game event from a client
   */
  public processGameEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    data: ClientGameEventData['data']
  ): void {
    try {
      const roomId = this.socketToRoomId.get(sender.id);

      if (!roomId || roomId === WAITING_ROOM_ID) {
        throw new WsException('Client is not in a game.');
      }

      const game = [...this.games].find(
        (game) => game.id === roomId
      );

      if (!game) {
        throw new WsException('Game not found.');
      }

      game.processEvent(sender, event, data);
    } catch (error) {
      throw new WsException(`Failed to process game event: ${error.message}`);
    }
  }
  /**
   * Create a player object from a socket connection
   */
  private async createGamePlayer(client: Socket): Promise<IGamePlayer> {
    try {
      
      const user = await this.getUserFromSocket(
        client
      );
      
      if (!user) {
        throw new WsException(
          'User not found'
        );
      }

      return {
        userId: user.id,
        name: user.username,
        avatar: user.avatar,
        cue: user.cue ? user.cue.image : DEFAULT_CUES[0].image,
        socket: client
      };
    } catch (error) {
      throw new WsException(`Failed to create game player: ${error.message}`);
    }
  }

  /**
   * Get user data from a socket connection
   */
  private async getUserFromSocket(client: Socket) {
    
    const userId = this.socketToUserId.get(client.id);

    if (!userId) 
      return null;

    return this.usersService.findById(userId);
  }  
  
  private async createGame(player1: Socket, player2: Socket) {
    try {      
      
      // Create game player objects
      const gamePlayer1 = await this.createGamePlayer(player1);
      const gamePlayer2 = await this.createGamePlayer(player2);
      
      // Use the factory service to create a new game with isolated services
      const game = this.gameFactoryService.createGame(
        [gamePlayer1, gamePlayer2],
        this.statsService
      );
            
      // Add to active games set
      this.games.add(game);
      
      // Move the players from waiting room to the game room
      this.setRoom(player1 as unknown as Socket, game.id);
      this.setRoom(player2 as unknown as Socket, game.id);
      
      game.end$.subscribe((data) => {
        this.games.delete(
          game
        );
      });   

    } catch (error) {
      throw new WsException(`Failed to create game: ${error.message}`);
    }
  }
}