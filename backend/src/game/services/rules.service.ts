import { Injectable } from '@nestjs/common';
import { BallGroup } from '@shared/game.types';
import { GameStateService } from './game-state.service';
import { CommunicationService } from './communication.service';
import { IGamePlayer } from '../interfaces/game-player.interface';

/**
 * Injectable service that manages game rules
 */
@Injectable()
export class RulesService {
  constructor(
    private readonly gameStateService: GameStateService,
    private readonly communicationService: CommunicationService
  ) {}

  /**
   * Handles a ball being pocketed
   */
  public handleBallPocketed(ballNumber: number): void {
    if (ballNumber === 8)
      return this.handleEightBallPocketed();

    if (this.gameStateService.breakShot)
      this.gameStateService.breakShot = false;
    
    const group = this.gameStateService.getBallGroup(ballNumber);
    
    this.gameStateService.updateRemainingBalls(ballNumber, group);
    this.communicationService.notifyBallPocketed(ballNumber, group);
    this.checkAndAssignGroups(group);
    
    // Check for fault
    if (!this.gameStateService.breakShot && 
        this.gameStateService.activePlayer.ballGroup !== undefined && 
        group !== this.gameStateService.activePlayer.ballGroup) {
      this.gameStateService.shouldSwitchTurn = true;
    }

    this.gameStateService.currentPlayerPocketedBalls = true;
  }

  /**
   * Handles the cue ball being pocketed
   */
  public handleCueBallPocketed(): void {
    this.gameStateService.shouldSwitchTurn = true;
  }

  /**
   * Handles the 8-ball being pocketed
   */
  private handleEightBallPocketed(): void {
    const { activePlayer, otherPlayer } = this.gameStateService;
    
    // 8-ball pocketed
    let winnerId: string | null = null;
    let gameOverMsg = '';
    
    if (this.gameStateService.breakShot) {
      gameOverMsg = `${activePlayer.name} pocketed the 8-ball on the break and lost!`;
      winnerId = otherPlayer.userId;
    } 
    else if (
      activePlayer.ballGroup &&
      ((activePlayer.ballGroup === BallGroup.SOLIDS && this.gameStateService.solidsRemaining.size === 0) ||
       (activePlayer.ballGroup === BallGroup.STRIPES && this.gameStateService.stripesRemaining.size === 0))
    ) {
      gameOverMsg = `${activePlayer.name} pocketed the 8-ball and won!`;
      winnerId = activePlayer.userId;
    } else {
      gameOverMsg = `${activePlayer.name} pocketed the 8-ball too early and lost!`;
      winnerId = otherPlayer.userId;
    }

    this.endGame(gameOverMsg, winnerId);
  }

  /**
   * Assigns ball groups to players if not already assigned
   */
  private checkAndAssignGroups(group: BallGroup): void {
    const { activePlayer, otherPlayer } = this.gameStateService;
    
    if (this.gameStateService.breakShot || activePlayer.ballGroup !== undefined)
      return;
      
    activePlayer.ballGroup = group;
    otherPlayer.ballGroup = group === BallGroup.SOLIDS ? BallGroup.STRIPES : BallGroup.SOLIDS;
    
    this.communicationService.notifyBallGroupAssignment();
  }

  /**
   * Handles the end of ball movement
   */
  public handleMovementEnd(): void {
    if (this.gameStateService.breakShot) 
      this.gameStateService.breakShot = false;
    
    if (this.gameStateService.gameOver) 
      return;

    if (!this.gameStateService.currentPlayerPocketedBalls || this.gameStateService.shouldSwitchTurn) {
      this.setTurn(this.gameStateService.otherPlayer);
    }
  }

  /**
   * Sets the current turn to the specified player
   */
  public setTurn(player: IGamePlayer): void {
    this.gameStateService.activePlayer = player;
    this.communicationService.notifyTurnChange(player);
  }

  /**
   * Ends the game
   */
  public endGame(message: string, winnerId?: string): void {
    if (this.gameStateService.gameOver) 
      return;

    this.gameStateService.gameOver = true;
    this.communicationService.notifyGameOver(message, winnerId);
  }

  /**
   * Handles player disconnection
   */
  public handleDisconnect(socketId: string): void {
    const player = this.gameStateService.players.find(
      player => player.socket.id === socketId
    );

    if (!player)
      return;

    this.endGame(`${player.name} disconnected. Game over!`);
  }
}
