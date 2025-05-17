import { ChatMessage, ClientGameEvent, ClientGameEventData, ConnectionStateEventData, ServerEvent, ShootEventData, SocketEvent } from "@shared/socket.types";
import { Body, Composite, Engine, Events, Vector, World } from "matter-js";
import { Socket } from "socket.io";
import { createPoolTableEngineEntities } from "./helpers";
import { CUE_BALL_POSITION_X, CUE_BALL_POSITION_Y, FRAME_RATE } from "./config/constants/pool.constants";

export type GamePlayer = { 
  name: string;
  avatar: string;
  userId: string;
  socket: Socket;
};

export class Game {

  public readonly id: string = crypto.randomUUID();

  private readonly engine: Matter.Engine = Engine.create({
    gravity: {
      x: 0,
      y: 0
    }
  });

  private balls: Set<Matter.Body>;
  private interval: ReturnType<typeof setInterval> | null = null;

  private activePlayer: GamePlayer;
  private ballsMoving: boolean = false;
  private currentPlayerPocketedBalls: boolean = false;

  private get otherPlayer() {
    return this.players.find(
      player => player.userId != this.activePlayer.userId
    )!;
  }

  constructor(
    private readonly players: [GamePlayer, GamePlayer]
  ) 
  { 

    const { balls, pockets, walls } = createPoolTableEngineEntities();

    Composite.add(
      this.engine.world,
      [
        ...balls,
        ...pockets,
        ...walls
      ]
    );

    this.balls = new Set(balls);
    this.interval = setInterval(
      this.update.bind(this), 
      1000 / FRAME_RATE
    );

    Events.on(
      this.engine, 
      'collisionStart', 
      this.handleCollision.bind(this)
    );

    this.broadcast(
      SocketEvent.SET_CONNECTION_STATE,
      ConnectionStateEventData.InGame
    );

    this.setTurn(
      this.players[Math.random() > 0.5 ? 1 : 0]
    );
  }

  private update() {
    
    Engine.update(
      this.engine,
      1000 / FRAME_RATE
    );

    this.broadcast(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.UPDATE_BALLS,
        data: Array.from(this.balls).map(
          ball => ({
            no: ball.ballNumber,
            position: {
              x: ball.position.x,
              y: ball.position.y
            },
            angle: ball.angle
          })
        )
      }
    );

    if (this.ballsMoving) {

      const anyBallMoving = Array.from(this.balls).some(
        ball => Vector.magnitude(ball.velocity) > 0.1
      );

      if (!anyBallMoving) {
        this.ballsMoving = false;

        this.broadcast(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.MOVEMENT_END,
            data: undefined
          }
        );

        // Check if the current player pocketed any balls.
        // If not, set the turn to the other player.
        if (!this.currentPlayerPocketedBalls) {
          this.setTurn(
            this.otherPlayer
          );
        }
      }
    }

  }

  private setTurn(
    player: GamePlayer
  ) 
  { 
    
    this.activePlayer = player;
    this.currentPlayerPocketedBalls = false;

    this.activePlayer.socket.emit(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_CAN_SHOOT,
        data: true
      }
    );

    this.sendMessage(
      `It is your turn.`,
      player.socket
    );

    const other = this.otherPlayer;

    this.sendMessage(
      `It is ${player.name}'s turn.`,
      other.socket
    );

    other.socket.emit(
      SocketEvent.SERVER_GAME_EVENT,
      {
        event: ServerEvent.SET_CAN_SHOOT,
        data: false
      }
    );
  }

  public processEvent(
    sender: Socket,
    event: ClientGameEventData['event'],
    payload: ClientGameEventData['data']
  ) {
    
    // Check if the sender is the active player
    if (this.activePlayer.socket.id !== sender.id)
      return;

    switch (event) {
      case ClientGameEvent.SHOOT: {

        // Balls are moving, so we can't shoot.
        // We're probably waiting for a shoot to finish.

        if (this.ballsMoving)
          return;

        const { power, mouseX, mouseY } = payload as ShootEventData;

        const cueBall = Array.from(this.balls).find(
          ball => ball.ballNumber === 0
        );

        const force = 0.2 * (power / 100);
        const delta = Vector.sub(cueBall.position, { x: mouseX, y: mouseY });
        const norm = Vector.normalise(delta);
        const forceVector = Vector.mult(norm, force);

        Body.applyForce(
          cueBall, 
          cueBall.position, 
          forceVector
        );

        this.broadcast(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.MOVEMENT_START,
            data: undefined
          }
        );

        this.ballsMoving = true;
        break;  
      }
      case ClientGameEvent.SYNC_CUE: {
        this.otherPlayer.socket.emit(
          SocketEvent.SERVER_GAME_EVENT,
          {
            event: ServerEvent.SYNC_CUE,
            data: payload
          }
        );
        break;
      }
    }
  }

  private handleCollision(
    event: Matter.IEventCollision<Matter.Engine>
  ) 
  {
  
    for (let pair of event.pairs) {

      const hasPocket = pair.bodyA.label === 'pocket' || pair.bodyB.label === 'pocket';
      const ballNumber = pair.bodyA.ballNumber ?? pair.bodyB.ballNumber;

      if (ballNumber === undefined || !hasPocket)
        continue;

      const ball = Array.from(this.balls).find(
        ball => ball.ballNumber === ballNumber
      );

      if (ballNumber === 0) {

        this.sendMessage(
          `The cue ball has been pocketed!`
        );

        this.setTurn(
          this.otherPlayer
        );

        this.placeBackCueBall(
          ball
        );

      } else {

        this.sendMessage(
          `Ball ${ballNumber} has been pocketed!`
        );

        this.removeBall(
          ball
        );

        this.currentPlayerPocketedBalls = true;
      }
    }

  }

  private placeBackCueBall(ball: Body) {
    
    Body.setPosition(
      ball,
      {
        x: CUE_BALL_POSITION_X,
        y: CUE_BALL_POSITION_Y
      }
    );

    Body.setVelocity(
      ball,
      {
        x: 0,
        y: 0
      }
    );

    Body.setAngularVelocity(
      ball,
      0
    );

    Body.setAngle(
      ball,
      0
    );
  }

  private removeBall(ball: Body) {
    
    World.remove(
      this.engine.world,
      ball
    );

    this.balls.delete(
      ball
    );
  }
  
  private broadcast(
    event: SocketEvent,
    payload?: any
  ) 
  {
    this.players.forEach(player => {
      player.socket.emit(
        event,
        payload
      );
    });
  }

  private sendMessage(
    message: string,
    client?: Socket
  ) 
  {
    if (client) {
      client.emit(
        SocketEvent.CHAT_MESSAGE,
        {
          name: 'System',
          text: message,
          date: new Date()
        } as ChatMessage
      );
    } else {
      this.broadcast(
        SocketEvent.CHAT_MESSAGE,
        {
          name: 'System',
          text: message,
          date: new Date()
        } as ChatMessage
      );
    }
  }

}