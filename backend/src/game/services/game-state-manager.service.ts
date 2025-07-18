import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ClientGameEvent, ClientGameEventData } from '@shared/socket.types';
import { WorkerProcessMessage, WorkerProcessMessageType } from 'src/game/ipc.types';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';

import { GameStateService } from './game-state.service';
import { RulesService } from './rules.service';
import { PhysicsService } from './physics.service';
import { CommunicationService } from './communication.service';

/**
 * Injectable service that manages the overall game state
 */
@Injectable()
export class GameStateManagerService {
  private onEnd: Subject<void> = new Subject<void>();
  
  constructor(
    private readonly gameStateService: GameStateService,
    private readonly rulesService: RulesService,
    private readonly physicsService: PhysicsService,
    private readonly communicationService: CommunicationService
  ) {}

  /**
   * Initialize the manager with a message handler for the physics service
   */
  public initialize(): void {
    this.physicsService.initialize(this.handleWorkerMessage.bind(
      this
    ));
  }
  
  /**
   * Handles worker messages
   */
  public handleWorkerMessage(message: WorkerProcessMessage): void {
    
    switch (message.type) {
      
      case WorkerProcessMessageType.SYNC_BALLS:
        this.communicationService.sendBallsSync(message.payload);
        break;

      case WorkerProcessMessageType.SYNC_MOVING_BALLS:
        this.communicationService.sendMovingBallsSync(message.payload);
        break;
      
      case WorkerProcessMessageType.MOVEMENT_START:
        this.communicationService.notifyMovementStart();
        break;
      
      case WorkerProcessMessageType.MOVEMENT_END:
        this.communicationService.notifyMovementEnd();
        this.rulesService.handleMovementEnd();
        break;
      
      case WorkerProcessMessageType.BALL_POCKETED: {
        this.rulesService.handleBallPocketed(message.payload.ballNumber);
        break;
      }
      
      case WorkerProcessMessageType.CUE_BALL_POCKETED:
        this.rulesService.handleCueBallPocketed();
        this.communicationService.notifyCueBallPocketed();
        break;

      case WorkerProcessMessageType.PLAY_SOUND:
        this.communicationService.playSound(message.payload.sound);
        break;

      case WorkerProcessMessageType.SYNC_GUIDE_LINE:
        this.communicationService.sendGuideLineSync(message.payload);
        break;
    }
  }

  /**
   * Processes events from clients
   */
  public processEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    payload: ClientGameEventData['data']
  ): void {
    
    // Check if the sender is the active player
    if (this.gameStateService.activePlayer.socket.id !== sender.id)
      return;
      
    // Don't process events if game is over
    if (this.gameStateService.gameOver)
      return;

    switch (event) {
      case ClientGameEvent.SHOOT: {
        this.gameStateService.currentPlayerPocketedBalls = false;
        this.gameStateService.activePlayer.shotsTaken ++;
        this.physicsService.shoot(payload);
        break;  
      }
      case ClientGameEvent.SYNC_CUE: {
        this.physicsService.computeGuideLine(payload.mouseX, payload.mouseY);
        this.communicationService.notifyCueSync(payload, this.gameStateService.otherPlayer);
        break;
      }
    }
  }

  /**
   * Handles player disconnection
   */
  public handleDisconnect(socketId: string): void {
    this.rulesService.handleDisconnect(socketId);
    this.endGame();
  }

  /**
   * Ends the game
   */
  private endGame(): void {
    this.onEnd.next();
    this.onEnd.complete();
  }

  /**
   * Cleans up resources
   */
  public cleanup(): void {
    this.physicsService.cleanup();
  }

  /**
   * Observable that emits when the game ends
   */
  public get end$(): Observable<void> {
    return this.onEnd.asObservable();
  }
}
