import { Body, Composite, Engine, Events, Vector, World } from "matter-js";
import { parentPort } from 'worker_threads';
import { createCueBall, createPoolTableEngineEntities } from "./bodies";
import { FRAME_RATE } from "../../config/game.config";
import { MainProcessMessageType, WorkerProcessMessageType } from "src/game/ipc.types";
import { ShootEventData } from "@shared/socket.types";
import { MessageHandler, SupportsMessages } from "./message-handlers";

@SupportsMessages()
class PoolGameWorker {
  
  private engine: Matter.Engine;
  private balls: Set<Matter.Body>;
  private ballsMoving: boolean = false;
  private shouldPlaceBackCueBall: boolean = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the physics engine and game entities
   */
  @MessageHandler(MainProcessMessageType.INIT)
  private initializePhysics(): void {
    
    this.engine = Engine.create({
      gravity: { 
        x: 0, 
        y: 0 
      }
    });

    const { 
      balls, 
      pockets, 
      walls
     } = createPoolTableEngineEntities();

    Composite.add(this.engine.world, [
      ...balls, 
      ...pockets, 
      ...walls
    ]);

    this.balls = new Set(balls);
    this.ballsMoving = false;

    Events.on(
      this.engine,
      'collisionStart', 
      this.handleCollision.bind(this)
    );

    this.updateInterval = setInterval(
      this.update.bind(this), 
      1000 / FRAME_RATE
    );

    this.sendBallPositions(
      WorkerProcessMessageType.SYNC_BALLS
    );
  }

  /**
   * Handle shoot message from main process
   */
  @MessageHandler<ShootEventData>(MainProcessMessageType.SHOOT)
  private handleShoot(payload: ShootEventData): void {
    
    const { mouseX, mouseY, power } = payload;

    // Don't process shoot if balls are still moving
    if (this.ballsMoving) return;
    
    // Find cue ball
    const cueBall = Array.from(this.balls).find(ball => ball.ballNumber === 0);
    if (!cueBall) return;

    // Calculate force vector
    const force = -0.15 * (power / 100);
    const delta = Vector.sub(cueBall.position, { x: mouseX, y: mouseY });
    const norm = Vector.normalise(delta);
    const forceVector = Vector.mult(norm, force);

    // Apply force to cue ball
    Body.applyForce(cueBall, cueBall.position, forceVector);

    // Notify movement started
    this.sendMessage(WorkerProcessMessageType.MOVEMENT_START);
    this.ballsMoving = true;
  }

  /**
   * Handle stop message from main process
   */
  @MessageHandler(MainProcessMessageType.STOP)
  private stopSimulation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update physics simulation
   */
  private update(): void {
    
    // Update physics engine
    Engine.update(
      this.engine, 
      1000 / FRAME_RATE
    );

    if (!this.ballsMoving)
      return;

    const movingBalls = Array.from(
      this.balls
    ).filter(this.isBallMoving);
    
    if (movingBalls.length > 0) {
      this.sendBallPositions(
        WorkerProcessMessageType.SYNC_MOVING_BALLS
      );
    } 
    
    if (!movingBalls.length) {

      // All balls stopped moving
      this.ballsMoving = false;
      this.sendMessage(WorkerProcessMessageType.MOVEMENT_END);
      
      // Place back cue ball if needed
      if (this.shouldPlaceBackCueBall) {
        this.placeBackCueBall();
      }
    }
  }

  /**
   * Check if a ball is moving
   */
  private isBallMoving(ball: Body): boolean {
    return Vector.magnitude(ball.velocity) > 0.1;
  }

  /**
   * Handle collisions between balls and pockets
   */
  private handleCollision(event: Matter.IEventCollision<Matter.Engine>): void {
    
    for (const pair of event.pairs) {
      
      const hasPocket = pair.bodyA.label === 'pocket' || pair.bodyB.label === 'pocket';
      const ballNumber = pair.bodyA.ballNumber ?? pair.bodyB.ballNumber;

      if (ballNumber === undefined || !hasPocket) 
        continue;

      const ball = Array.from(this.balls).find(ball => ball.ballNumber === ballNumber);
      
      if (ballNumber === 0) {
        // Cue ball pocketed
        this.sendMessage(WorkerProcessMessageType.CUE_BALL_POCKETED);
        this.removeBall(ball);
        this.shouldPlaceBackCueBall = true;
      } else {
        // Regular ball pocketed
        this.sendMessage(WorkerProcessMessageType.BALL_POCKETED, {
          ballNumber
        });
        this.removeBall(ball);
      }
    }
  }

  /**
   * Place cue ball back on table
   */
  private placeBackCueBall(): void {
    const ball = createCueBall();
    Composite.add(this.engine.world, ball);
    this.balls.add(ball);
    this.shouldPlaceBackCueBall = false;
  }

  /**
   * Remove a ball from the table
   */
  private removeBall(ball: Body): void {
    World.remove(this.engine.world, ball);
    this.balls.delete(ball);
  }

  /**
   * Send ball positions to main process
   */
  private sendBallPositions(type: WorkerProcessMessageType.SYNC_BALLS | WorkerProcessMessageType.SYNC_MOVING_BALLS): void {
    this.sendMessage(type, Array.from(this.balls).map(ball => ({
      no: ball.ballNumber,
      position: ball.position,
      angle: ball.angle
    })));
  }

  /**
   * Send a message to the main process
   */
  private sendMessage(type: WorkerProcessMessageType, payload?: any): void {
    parentPort.postMessage({ 
      type, 
      payload 
    });
  }
}

// Initialize worker
new PoolGameWorker();