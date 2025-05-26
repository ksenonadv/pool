import { Injectable } from '@angular/core';
import { MIN_POWER } from '@shared/game.types';
import { Ball, SyncCueEventData, SyncGuideLineData } from '@shared/socket.types';
import { BALL_SIZE, CUE_SIZE, TABLE_PADDING } from '../constants/table.constants';
import { GAME_IMAGES_ASSETS } from '../constants/assets.constants';

@Injectable()
export class PoolRendererService {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private assets: Record<string, HTMLImageElement> = {};
  private renderLoop: ReturnType<typeof setInterval> | null = null;
  
  private mouseX: number = 0;
  private mouseY: number = 0;

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    // Initialize assets
    this.assets = Object.entries(GAME_IMAGES_ASSETS).reduce((acc, [key, value]) => {
      const img = new Image();
      img.src = value;
      acc[key] = img;
      return acc;
    }, {} as Record<string, HTMLImageElement>);
    
    // Set up canvas dimensions
    this.canvas.width = 800;
    this.canvas.height = 400;
  }

  startRenderLoop(renderCallback: () => void): void {
    if (this.renderLoop) {
      this.stopRenderLoop();
    }
    
    this.renderLoop = setInterval(renderCallback, 1000 / 60);
  }

  stopRenderLoop(): void {
    if (this.renderLoop) {
      clearInterval(this.renderLoop);
      this.renderLoop = null;
    }
  }

  render(balls: Ball[], cueData: SyncCueEventData & { cue: string } | undefined, guideLineData: SyncGuideLineData | undefined, ballsMoving: boolean): void {
    
    if (!this.ctx || !this.canvas) 
      return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw table
    this.drawTable();
    
    // Draw balls
    for (const ball of balls) {
      this.drawBall(ball);
    }
    
    // Draw cue if not moving
    const cueBall = balls.find(ball => ball.no === 0);
    if (cueBall && cueData && !ballsMoving) {
      this.drawCue(cueBall, cueData);
    }

    if (guideLineData && !ballsMoving) {
      guideLineData.forEach(segment => {
        
        this.ctx!.beginPath();
        this.ctx!.moveTo(segment.from.x, segment.from.y);
        this.ctx!.lineTo(segment.to.x, segment.to.y);

        this.ctx!.strokeStyle = segment.ball ? 'rgba(0, 255, 0, 0.75)' : 'rgba(255, 255, 255, 0.5)';

        this.ctx!.lineWidth = 2;
        this.ctx!.stroke();
        this.ctx!.closePath();
      });
    }

  }
  
  private drawTable(): void {
    if (!this.ctx || !this.canvas || !this.assets['table']) return;
    
    this.ctx.drawImage(
      this.assets['table'],
      0, 0,
      this.canvas.width,
      this.canvas.height
    );
  }
  
  private drawBall(ball: Ball): void {
    if (!this.ctx || !this.assets[`ball_${ball.no}`]) return;
    
    const { no, position, angle } = ball;
    const img = this.assets[`ball_${no}`];
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(angle);
    
    this.ctx.drawImage(
      img,
      -BALL_SIZE / 2,
      -BALL_SIZE / 2,
      BALL_SIZE,
      BALL_SIZE
    );
    
    this.ctx.restore();
  }
  
  private drawCue(cueBall: Ball, cueData: SyncCueEventData & { cue: string }): void {
    
    if (!this.ctx || !this.assets[cueData.cue]) return;
    
    const img = this.assets[cueData.cue];
    const { position } = cueBall;
    
    // Calculate angle from cue ball to mouse position
    const angle = Math.atan2(cueData.mouseY - position.y, cueData.mouseX - position.x) + Math.PI;
    
    // Padding is based on power
    const padding = TABLE_PADDING + (cueData.power / 100 * 35);
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y); // Move origin to cue ball center
    this.ctx.rotate(angle); // Rotate around cue ball
    
    this.ctx.drawImage(
      img,
      padding,
      -CUE_SIZE / 2,
      CUE_SIZE,
      CUE_SIZE
    );
    
    this.ctx.restore();
  }
  
  // Mouse handling
  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }
  
  getMousePosition(): { x: number, y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }
  
  // Helper methods for the component
  calculateCueData(cueBall: Ball): SyncCueEventData {
    const { position } = cueBall;
    
    const power = Math.sqrt(
      Math.pow(this.mouseX - position.x, 2) +
      Math.pow(this.mouseY - position.y, 2)
    ) / 2;
    
    return {
      power: Math.min(Math.max(power, MIN_POWER), 100),
      mouseX: this.mouseX,
      mouseY: this.mouseY
    };
  }
  
  cleanup(): void {
    this.stopRenderLoop();
    this.ctx = null;
    this.canvas = null;
    this.assets = {};
  }
}
