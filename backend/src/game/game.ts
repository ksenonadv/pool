import { ChatMessage, ClientGameEvent, ClientGameEventData, ConnectionStateEventData, ServerEvent, SetBallGroupEventData, ShootEventData, SocketEvent } from "@shared/socket.types";

import { Socket } from "socket.io";
import { Worker } from "worker_threads";
import { join } from "path";

import { BallGroup } from "@shared/game.types";

import { MainProcessMessageType, WorkerProcessMessage, WorkerProcessMessageType } from "src/game/ipc.types";
import { SOLID_BALLS, STRIPED_BALLS } from "src/config/game.config";

export type GamePlayer = { 
  name: string;
  avatar: string;
  userId: string;
  socket: Socket;
  ballGroup?: BallGroup;
};

export class Game {

  public readonly id: string = crypto.randomUUID();

  private worker: Worker;
  private activePlayer: GamePlayer;

  private currentPlayerPocketedBalls: boolean = false;
  private shouldSwitchTurn: boolean = false;
  
  private breakShot: boolean = true; // First shot is a break
  private gameOver: boolean = false; // Track if game is over

  private solidsRemaining: Set<number> = new Set(SOLID_BALLS);
  private stripesRemaining: Set<number> = new Set(STRIPED_BALLS);

  private endGameCallback: () => void = undefined;

  private matchStartTime: number = Date.now();

