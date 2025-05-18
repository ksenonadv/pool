import { Injectable } from '@nestjs/common';
import { IGamePlayer } from '../interfaces/game-player.interface';
import { BallGroup } from '@shared/game.types';
import { SOLID_BALLS, STRIPED_BALLS } from 'src/config/game.config';

/**
 * Injectable service that manages the state of a pool game
 */
@Injectable()
export class GameStateService {
 
  // Core game state
  
  public readonly id: string = crypto.randomUUID();
  public gameOver: boolean = false;
  public breakShot: boolean = true; // First shot is a break
  public currentPlayerPocketedBalls: boolean = false;
  public shouldSwitchTurn: boolean = false;
  public matchStartTime: number = Date.now();
  
  // Ball tracking
  public solidsRemaining: Set<number> = new Set(SOLID_BALLS);
  public stripesRemaining: Set<number> = new Set(STRIPED_BALLS);
  
  // Player state
  private _activePlayer: IGamePlayer;
  private _players: [IGamePlayer, IGamePlayer];

  /**
   * Gets the currently active player
   */
  public get activePlayer(): IGamePlayer {
    return this._activePlayer;
  }
  
  /**
   * Sets the active player
   */
  public set activePlayer(player: IGamePlayer) {
    this._activePlayer = player;
    this.currentPlayerPocketedBalls = false;
    this.shouldSwitchTurn = false;
  }

  /**
   * Gets the players
   */
  public get players(): [IGamePlayer, IGamePlayer] {
    return this._players;
  }

  /**
   * Initializes the game state with players
   */
  public initialize(players: [IGamePlayer, IGamePlayer]): void {
    this._players = players;
    
    // Initialize player state
    this._players[0].ballGroup = undefined;
    this._players[1].ballGroup = undefined;

    // Initialize player stats
    this._players[0].shotsTaken = 0;
    this._players[0].fouls = 0;

    this._players[1].shotsTaken = 0;
    this._players[1].fouls = 0;
    
    // Random initial player
    this._activePlayer = this._players[Math.random() > 0.5 ? 1 : 0];
  }

  /**
   * Gets the player who isn't currently active
   */
  public get otherPlayer(): IGamePlayer {
    return this._players.find(
      player => player.userId !== this._activePlayer.userId
    )!;
  }

  /**
   * Gets the ball group (solids or stripes) for a ball number
   */
  public getBallGroup(number: number): BallGroup {
    if (number === 8)
      return BallGroup.EIGHT;
    else if (SOLID_BALLS.includes(number))
      return BallGroup.SOLIDS;
    else if (STRIPED_BALLS.includes(number))
      return BallGroup.STRIPES;

    return BallGroup.NONE;
  }

  /**
   * Updates the remaining balls after a ball is pocketed
   */
  public updateRemainingBalls(ballNumber: number, group: BallGroup): void {
    if (group === BallGroup.SOLIDS)
      this.solidsRemaining.delete(ballNumber);
    else if (group === BallGroup.STRIPES)
      this.stripesRemaining.delete(ballNumber);
  }

  public getDuration(): number {
    return Math.floor((Date.now() - this.matchStartTime) / 1000);
  }

}
