import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ball, BallPocketedEventData, ClientGameEvent, GameOverEventData, ServerEvent, ServerGameEventData, SetBallGroupEventData, SetPlayersEventData, SocketEvent, SyncCueEventData } from '@shared/socket.types';
import { PoolSocketService } from './pool-socket.service';
import { BallGroup } from '@shared/game.types';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PoolAudioService } from './pool-audio.service';
import { SoundType } from '../constants/assets.constants';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  private readonly socketService = inject(PoolSocketService);
  private readonly audioService = inject(PoolAudioService);

  private destroy$ = new Subject<void>();

  // Game state
  private _balls = new BehaviorSubject<Ball[]>([]);
  private _players = new BehaviorSubject<SetPlayersEventData>([]);
  private _canShoot = new BehaviorSubject<boolean>(false);
  private _ballsMoving = new BehaviorSubject<boolean>(false);
  private _cueData = new BehaviorSubject<SyncCueEventData | undefined>(undefined);
  private _stripesPocketed = new BehaviorSubject<number[]>([]);
  private _solidsPocketed = new BehaviorSubject<number[]>([]);
  private _gameOver = new Subject<GameOverEventData>();

  // Public observables
  public readonly balls$ = this._balls.asObservable();
  public readonly players$ = this._players.asObservable();
  public readonly canShoot$ = this._canShoot.asObservable();
  public readonly ballsMoving$ = this._ballsMoving.asObservable();
  public readonly cueData$ = this._cueData.asObservable();
  public readonly stripesPocketed$ = this._stripesPocketed.asObservable();
  public readonly solidsPocketed$ = this._solidsPocketed.asObservable();
  public readonly gameOver$ = this._gameOver.asObservable();

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners(): void {
    this.socketService.fromEvent<ServerGameEventData, SocketEvent.SERVER_GAME_EVENT>(SocketEvent.SERVER_GAME_EVENT)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const { event, data: payload } = data;
        this.handleServerEvent(event, payload);
      });
  }

  private handleServerEvent(event: ServerEvent, payload: any): void {
    switch (event) {
      case ServerEvent.SET_PLAYERS:
        this._players.next(payload as SetPlayersEventData);
        break;

      case ServerEvent.SET_BALL_GROUP:
        this.handleSetBallGroup(payload as SetBallGroupEventData);
        break;

      case ServerEvent.BALLS_SYNC:
        this._balls.next(payload as Array<Ball>);
        break;

      case ServerEvent.MOVING_BALLS_SYNC:
        this.handleMovingBallsSync(payload as Array<Ball>);
        break;

      case ServerEvent.SET_CAN_SHOOT:
        this.handleCanShoot(payload as boolean);
        break;

      case ServerEvent.SYNC_CUE:
        this._cueData.next(payload as SyncCueEventData);
        break;

      case ServerEvent.MOVEMENT_START:
        this._ballsMoving.next(true);
        break;

      case ServerEvent.MOVEMENT_END:
        this._ballsMoving.next(false);
        break;

      case ServerEvent.BALL_POCKETED:
        this.handleBallPocketed(payload as BallPocketedEventData);
        break;

      case ServerEvent.CUE_BALL_POCKETED:
        this.handleCueBallPocketed();
        break;
      
      case ServerEvent.GAME_OVER:
        this.handleGameOver(payload as GameOverEventData);
        break;

      case ServerEvent.PLAY_SOUND:
        this.playSound(payload as string);
        break;
    }
  }

  private handleCanShoot(canShoot: boolean): void {
    
    this._canShoot.next(canShoot);

    if (canShoot) {
      this.audioService.play(
        'turn'
      );
    }
  }

  private handleSetBallGroup(payload: SetBallGroupEventData): void {
    const currentPlayers = this._players.value;
    
    for (let [userId, group] of Object.entries(payload)) {
      const player = currentPlayers.find((player) => player.userId === userId);
      if (player) {
        player.group = group;
      }
    }
    
    this._players.next([...currentPlayers]);
  }

  private handleMovingBallsSync(movingBalls: Array<Ball>): void {
    const currentBalls = this._balls.value;
    if (!currentBalls.length) return;

    const updatedBalls = [...currentBalls];
    for (let ball of updatedBalls) {
      const movingBall = movingBalls.find((mb) => mb.no === ball.no);
      if (movingBall) {
        ball.position = movingBall.position;
        ball.angle = movingBall.angle;
      }
    }

    this._balls.next(updatedBalls);
  }

  /**
   * Handle ball pocketed event and play sound
   */
  private handleBallPocketed(data: BallPocketedEventData): void {
    
    const { ball, group } = data;
    
    // Update pocketed balls lists
    if (group === BallGroup.STRIPES) {
      this._stripesPocketed.next([...this._stripesPocketed.value, ball]);
    } else if (group === BallGroup.SOLIDS) {
      this._solidsPocketed.next([...this._solidsPocketed.value, ball]);
    }
    
    // Remove ball from the table
    const updatedBalls = this._balls.value.filter(b => b.no !== ball);
    this._balls.next(updatedBalls);
  }

  /**
   * Handle cue ball pocketed event
   */
  private handleCueBallPocketed(): void {
    const updatedBalls = this._balls.value.filter(b => b.no !== 0);
    this._balls.next(updatedBalls);
  }

  /**
   * Handle game over event and play sound
   */
  private handleGameOver(data: GameOverEventData): void {
    this._gameOver.next(data);
  }

  /**
   * Play sound
   */
  private playSound(sound: string): void {
    this.audioService.play(sound as SoundType);
  }

  // Public methods for component to use
  public shoot(cueData: SyncCueEventData): void {
    
    if (!this._canShoot.value || this._ballsMoving.value || !cueData?.power)
      return;
    
    this.socketService.sendGameEvent(
      ClientGameEvent.SHOOT,
      {
        power: cueData.power,
        mouseX: cueData.mouseX,
        mouseY: cueData.mouseY
      }
    );
  }

  public syncCue(cueData: SyncCueEventData): void {
    
    this._cueData.next(
      cueData
    );
    
    this.socketService.sendGameEvent(
      ClientGameEvent.SYNC_CUE,
      cueData
    );
  }

  public cleanup(): void {
    
    this.destroy$.next();
    this.destroy$.complete();
    
    // Reset all state
    this._balls.next([]);
    this._players.next([]);
    this._canShoot.next(false);
    this._ballsMoving.next(false);
    this._cueData.next(undefined);
    this._stripesPocketed.next([]);
    this._solidsPocketed.next([]);
  }

  // Current value getters
  public get balls(): Ball[] {
    return this._balls.value;
  }

  public get canShoot(): boolean {
    return this._canShoot.value;
  }
  
  public get ballsMoving(): boolean {
    return this._ballsMoving.value;
  }
  
  public get cueData(): SyncCueEventData | undefined {
    return this._cueData.value;
  }
}
