import { Body, Composite, Engine, Events, Vector, World } from "matter-js";
import { createCueBall, createPoolTableEngineEntities } from "./bodies";

import { FRAME_RATE } from "../../config/game.config";
import { parentPort } from 'worker_threads';

import { MainProcessMessageType, MainProcessMesssage, WorkerProcessMessageType } from "src/game/ipc.types";
import { ShootEventData } from "@shared/socket.types";

interface WorkerState {
  engine: Matter.Engine;
  balls: Set<Matter.Body>;
  ballsMoving: boolean;
  shouldPlaceBackCueBall: boolean;
  interval: ReturnType<typeof setInterval> | null;
}

const state: WorkerState = {
  engine: null,
  balls: null,
  ballsMoving: false,
  shouldPlaceBackCueBall: false,
  interval: null
};

parentPort.on('message', (message: MainProcessMesssage) => {
  
  const { type } = message;

  switch (type) {
    case MainProcessMessageType.INIT:
      initializePhysics();
      break;
    case MainProcessMessageType.SHOOT:
      handleShoot(message.payload);
      break;
    case MainProcessMessageType.STOP:
      if (state.interval) {
        clearInterval(state.interval);
        state.interval = null;
      }
      break;
  }
});

function initializePhysics() {

  // Create physics engine with no gravity
  state.engine = Engine.create({
    gravity: {
      x: 0,
      y: 0
    }
  });

  // Create table entities
  const { balls, pockets, walls } = createPoolTableEngineEntities();

  // Add bodies to the world
  Composite.add(
    state.engine.world,
    [
      ...balls,
      ...pockets,
      ...walls
    ]
  );

  // Set up ball collection and other state
  state.balls = new Set(balls);
  state.ballsMoving = false;

  // Set up collision events
  Events.on(
    state.engine, 
    'collisionStart', 
    handleCollision
  );

  // Start the physics loop
  state.interval = setInterval(
    update, 
    1000 / FRAME_RATE
  );
}

function update() {

  // Update physics engine
  Engine.update(
    state.engine,
    1000 / FRAME_RATE
  );

  // Send ball positions to main thread
  parentPort.postMessage({
    type: WorkerProcessMessageType.UPDATE_BALLS,
    payload: Array.from(state.balls).map(
      ball => ({
        no: ball.ballNumber,
        position: {
          x: ball.position.x,
          y: ball.position.y
        },
        angle: ball.angle
      })
    )
  });

  // Check if balls have stopped moving
  if (state.ballsMoving) {
    
    const anyBallMoving = Array.from(state.balls).some(
      ball => Vector.magnitude(ball.velocity) > 0.1
    );

    if (!anyBallMoving) {
      
      state.ballsMoving = false;

      parentPort.postMessage({
        type: WorkerProcessMessageType.MOVEMENT_END
      });

      // The cue ball was pocketed, place it back.
      // on the table ...
      if (state.shouldPlaceBackCueBall) {
        placeBackCueBall();
      }

    }
  }

}

function handleShoot(payload: ShootEventData) {

  const { mouseX, mouseY, power } = payload;

  // If balls are already moving, do nothing
  if (state.ballsMoving) 
    return;
    
  const cueBall = Array.from(state.balls).find(
    ball => ball.ballNumber === 0
  );

  if (!cueBall) 
    return;

  const force = 0.2 * (power / 100);
  const delta = Vector.sub(cueBall.position, { x: mouseX, y: mouseY });
  const norm = Vector.normalise(delta);
  const forceVector = Vector.mult(norm, force);

  Body.applyForce(
    cueBall, 
    cueBall.position, 
    forceVector
  );

  parentPort.postMessage({
    type: WorkerProcessMessageType.MOVEMENT_START
  });

  state.ballsMoving = true;
}

function handleCollision(event: Matter.IEventCollision<Matter.Engine>) {
  
  for (let pair of event.pairs) {
    
    const hasPocket = pair.bodyA.label === 'pocket' || pair.bodyB.label === 'pocket';
    const ballNumber = pair.bodyA.ballNumber ?? pair.bodyB.ballNumber;

    if (ballNumber === undefined || !hasPocket)
      continue;

    const ball = Array.from(state.balls).find(
      ball => ball.ballNumber === ballNumber
    );

    // Cue ball
    if (ballNumber === 0) { 
      
      parentPort.postMessage({
        type: WorkerProcessMessageType.CUE_BALL_POCKETED,
      });    

      removeBall(ball);

      state.shouldPlaceBackCueBall = true;
    } 
    else { // Regular numbered ball
      
      parentPort.postMessage({
        type: WorkerProcessMessageType.BALL_POCKETED,
        payload: {
          ballNumber
        }
      });

      removeBall(ball);
    }
  }
}

function placeBackCueBall() {

  const ball = createCueBall();

  Composite.add(
    state.engine.world,
    ball
  );

  state.balls.add(
    ball
  );

 state.shouldPlaceBackCueBall = false;
}

function removeBall(ball: Body) {
  
  World.remove(
    state.engine.world,
    ball
  );

  state.balls.delete(
    ball
  );
}