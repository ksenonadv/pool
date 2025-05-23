import { Body, Composite, Engine, Events, Pair, Query, Vector, World } from "matter-js";
import { parentPort } from 'worker_threads';
import { createCueBall, createPoolTableEngineEntities } from "./bodies";
import { BALL_RADIUS, FRAME_RATE, TABLE_HEIGHT, TABLE_WIDTH } from "../../config/game.config";
import { MainProcessMessageType, WorkerProcessMessageType } from "src/game/ipc.types";
import { ShootEventData, SyncGuideLineData } from "@shared/socket.types";
import { MessageHandler, SupportsMessages } from "./message-handlers";
import { raycast } from "./guide-line";

type CollisionExtended = Matter.Collision & {
  body: Body
};

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
      WorkerProcessMessageType.SYNC_BALLS,
      Array.from(this.balls)
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

    this.sendMessage(WorkerProcessMessageType.PLAY_SOUND, {
      sound: 'shoot'
    });
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

  @MessageHandler<Partial<ShootEventData>>(MainProcessMessageType.COMPUTE_GUIDE_LINE)
  private computeGuideLine(payload: Partial<ShootEventData>): void {
    
    const cue_ball = Array.from(this.balls).find(ball => ball.ballNumber === 0);
    
    if (!cue_ball) 
      return;

    const mouse = Vector.create(
      payload.mouseX,
      payload.mouseY
    );

    const direction = Vector.normalise(Vector.sub(mouse, cue_ball.position));

    const maxBounces = 2;
    const ray_length = Math.max(TABLE_WIDTH, TABLE_HEIGHT) * 2;

    const bodies = this.engine.world.bodies.filter(body =>
      body != cue_ball
    );

    const segments: SyncGuideLineData = [];

    const trace = (start: Matter.Vector, dir: Matter.Vector, bouncesLeft: number) => {
      
      if (bouncesLeft < 1)
        return;

      const data = raycast(
        bodies, 
        start, 
        dir, 
        ray_length
      );
      
      if (!data) {
        return segments.push({
          from: start,
          to: Vector.add(
            start, Vector.mult(dir, ray_length))
        });
      }
      
      segments.push({
        from: start,
        to: data.point
      });

      // End if we hit a pocket.
      if (data.body.label == 'pocket')
        return;

      if (data.body.label == 'wall') {
        
        // Offset the start point slightly along the reflected direction to avoid immediate self-collision
        const reflected = Vector.sub(dir, Vector.mult(
          data.normal, 
          2 * Vector.dot(dir, data.normal)
        ));

        const offset = Vector.mult(reflected, 2);
        const start = Vector.add(data.point, offset);

        return trace(
          start, 
          reflected, 
          bouncesLeft - 1
        );
      }

      // Draw where the ball would go.

      const ball_travel = Vector.mult(
        Vector.mult(data.normal, -1), 
        BALL_RADIUS
      );

      return segments.push({
        from: data.body.position,
        to: Vector.add(
          data.body.position, 
          ball_travel
        ),
        ball: true
      });
    
    };

    trace(
      cue_ball.position, 
      direction, 
      maxBounces
    );

    this.sendMessage(WorkerProcessMessageType.SYNC_GUIDE_LINE, segments);
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
        WorkerProcessMessageType.SYNC_MOVING_BALLS,
        movingBalls,
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
    return Vector.magnitude(ball.velocity) > 0.01;
  }

  /**
   * Handle collisions between balls and pockets
   */
  private handleCollision(event: Matter.IEventCollision<Matter.Engine>): void {
    
    for (const pair of event.pairs) {
      this.handleBallsCollision(pair);
      this.handlePocketCollision(pair);
      this.handleWallCollision(pair);
    }
  }

  private handlePocketCollision(pair: Pair): void {
    
    const hasPocket = pair.bodyA.label === 'pocket' || pair.bodyB.label === 'pocket';
    const ballNumber = pair.bodyA.ballNumber ?? pair.bodyB.ballNumber;

    if (ballNumber === undefined || !hasPocket) 
      return;

    const ball = pair.bodyA.ballNumber !== undefined ? pair.bodyA : pair.bodyB;
    
    this.sendMessage(WorkerProcessMessageType.PLAY_SOUND, {
      sound: 'pocket'
    });

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

  private handleBallsCollision(pair: Pair): void {

    if (pair.bodyA.ballNumber === undefined || pair.bodyB.ballNumber === undefined)
      return;
    
    this.sendMessage(WorkerProcessMessageType.PLAY_SOUND, {
      sound: 'collision'
    });
  }

  private handleWallCollision(pair: Pair): void {

    if (
      pair.bodyA.label === 'wall' && pair.bodyB.ballNumber !== undefined ||
      pair.bodyB.label === 'wall' && pair.bodyA.ballNumber !== undefined
    ) {
      this.sendMessage(WorkerProcessMessageType.PLAY_SOUND, {
        sound: 'collision'
      });
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

    this.sendBallPositions(
      WorkerProcessMessageType.SYNC_BALLS, // Sync all balls again
      Array.from(this.balls)
    );
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
  private sendBallPositions(type: WorkerProcessMessageType.SYNC_BALLS | WorkerProcessMessageType.SYNC_MOVING_BALLS, balls: Array<Body>): void {
    this.sendMessage(type, balls.map(ball => ({
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