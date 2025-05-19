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

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  imports: [SharedModule, PlayersComponent],
  providers: [PoolRendererService, GameStateService]
})
export class GameComponent implements OnInit, OnDestroy {
  
  private readonly userService = inject(UserService);
  private readonly gameState = inject(GameStateService);
  private readonly renderer = inject(PoolRendererService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  @Input()
  public state: ConnectionState = ConnectionState.Disconnected;
  public ConnectionState = ConnectionState;

  @ViewChild('canvasRef', { static: true }) 
  public canvas: ElementRef<HTMLCanvasElement> = undefined!;

  public canShoot: boolean = false;
  public players: SetPlayersEventData = [];
  public userId: string = undefined!;
  public stripesPocketed: Array<number> = [];
  public solidsPocketed: Array<number> = [];

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
      .subscribe(this.handleGameOver.bind(this));
  }

  ngOnDestroy(): void {
    this.renderer.cleanup();
    this.gameState.cleanup();
  }

  private draw(): void {
    if (this.state !== ConnectionState.InGame) {
      this.renderer.render([], undefined, false);
      return;
    }
    
    this.renderer.render(
      this.gameState.balls,
      this.gameState.cueData,
      this.gameState.ballsMoving
    );
  }

  public onClick(): void {
    if (this.gameState.cueData) {
      this.gameState.shoot(this.gameState.cueData);
    }
  }

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
}
