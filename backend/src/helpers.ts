import { Bodies } from "matter-js";
import { BALL_NUMBERS, BALL_RADIUS, BALL_SPACING, CUE_BALL_POSITION_X, CUE_BALL_POSITION_Y, RACK_ORIGIN_X, RACK_ORIGIN_Y, TABLE_HEIGHT, TABLE_PADDING, TABLE_WIDTH, WALL_THICKNESS } from "./config/constants/pool.constants";

declare global {
  namespace Matter {
    interface IBodyDefinition {
      ballNumber?: number;
    }

    interface Body {
      ballNumber?: number;
    }
  }
};

function createPoolTableWalls() {
  return [
    Bodies.rectangle(
      TABLE_WIDTH / 2,
      TABLE_PADDING - WALL_THICKNESS / 2,
      TABLE_WIDTH - TABLE_PADDING * 2,
      WALL_THICKNESS,
      {
        isStatic: true
      }
    ),
    Bodies.rectangle(
      TABLE_WIDTH / 2,
      TABLE_HEIGHT - TABLE_PADDING + WALL_THICKNESS / 2,
      TABLE_WIDTH - TABLE_PADDING * 2,
      WALL_THICKNESS,
      {
        isStatic: true
      }
    ),
    Bodies.rectangle(
      TABLE_PADDING - WALL_THICKNESS / 2,
      TABLE_HEIGHT / 2, WALL_THICKNESS,
      TABLE_HEIGHT - TABLE_PADDING * 2,
      {
        isStatic: true
      }
    ),
    Bodies.rectangle(
      TABLE_WIDTH - TABLE_PADDING + WALL_THICKNESS / 2,
      TABLE_HEIGHT / 2, WALL_THICKNESS,
      TABLE_HEIGHT - TABLE_PADDING * 2,
      {
        isStatic: true
      }
    )
  ]
}

function createPoolTablePockets() {
  return [
    Bodies.circle(TABLE_PADDING, TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' }),
    Bodies.circle(TABLE_WIDTH - TABLE_PADDING, TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' }),
    Bodies.circle(TABLE_PADDING, TABLE_HEIGHT - TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' }),
    Bodies.circle(TABLE_WIDTH - TABLE_PADDING, TABLE_HEIGHT - TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' }),
    Bodies.circle(TABLE_WIDTH / 2, TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' }),
    Bodies.circle(TABLE_WIDTH / 2, TABLE_HEIGHT - TABLE_PADDING, BALL_RADIUS * 1.15, { isStatic: true, label: 'pocket' })
  ];
}

export function createPoolTableBalls() {
  
  const balls: Set<Matter.Body> = new Set();

  for (let row = 0; row != BALL_NUMBERS.length; row++) {
    
    const rowBalls = BALL_NUMBERS[row];
    const numBalls = rowBalls.length;
    const yOffset = (numBalls - 1) * BALL_SPACING / 2;

    for (let col = 0; col != numBalls; ++col) {
      
      const x = RACK_ORIGIN_X - row * BALL_SPACING * Math.cos(Math.PI / 6); // cos(30°)
      const y = RACK_ORIGIN_Y - yOffset + col * BALL_SPACING;
      const ballNumber = rowBalls[col];

      balls.add(
        Bodies.circle(
          x, y,
          BALL_RADIUS,
          {
            label: `ball_${ballNumber}`,
            ballNumber,
            restitution: 0.8,
            friction: 0,
            frictionAir: 0.02,
          }
        )
      );
    }
  }

  balls.add(
    Bodies.circle(
      CUE_BALL_POSITION_X,
      CUE_BALL_POSITION_Y,
      BALL_RADIUS,
      {
        label: 'cue_ball',
        ballNumber: 0,
        restitution: 0.8,
        friction: 0,
        frictionAir: 0.02
      }
    )
  );

  return Array.from(
    balls
  );
}

export function createPoolTableEngineEntities() {
  return {
    walls: createPoolTableWalls(),
    pockets: createPoolTablePockets(),
    balls: createPoolTableBalls()
  };
}