import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ConnectionState } from 'src/app/interfaces/connection-state';
import { GAME_IMAGES_ASSETS } from './assets';
import { BallGroup, MIN_POWER } from '@shared/game.types';
import { PoolService } from 'src/app/services/pool.service';
import { Ball, BallPocketedEventData, ClientGameEvent, GameOverEventData, ServerEvent, ServerGameEventData, SetBallGroupEventData, SetPlayersEventData, SocketEvent, SyncCueEventData } from '@shared/socket.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SharedModule } from 'src/app/modules/shared.module';
import { UserService } from 'src/app/services/user.service';
import { PlayersComponent } from './players/players.component';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { GameOverDialogComponent } from './game-over-dialog/game-over-dialog.component';
import { BALL_SIZE, CUE_SIZE, TABLE_PADDING } from '../table.constants';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  imports: [SharedModule, PlayersComponent]
})
export class GameComponent implements OnInit, OnChanges {

  private readonly userService: UserService = inject(UserService);
  private readonly service: PoolService = inject(PoolService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly dialogService: DialogService = inject(DialogService);

  @Input()
  public state: ConnectionState = ConnectionState.Disconnected;
  public ConnectionState = ConnectionState;

  @ViewChild('canvasRef', { static: true }) 
  public canvas: ElementRef<HTMLCanvasElement> = undefined!;

  private ctx: CanvasRenderingContext2D | null = null!;
  private assets: Record<string, HTMLImageElement> | undefined = undefined;

  private readonly interval: ReturnType<typeof setInterval> | null = setInterval(
    this.draw.bind(this), 
    1000 / 60
  );

  // Game variables.
  private mouseX: number = 0;
  private mouseY: number = 0;

  private balls: Array<Ball> = [];

  public canShoot: boolean = false;
  private ballsMoving: boolean = false;

  private cueData: SyncCueEventData | undefined = undefined;

  public players: SetPlayersEventData = [];

  public userId: string = undefined!;

  public stripesPocketed: Array<number> = [];
  public solidsPocketed: Array<number> = [];

  private checkAnotherTabTime: number = 0;

  ngOnInit(): void {
    
    this.canvas.nativeElement.width = 800;
    this.canvas.nativeElement.height = 400;

    this.assets = Object.entries(GAME_IMAGES_ASSETS).reduce((acc, [key, value]) => {
      const img = new Image();
      img.src = value;
      acc[key] = img;
      return acc;
    }, {} as Record<string, HTMLImageElement>);
    
    this.ctx = this.canvas.nativeElement.getContext(
      '2d'
    );

    this.userService.user$.subscribe((user) => {

      if (!user)
        return;

      this.userId = user.userId;
    });

    this.service.fromEvent<ServerGameEventData, SocketEvent.SERVER_GAME_EVENT>(SocketEvent.SERVER_GAME_EVENT).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {

      const { event, data: payload } = data;

      switch (event) {
        case ServerEvent.SET_PLAYERS: {
          this.players = payload as SetPlayersEventData;
          break;
        }
        case ServerEvent.SET_BALL_GROUP: {
          
          for (let [userId, group] of Object.entries(payload as SetBallGroupEventData)) {
            
            const player = this.players.find((player) => player.userId === userId);

            if (player) {
              player.group = group;
            }
          }

          this.cdr.detectChanges();
          break;
        }
        case ServerEvent.UPDATE_BALLS: {
          this.balls = payload as Array<Ball>;
          break;
        }
        case ServerEvent.SET_CAN_SHOOT: {
          this.canShoot = payload as boolean;
          this.cdr.detectChanges();
          break;
        }
        case ServerEvent.SYNC_CUE: {
          this.cueData = payload as SyncCueEventData;
          break;
        }
        case ServerEvent.MOVEMENT_START: {
          this.ballsMoving = true;
          break;
        }
        case ServerEvent.MOVEMENT_END: {
          this.ballsMoving = false;
          break;
        }
        case ServerEvent.BALL_POCKETED: {

          const { ball, group } = payload as BallPocketedEventData;

          if (group == BallGroup.STRIPES) {
            this.stripesPocketed.push(
              ball
            );
          } else if (group == BallGroup.SOLIDS) {
            this.solidsPocketed.push(
              ball
            );
          }

          break;
        }        
        
        case ServerEvent.GAME_OVER: {

          this.dialogService.open(
            GameOverDialogComponent,
            {              
              data: payload,
              modal: true
            }
          );

          this.router.navigate(['/']);
          break;
        }
      }

    });
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(
        this.interval
      );
    }
  }

  private draw() {
    
    if (this.ctx == null)
      return;

    this.ctx.clearRect(
      0, 0, 
      this.canvas.nativeElement.width, 
      this.canvas.nativeElement.height
    );

    this.ctx.drawImage(
      this.assets!['table'],
      0, 0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );

    if (this.state != ConnectionState.InGame)
      return;

    for (let ball of this.balls) {

      const { no, position, angle } = ball;
      const img = this.assets![
        `ball_${no}`
      ];

      this.ctx!.save();

      this.ctx!.translate(position.x, position.y);
      this.ctx!.rotate(angle);
      
      this.ctx!.drawImage(
        img,
        -BALL_SIZE / 2,
        -BALL_SIZE / 2,
        BALL_SIZE,
        BALL_SIZE
      );

      this.ctx!.restore();
    } 

    const cue_ball = this.balls.find((ball) => ball.no === 0);

    if (cue_ball) {
      this.updateLocalCueData(cue_ball);
      this.drawCue(cue_ball);
    }
  }

  public onClick(): void {

    if (!this.canShoot || this.ballsMoving || !this.cueData || !this.cueData.power)
      return;

    this.service.sendGameEvent(
      ClientGameEvent.SHOOT,
      {
        power: this.cueData!.power,
        mouseX: this.cueData!.mouseX,
        mouseY: this.cueData!.mouseY
      }
    );
  }

  public onMouseMove(event: MouseEvent): void {

    if (!this.canShoot || this.ballsMoving)
      return;

    this.mouseX = event.offsetX;
    this.mouseY = event.offsetY;
  }

  private updateLocalCueData(cue_ball: Ball): void {

    if (!this.canShoot || this.ballsMoving)
      return;

    const { position } = cue_ball;

    const power = Math.sqrt(
      Math.pow(this.mouseX - position.x, 2) +
      Math.pow(this.mouseY - position.y, 2)
    ) / 2;

    this.cueData = {
      power: Math.min(Math.max(power, MIN_POWER), 100),
      mouseX: this.mouseX,
      mouseY: this.mouseY
    };

    this.service.sendGameEvent(
      ClientGameEvent.SYNC_CUE,
      this.cueData
    );
  }

  private drawCue(cue_ball: Ball): void {

    if (!cue_ball || !this.cueData || this.ballsMoving)
      return;

    const img = this.assets!['cue'];
    const { position } = cue_ball;

    // Calculate angle from cue ball to mouse, then reverse it by adding Math.PI
    const angle = Math.atan2(this.cueData!.mouseY - position.y, this.cueData!.mouseX - position.x) + Math.PI;

    // Padding is still based on power, but now cue is drawn in the opposite direction
    const padding = TABLE_PADDING + (this.cueData.power / 100 * 35);

    this.ctx!.save();
    this.ctx!.translate(position.x, position.y); // Move origin to cue ball center
    this.ctx!.rotate(angle); // Rotate around cue ball

    this.ctx!.drawImage(
      img,
      padding,
      -CUE_SIZE / 2,
      CUE_SIZE,
      CUE_SIZE
    );

    this.ctx!.restore();
  }

  public ngOnChanges(changes: SimpleChanges): void {

    if (changes['state'] && changes['state'].currentValue == ConnectionState.Connected) {
      this.checkAnotherTabTime = Date.now();
    }
  }

  public showConnectedInAnotherTab(): boolean {
    
    if (this.state != ConnectionState.Connected)
      return false;

    const diff = Date.now() - this.checkAnotherTabTime;
    return diff > 2500;
  }

}
