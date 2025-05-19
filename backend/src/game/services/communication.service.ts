import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { 
  Ball,
  ChatMessage, 
  ConnectionStateEventData, 
  GameOverReason, 
  NameAndAvatar, 
  ServerEvent, 
  SetBallGroupEventData, 
  SocketEvent 
} from '@shared/socket.types';
import { BallGroup } from '@shared/game.types';
import { GameStateService } from './game-state.service';
import { IGamePlayer } from '../interfaces/game-player.interface';

/**
 * Injectable service that manages communication with game clients
 */
@Injectable()
export class CommunicationService {
  
  constructor(
    private readonly gameStateService: GameStateService,
  ) { }

  /**
   * Broadcasts an event to all players
   */
  public broadcast(
    event: SocketEvent,
    payload?: any
  ): void {
    this.gameStateService.players.forEach(player => {
      player.socket.emit(
        event,
        payload
      );
    });
  }

  /**
   * Sends a system message to a specific client or all clients
   */
  public sendMessage(
    message: string,
    client?: Socket
  ): void {
    const chatMessage: ChatMessage = {
      name: 'System',
      text: message,
      date: new Date()
    };
    
    if (client) {
      client.emit(SocketEvent.CHAT_MESSAGE, chatMessage);
    } else {
      this.broadcast(SocketEvent.CHAT_MESSAGE, chatMessage);
    }
  }

  /**
   * Notifies clients about initial game state
   */
  public notifyGameStart(): void {
    // Set connection state to in-game
    this.broadcast(
      SocketEvent.SET_CONNECTION_STATE,
      ConnectionStateEventData.InGame
    );
    
    // Send player information
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_PLAYERS,
        data: this.gameStateService.players.map(p => ({
          name: p.name,
          avatar: p.avatar,
          userId: p.userId
        }))
      }
    );
  }

  /**
   * Notifies about turn change
   */
  public notifyTurnChange(player: IGamePlayer): void {
    // Tell active player it's their turn
    player.socket.emit(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_CAN_SHOOT,
        data: true
      }
    );
    
    this.sendMessage(
      `It is your turn.${player.ballGroup ? ` You are using ${player.ballGroup}.` : ''}`,
      player.socket
    );
    
    // Tell other player it's not their turn
    const other = this.gameStateService.otherPlayer;
    
    this.sendMessage(
      `It is ${player.name}'s turn.${player.ballGroup ? ` They are ${player.ballGroup}.` : ''}`,
      other.socket
    );
    
    other.socket.emit(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_CAN_SHOOT,
        data: false
      }
    );
  }

  /**
   * Notifies about ball pocketed
   */
  public notifyBallPocketed(ballNumber: number, group: BallGroup): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.BALL_POCKETED,
        data: {
          ball: ballNumber,
          group
        }
      }
    );
  }

  public notifyCueBallPocketed(): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.CUE_BALL_POCKETED,
      }
    );
  }

  public playSound(sound: string): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.PLAY_SOUND,
        data: sound
      }
    );
  }

  /**
   * Notifies about ball group assignment
   */
  public notifyBallGroupAssignment(): void {
    const { activePlayer, otherPlayer } = this.gameStateService;
    
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_BALL_GROUP,
        data: {
          [activePlayer.userId]: activePlayer.ballGroup,
          [otherPlayer.userId]: otherPlayer.ballGroup
        } as SetBallGroupEventData
      }
    );
  }

  /**
   * Notifies about ball movements
   */
  public sendBallsSync(ballsData: Array<Ball>): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.BALLS_SYNC,
        data: ballsData
      }
    );
  }

  public sendMovingBallsSync(ballsData: Array<Ball>): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.MOVING_BALLS_SYNC,
        data: ballsData
      }
    );
  }

  /**
   * Notifies about movement start
   */
  public notifyMovementStart(): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.MOVEMENT_START,
        data: undefined
      }
    );
  }

  /**
   * Notifies about movement end
   */
  public notifyMovementEnd(): void {
    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.MOVEMENT_END,
        data: undefined
      }
    );
  }

  /**
   * Notifies about cue synchronization
   */
  public notifyCueSync(payload: any, target: IGamePlayer): void {
    target.socket.emit(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SYNC_CUE,
        data: payload
      }
    );
  }

  /**
   * Notifies about game over
   */
  public notifyGameOver(reason: GameOverReason, gamePlayer: NameAndAvatar): void {

    this.gameStateService.players.forEach(player => {
      player.socket.emit(
        SocketEvent.SERVER_GAME_EVENT,
        {
          event: ServerEvent.GAME_OVER,
          data: {
            reason,
            player: {
              name: gamePlayer.name,
              avatar: gamePlayer.avatar,
            },
            duration: this.gameStateService.getDuration(), // Match duration in seconds
          }
        }
      );
    });
  }
}
