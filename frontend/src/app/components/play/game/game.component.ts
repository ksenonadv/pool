import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { GameOverEventData, SetPlayersEventData } from '@shared/socket.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from 'src/app/modules/shared.module';
import { UserService } from 'src/app/services/user.service';
import { PlayersComponent } from './players/players.component';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { GameOverDialogComponent } from './game-over-dialog/game-over-dialog.component';
import { GameStateService } from 'src/app/services/game-state.service';
import { PoolRendererService } from 'src/app/services/pool-renderer.service';
import { PoolAudioService } from 'src/app/services/pool-audio.service';

/**
 * Main component for the pool game interface.
 * Handles game rendering, player interaction, and game state management.
 * Coordinates communication between game state, renderer, and audio services.
 */
@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  imports: [SharedModule, PlayersComponent],
  providers: [PoolAudioService, PoolRendererService, GameStateService]
})
export class GameComponent implements OnInit, OnDestroy {
  
  private readonly userService = inject(UserService);
  private readonly gameState = inject(GameStateService);
  private readonly renderer = inject(PoolRendererService);
  private readonly audioService = inject(PoolAudioService);

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  /** Current connection state of the game */
  @Input()
  public state: ConnectionState = ConnectionState.Disconnected;
  public ConnectionState = ConnectionState;

  /** Reference to the canvas element for rendering the pool table */
  @ViewChild('canvasRef', { static: true }) 
  public canvas: ElementRef<HTMLCanvasElement> = undefined!;

  /** Whether the current player can shoot */
  public canShoot: boolean = false;
  
  /** Array of players in the current game */
  public players: SetPlayersEventData = [];
  
  /** Current user's ID */
  public userId: string = undefined!;
  
  /** Array of striped balls that have been pocketed */
  public stripesPocketed: Array<number> = [];
  
  /** Array of solid balls that have been pocketed */
  public solidsPocketed: Array<number> = [];

  /** Whether game audio is muted */
  public isMuted: boolean = false;

  /** Reference to the active player */
  private activePlayer: SetPlayersEventData[0] = undefined!;

  /**
   * Initializes the game component, sets up the renderer, and subscribes to game state updates.
   */
  ngOnInit(): void {
    
    // Initialize renderer
    this.renderer.initialize(
      this.canvas.nativeElement
    );
    
    this.renderer.startRenderLoop(this.draw.bind(
      this
    ));
    
    // Get user ID
    this.userService.user$.subscribe(user => {
      if (user) {
        this.userId = user.userId;
      }
    });
    
    // Subscribe to game state updates
    this.gameState.players$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(players => {
        this.players = players;
        this.cdr.detectChanges();
      });

    this.gameState.canShoot$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(canShoot => {
        this.canShoot = canShoot;
        this.activePlayer = this.players.find(player => canShoot ? player.userId === this.userId : player.userId !== this.userId)!;
        this.cdr.detectChanges();
      });
      
    this.gameState.stripesPocketed$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(balls => {
        this.stripesPocketed = balls;
        this.cdr.detectChanges();
      });
      
    this.gameState.solidsPocketed$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(balls => {
        this.solidsPocketed = balls;
        this.cdr.detectChanges();
      });
    
    this.gameState.gameOver$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.handleGameOver.bind(
        this
      ));

    this.audioService.isMuted$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isMuted => {
        this.isMuted = isMuted;
        this.cdr.detectChanges();
      });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.renderer.cleanup();
    this.gameState.cleanup();
  }

  /**
   * Draws the current game state to the canvas.
   * Called on each animation frame by the renderer service.
   */
  private draw(): void {
    if (this.state !== ConnectionState.InGame) {
      this.renderer.render([], undefined, undefined, false);
      return;
    }
    
    this.renderer.render(
      this.gameState.balls,
      { 
        ... this.gameState.cueData!, 
        cue: this.activePlayer.cue 
      },
      this.gameState.guideLineData!,
      this.gameState.ballsMoving
    );
  }

  /**
   * Handles click events on the canvas to shoot the cue ball.
   */
  public onClick(): void {
    if (this.gameState.cueData) {
      this.gameState.shoot(this.gameState.cueData);
    }
  }

  /**
   * Handles mouse movement to update the cue position.
   * 
   * @param event - The mouse movement event
   */
  public onMouseMove(event: MouseEvent): void {
    if (!this.gameState.canShoot || this.gameState.ballsMoving) {
      return;
    }
    
    this.renderer.setMousePosition(event.offsetX, event.offsetY);
    
    // Update cue position based on mouse
    const cueBall = this.gameState.balls.find(ball => ball.no === 0);
    if (cueBall) {
      const cueData = this.renderer.calculateCueData(cueBall);
      this.gameState.syncCue(cueData);
    }
  }

  /**
   * Handles the game over event by showing the game over dialog and redirecting to the home page.
   * 
   * @param data - Game over event data including winner information
   */
  private handleGameOver(data: GameOverEventData): void {
    this.dialogService.open(
      GameOverDialogComponent,
      {
        data,
        modal: true
      }
    );
    
    this.router.navigate(['/']);
  }

  /**
   * Toggles audio mute state.
   */
  public toggleMute(): void {
    this.audioService.toggleMute();
  }
}
