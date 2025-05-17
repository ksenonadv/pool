
import { BallGroup } from "./game.types";

// Messages sent from main thread to worker
export type MainToWorkerMessage =
  | { type: 'INIT' }
  | { type: 'SHOOT', payload: { power: number, mouseX: number, mouseY: number } }
  | { type: 'SET_ACTIVE_PLAYER', payload: { userId: string } }
  | { type: 'STOP' };

// Messages sent from worker to main thread
type BallState = {
  no: number;
  position: { x: number; y: number };
  angle: number;
};

export type WorkerToMainMessage =
  | { type: 'UPDATE_BALLS', payload: BallState[] }
  | { type: 'MOVEMENT_START' }
  | { type: 'MOVEMENT_END' }
  | { type: 'BALL_POCKETED', payload: { ballNumber: number; playerId: string; message: string } }
  | { type: 'CUE_BALL_POCKETED', message: string }
  | { type: 'GAME_OVER', payload: { winnerId: string | null; message: string } }
  | { type: 'TURN_CHANGE', payload: { playerId: string | null } };
