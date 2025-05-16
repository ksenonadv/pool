import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { first } from 'rxjs/operators';

type Ball = {
  no: number;
  position: { x: number; y: number };
  angle: number; // radians
};

const MIN_POWER = 15;

const GAME_IMAGES_ASSETS = { 
  'table': 'assets/images/game/table.png',
  'ball_0': 'assets/images/game/ball_0.png',
  'ball_1': 'assets/images/game/ball_1.png',
  'ball_2': 'assets/images/game/ball_2.png',
  'ball_3': 'assets/images/game/ball_3.png',
  'ball_4': 'assets/images/game/ball_4.png',
  'ball_5': 'assets/images/game/ball_5.png',
  'ball_6': 'assets/images/game/ball_6.png',
  'ball_7': 'assets/images/game/ball_7.png',
  'ball_8': 'assets/images/game/ball_8.png',
  'ball_9': 'assets/images/game/ball_9.png',
  'ball_10': 'assets/images/game/ball_10.png',
  'ball_11': 'assets/images/game/ball_11.png',
  'ball_12': 'assets/images/game/ball_12.png',
  'ball_13': 'assets/images/game/ball_13.png',
  'ball_14': 'assets/images/game/ball_14.png',
  'ball_15': 'assets/images/game/ball_15.png',
  'cue': 'assets/images/game/cue.png'
};

@Component({
  selector: 'app-play',
  imports: [
    CommonModule
  ],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent {

  constructor(
    private readonly socket: Socket
  ) { }

  @ViewChild('canvasRef', { static: true }) 
  public canvas: ElementRef<HTMLCanvasElement> = undefined!;

  private ctx: CanvasRenderingContext2D | null = null!;

  private assets: Record<string, HTMLImageElement> | undefined = undefined;

  private mouseX: number = 0;
  private mouseY: number = 0;

  private balls: Array<Ball> = [];
  private canShoot: boolean = false;
  public power: number = MIN_POWER;
  public loaded: boolean = false;

  public ngOnInit(): void {

    this.assets = Object.entries(GAME_IMAGES_ASSETS).reduce((acc, [key, value]) => {
      const img = new Image();
      img.src = value;
      acc[key] = img;
      return acc;
    }, {} as Record<string, HTMLImageElement>);
    
    this.ctx = this.canvas.nativeElement.getContext(
      '2d'
    );

    this.socket.fromEvent<{ width: number, height: number }, 'setup_canvas'>('setup_canvas')
      .pipe(first())
      .subscribe(({ width, height }) => {
        this.canvas.nativeElement.width = width;
        this.canvas.nativeElement.height = height;
        this.loaded = true;
      });

    this.socket.fromEvent<{ canShoot: boolean }, 'can_shoot'>('can_shoot').subscribe(({ canShoot }) => {
      this.canShoot = canShoot;
    });

    this.socket.fromEvent<Array<Ball>, 'balls_update'>('balls_update').subscribe((balls) => {
      this.balls = balls;
    });

    this.socket.once('connect', () => {
      this.socket.emit(
        'joined'
      );
    });

    setInterval(() => {

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

      for (let ball of this.balls) {

        const { no, position, angle } = ball;
        const img = this.assets![
          `ball_${no}`
        ];

        const ballSize = 30;

        this.ctx!.save();

        this.ctx!.translate(position.x, position.y);
        this.ctx!.rotate(angle);
        
        this.ctx!.drawImage(
          img,
          -ballSize / 2,
          -ballSize / 2,
          ballSize,
          ballSize
        );
        this.ctx!.restore();


      } 

      if (this.canShoot) {

        const cue_ball = this.balls.find((ball) => ball.no === 0);

        if (cue_ball) {
          this.drawCue(
            cue_ball
          );
        }
      }

    }, 1_000 / 60);

  }

  public onClick(event: MouseEvent): void {

    if (!this.canShoot || !this.power)
      return;

    this.socket.emit('click', {
      coordonates: {
        x: event.offsetX,
        y: event.offsetY
      },
      power: this.power
    });
  }

  public onMouseMove(event: MouseEvent): void {
    this.mouseX = event.offsetX;
    this.mouseY = event.offsetY;
  }

  private drawCue(cue_ball: Ball): void {
    
    if (!cue_ball)
      return;

    const { position } = cue_ball;
    const img = this.assets!['cue'];

    const power = Math.sqrt(
      Math.pow(this.mouseX - position.x, 2) +
      Math.pow(this.mouseY - position.y, 2)
    );

    this.power = Math.min(Math.max(power, MIN_POWER), 100);

    const cueSize = 150; 
    const padding = 25 + (this.power / 100 * 25);

    const cueAngle = Math.atan2(this.mouseY - position.y, this.mouseX - position.x);

    this.ctx!.save();
    this.ctx!.translate(position.x, position.y); // Move origin to cue ball center
    this.ctx!.rotate(cueAngle); // Rotate around cue ball

    this.ctx!.drawImage(
      img,
      padding,                  
      -cueSize / 2,          
      cueSize,           
      cueSize                
    );

    this.ctx!.restore();
  }

}
