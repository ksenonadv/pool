const express = require("express");
const Matter = require("matter-js");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

const cors = require("cors");
require('dotenv').config();

app.use(cors());
app.use(express.static("public"));

const frameRate = 1000 / 60;
const canvas = { width: 800, height: 400 };
const wallThickness = 50;

const engine = Matter.Engine.create();
engine.gravity.y = 0;

const padding = 20;

const walls = [
  // Top wall
  Matter.Bodies.rectangle(canvas.width / 2, padding - wallThickness / 2, canvas.width - padding * 2, wallThickness, {
    isStatic: true
  }),
  // Bottom wall
  Matter.Bodies.rectangle(canvas.width / 2, canvas.height - padding + wallThickness / 2, canvas.width - padding * 2, wallThickness, {
    isStatic: true
  }),
  // Left wall
  Matter.Bodies.rectangle(padding - wallThickness / 2, canvas.height / 2, wallThickness, canvas.height - padding * 2, {
    isStatic: true
  }),
  // Right wall
  Matter.Bodies.rectangle(canvas.width - padding + wallThickness / 2, canvas.height / 2, wallThickness, canvas.height - padding * 2, {
    isStatic: true
  })
];

const ballsArray = [];

const ballRadius = 20;
const spacing = ballRadius * 2;
const rackOriginX = canvas.width * 0.35;
const rackOriginY = canvas.height / 2;

// Pool ball arrangement (standard 8-ball rack)
// First row: 1 at the apex
// Second row: 9, 14
// Third row: 2, 8, 10
// Fourth row: 7, 3, 11, 15
// Fifth row: 6, 5, 13, 4, 12

const ballNumbers = [
  [1],                      // apex
  [9, 14],                  // second row
  [2, 8, 10],               // third row
  [7, 3, 11, 15],           // fourth row 
  [6, 5, 13, 4, 12]         // fifth row
];

for (let row = 0; row < 5; row++) {
  const rowBalls = ballNumbers[row];
  const numBalls = rowBalls.length;
  const yOffset = (numBalls - 1) * spacing / 2;

  for (let col = 0; col < numBalls; col++) {
    
    const x = rackOriginX - row * spacing * Math.cos(Math.PI / 6); // cos(30°)
    const y = rackOriginY - yOffset + col * spacing;
    const ballNumber = rowBalls[col];

    ballsArray.push(Matter.Bodies.circle(
      x, y,
      ballRadius,
      {
        label: `ball_${ballNumber}`,
        ballNumber: ballNumber,
        restitution: 0.8,
        friction: 0,
        frictionAir: 0.02,
      }
    ));
  }
}

const cueX = canvas.width * 0.75;
const cueY = canvas.height / 2;

const cueBall = Matter.Bodies.circle(
  cueX, cueY,
  ballRadius,
  {
    label: 'cue_ball',
    ballNumber: 0,
    restitution: 0.8,
    friction: 0,
    frictionAir: 0.02,
  }
);

ballsArray.push(
  cueBall
);

const pockets = [
  Matter.Bodies.circle(padding, padding, ballRadius * 1.15, { isStatic: true, label: 'pocket' }),
  Matter.Bodies.circle(canvas.width - padding, padding, ballRadius * 1.15, { isStatic: true, label: 'pocket' }),
  Matter.Bodies.circle(padding, canvas.height - padding, ballRadius * 1.15, { isStatic: true, label: 'pocket' }),
  Matter.Bodies.circle(canvas.width - padding, canvas.height - padding, ballRadius * 1.15, { isStatic: true, label: 'pocket' }),
];

Matter.Composite.add(engine.world, [...ballsArray, ...walls, ...pockets]);

setInterval(() => {
  
  Matter.Engine.update(
    engine, 
    frameRate
  );

  io.emit(
    'balls_update', 
    ballsArray.map(b => ({
      no: b.ballNumber,
      position: b.position,
      angle: b.angle
    }))
  );

  io.emit(
    'can_shoot', 
    {
      canShoot: !isAnyBallMoving()
    }
  );

}, frameRate);

Matter.Events.on(engine, 'collisionStart', (event) => {

  const pairs = event.pairs;

  pairs.forEach((pair) => {
    
    if (pair.bodyA.ballNumber !== undefined && pair.bodyB.label === 'pocket') {
      
      console.log(`Ball ${pair.bodyA.ballNumber} pocketed!`);
      
      if (pair.bodyA.ballNumber === 0) {
        Matter.Body.setPosition(cueBall, {
          x: cueX,
          y: cueY
        });

        Matter.Body.setVelocity(cueBall, {
          x: 0,
          y: 0
        });

        Matter.Body.setAngularVelocity(cueBall, 0);
      } else {

        Matter.World.remove(engine.world, pair.bodyA);

        const index = ballsArray.findIndex(b => b.id === pair.bodyA.id);

        if (index !== -1) {
          ballsArray.splice(
            index, 
            1
          );
        }
      }
    }
  });

});

const isAnyBallMoving = () => ballsArray.some((ball) => {
  const velocity = ball.velocity;
  const speedSquared = velocity.x * velocity.x + velocity.y * velocity.y;
  return speedSquared > 0.01;
});


io.on("connection", (socket) => {
  
  socket.on("joined", () => {
    socket.emit('setup_canvas', {
      width: canvas.width,
      height: canvas.height,
    });
  });

  socket.on("click", ({ coordonates, power }) => {

    if (isAnyBallMoving())
      return;

    const force = 0.2 * (power / 100);
    const delta = Matter.Vector.sub(cueBall.position, coordonates);
    const norm = Matter.Vector.normalise(delta);
    const forceVector = Matter.Vector.mult(norm, force);

    Matter.Body.applyForce(cueBall, cueBall.position, forceVector);
  });
});



server.listen(process.env.PORT, () => {
  console.log(`server listening on ${process.env.PORT}`);
});