  private get otherPlayer() {
    return this.players.find(
      player => player.userId != this.activePlayer.userId
    )!;
  }
  constructor(
    private readonly players: [GamePlayer, GamePlayer]
  ) 
  { 
    this.worker = new Worker(join(__dirname, 'worker', 'index.js'));    
    this.worker.on('message', this.handleWorkerMessage.bind(this));
    
    this.worker.postMessage({
      type: MainProcessMessageType.INIT
    });

    // Initialize ball groups for players
    this.players[0].ballGroup = undefined;
    this.players[1].ballGroup = undefined;

    this.broadcast(
      SocketEvent.SET_CONNECTION_STATE,
      ConnectionStateEventData.InGame
    );

    this.setTurn(
      this.players[
        Math.random() > 0.5 ? 1 : 0
      ]
    );

    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_PLAYERS,
        data: this.players.map(p => ({
          name: p.name,
          avatar: p.avatar,
          userId: p.userId
        }))
      }
    );
  }

  private handleWorkerMessage(message: WorkerProcessMessage) {
    
    switch (message.type) {
      case WorkerProcessMessageType.UPDATE_BALLS: {
        this.broadcast(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.UPDATE_BALLS,
            data: message.payload
          }
        );
        break;
      }
      case WorkerProcessMessageType.MOVEMENT_START: {
        this.broadcast(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.MOVEMENT_START,
            data: undefined
          }
        );
        break;
      }
      case WorkerProcessMessageType.MOVEMENT_END: {
                
        this.broadcast(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.MOVEMENT_END,
            data: undefined
          }
        );
        
        if (this.breakShot) 
          this.breakShot = false;

        if (this.gameOver) 
          return;

        if (!this.currentPlayerPocketedBalls || this.shouldSwitchTurn) {
          this.setTurn(
            this.otherPlayer
          );
        }

        break;
      }
      case WorkerProcessMessageType.BALL_POCKETED: {
        
        const { ballNumber } = message.payload;
        
        if (ballNumber === 8) {
          
          // 8-ball pocketed
          let winnerId: string | null = null;

          let gameOverMsg = '';
          
          if (this.breakShot) {
            gameOverMsg = `${this.activePlayer.name} pocketed the 8-ball on the break and lost!`;
            winnerId = this.otherPlayer.userId;
          } 
          else if (
            this.activePlayer.ballGroup &&
            ((this.activePlayer.ballGroup === BallGroup.SOLIDS && this.solidsRemaining.size === 0) ||
             (this.activePlayer.ballGroup === BallGroup.STRIPES && this.stripesRemaining.size === 0))
          ) {
            gameOverMsg = `${this.activePlayer.name} pocketed the 8-ball and won!`;
            winnerId = this.activePlayer.userId;
          } else {
            gameOverMsg = `${this.activePlayer.name} pocketed the 8-ball too early and lost!`;
            winnerId = this.otherPlayer.userId;
          }

          this.gameOver = true;
          this.sendMessage(gameOverMsg);

          this.players.forEach(player => {

            player.socket.emit(
              SocketEvent.SERVER_GAME_EVENT,
              {
                event: ServerEvent.GAME_OVER,
                data: {
                  message: gameOverMsg,
                  duration: Math.floor((Date.now() - this.matchStartTime) / 1_000), // Match duration in seconds
                }
              }
            );

          });


          if (this.endGameCallback) {
            this.endGameCallback();
            this.endGameCallback = undefined;
          }

          break;
        }

        if (this.breakShot)
          this.breakShot = false;
        
        const group = this.getBallGroup(
          ballNumber
        );
        
        if (group === BallGroup.SOLIDS) {
          this.solidsRemaining.delete(
            ballNumber
          );
        }

        if (group === BallGroup.STRIPES) {
          this.stripesRemaining.delete(
            ballNumber
          );
        }

        this.broadcast(SocketEvent.SERVER_GAME_EVENT, {
          event: ServerEvent.BALL_POCKETED,
          data: {
            ball: ballNumber,
            group
          }
        });

        // Assign groups if not yet assigned and not break shot
        if (!this.breakShot && this.activePlayer.ballGroup === undefined && this.otherPlayer.ballGroup === undefined && group !== BallGroup.EIGHT) {
          
          this.activePlayer.ballGroup = group;
          this.otherPlayer.ballGroup = group === BallGroup.SOLIDS ? BallGroup.STRIPES : BallGroup.SOLIDS;
          
          this.broadcast(SocketEvent.SERVER_GAME_EVENT, {
            event: ServerEvent.SET_BALL_GROUP,
            data: {
              [this.activePlayer.userId]: this.activePlayer.ballGroup,
              [this.otherPlayer.userId]: this.otherPlayer.ballGroup
            } as SetBallGroupEventData
          });

        }

        // Check for fault.
        if (!this.breakShot && this.activePlayer.ballGroup !== undefined && group !== this.activePlayer.ballGroup) {
          this.shouldSwitchTurn = true;
        }

        this.currentPlayerPocketedBalls = true;
        break;
      }
      case WorkerProcessMessageType.CUE_BALL_POCKETED: {
        this.shouldSwitchTurn = true;
        break;
      }
    }
  }

  private setTurn(
    player: GamePlayer
  ) 
  { 
    this.activePlayer = player;
    this.currentPlayerPocketedBalls = false;
    this.shouldSwitchTurn = false;
    
    this.activePlayer.socket.emit(
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

    const other = this.otherPlayer;
    
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
  
  public processEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    payload: ClientGameEventData['data']
  ) {
    
    // Check if the sender is the active player
    if (this.activePlayer.socket.id !== sender.id)
      return;
      
    // Don't process events if game is over
    if (this.gameOver)
      return;

    switch (event) {
      case ClientGameEvent.SHOOT: {
                
        this.worker.postMessage({
          type: MainProcessMessageType.SHOOT,
          payload
        });
        
        break;  
      }
      case ClientGameEvent.SYNC_CUE: {
        this.otherPlayer.socket.emit(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.SYNC_CUE,
            data: payload
          }
        );
        break;
      }
    }
  }

  private broadcast(
    event: SocketEvent,
    payload?: any
  ) 
  {
    this.players.forEach(player => {
      player.socket.emit(
        event,
        payload
      );
    });
  }

  private sendMessage(
    message: string,
    client?: Socket
  ) 
  {
    if (client) {
      client.emit(
        SocketEvent.CHAT_MESSAGE,
        {
          name: 'System',
          text: message,
          date: new Date()
        } as ChatMessage
      );
    } else {
      this.broadcast(
        SocketEvent.CHAT_MESSAGE,
        {
          name: 'System',
          text: message,
          date: new Date()
        } as ChatMessage
      );
    }
  }

  private getBallGroup(
    number: number
  ): BallGroup {
      if (number === 8)
        return BallGroup.EIGHT;
      else if (SOLID_BALLS.includes(number))
        return BallGroup.SOLIDS;
      else if (STRIPED_BALLS.includes(number))
        return BallGroup.STRIPES;

    return BallGroup.NONE;
  }

  public cleanup() {

    if (!this.worker)
      return;

    this.worker.postMessage({ 
      type: MainProcessMessageType.STOP
    });

    this.worker.terminate();
    this.worker = null;
  }

  public addEndGameCallback(callback: () => void) {
    this.endGameCallback = callback;
  };

}