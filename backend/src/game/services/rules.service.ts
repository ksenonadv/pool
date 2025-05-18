import { Injectable } from '@nestjs/common';
import { BallGroup } from '@shared/game.types';
import { GameStateService } from './game-state.service';
import { CommunicationService } from './communication.service';
import { IGamePlayer } from '../interfaces/game-player.interface';
import { GameOverReason, NameAndAvatar } from '@shared/socket.types';
import { GameResultHandlerService } from './game-result-handler.service';

/**
 * Injectable service that manages game rules
 */
@Injectable()
export class RulesService {
  constructor(
    private readonly gameStateService: GameStateService,
    private readonly communicationService: CommunicationService,
    private readonly gameResultHandler: GameResultHandlerService
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
    this.gameStateService.activePlayer.fouls ++;
    this.gameStateService.shouldSwitchTurn = true;
  }

  /**
   * Handles the 8-ball being pocketed
   */
  private handleEightBallPocketed(): void {
    
    const { activePlayer } = this.gameStateService;
    
    if (this.gameStateService.breakShot) {
      return this.endGame(
        GameOverReason.FAULT
      );
    }

    const hasBallsLeft = activePlayer.ballGroup === BallGroup.SOLIDS && this.gameStateService.solidsRemaining.size > 0 ||
        activePlayer.ballGroup === BallGroup.STRIPES && this.gameStateService.stripesRemaining.size > 0;

    if (!hasBallsLeft) {
      this.endGame(
        GameOverReason.FAULT
      );
    } else {
      this.endGame(
        GameOverReason.WIN, 
      );
    }
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
  public endGame(reason: GameOverReason, player?: IGamePlayer): void {
    
    if (this.gameStateService.gameOver) 
      return;

    this.gameStateService.gameOver = true;

    if (!player)
      player = this.gameStateService.activePlayer;

    // Notify clients about game over
    this.communicationService.notifyGameOver(
      reason, 
      player
    );
    
    // Save match data only if it's a valid game outcome (not during setup/initialization)      
    this.gameResultHandler.saveMatchResult(
      this.gameStateService.players,
      player,
      this.gameStateService.getDuration(),
      reason,
      this.gameStateService.solidsRemaining,
      this.gameStateService.stripesRemaining
    );
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

    this.endGame(
      GameOverReason.DISCONNECT, 
      player
    );
  }
}
