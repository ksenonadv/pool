import { Ball } from '@shared/socket.types';

export const enum MainProcessMessageType {
  INIT = 'INIT',
  SHOOT = 'SHOOT',
  SET_ACTIVE_PLAYER = 'SET_ACTIVE_PLAYER',
  STOP = 'STOP'
};

export type MainProcessMesssage =
  | { type: MainProcessMessageType.INIT }
  | { type: MainProcessMessageType.SHOOT, payload: { power: number, mouseX: number, mouseY: number } }
  | { type: MainProcessMessageType.STOP };

export const enum WorkerProcessMessageType {
  SYNC_BALLS = 'SYNC_BALLS',
  SYNC_MOVING_BALLS = 'SYNC_MOVING_BALLS',
  DELETE_BALL = 'DELETE_BALL',
  MOVEMENT_START = 'MOVEMENT_START',
  MOVEMENT_END = 'MOVEMENT_END',
  BALL_POCKETED = 'BALL_POCKETED',
  CUE_BALL_POCKETED = 'CUE_BALL_POCKETED',
  GAME_OVER = 'GAME_OVER',
  TURN_CHANGE = 'TURN_CHANGE'
};

export type WorkerProcessMessage = 
  | { type: WorkerProcessMessageType.SYNC_BALLS, payload: Array<Ball> }
  | { type: WorkerProcessMessageType.SYNC_MOVING_BALLS, payload: Array<Ball> }
  | { type: WorkerProcessMessageType.MOVEMENT_START }
  | { type: WorkerProcessMessageType.MOVEMENT_END }
  | { type: WorkerProcessMessageType.BALL_POCKETED, payload: { ballNumber: number }  }
  | { type: WorkerProcessMessageType.CUE_BALL_POCKETED };
