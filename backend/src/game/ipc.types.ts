import { Ball, SyncGuideLineData } from '@shared/socket.types';

export const enum MainProcessMessageType {
  INIT = 'INIT',
  SHOOT = 'SHOOT',
  STOP = 'STOP',
  COMPUTE_GUIDE_LINE = 'COMPUTE_GUIDE_LINE'
};

export type MainProcessMesssage =
  | { type: MainProcessMessageType.INIT }
  | { type: MainProcessMessageType.SHOOT, payload: { power: number, mouseX: number, mouseY: number } }
  | { type: MainProcessMessageType.STOP }
  | { type: MainProcessMessageType.COMPUTE_GUIDE_LINE, payload: { mouseX: number; mouseY: number } };

export const enum WorkerProcessMessageType {
  SYNC_BALLS = 'SYNC_BALLS',
  SYNC_MOVING_BALLS = 'SYNC_MOVING_BALLS',
  DELETE_BALL = 'DELETE_BALL',
  MOVEMENT_START = 'MOVEMENT_START',
  MOVEMENT_END = 'MOVEMENT_END',
  BALL_POCKETED = 'BALL_POCKETED',
  CUE_BALL_POCKETED = 'CUE_BALL_POCKETED',
  PLAY_SOUND = 'PLAY_SOUND',
  SYNC_GUIDE_LINE = 'SYNC_GUIDE_LINE',
};

export type WorkerProcessMessage = 
  | { type: WorkerProcessMessageType.SYNC_BALLS, payload: Array<Ball> }
  | { type: WorkerProcessMessageType.SYNC_MOVING_BALLS, payload: Array<Ball> }
  | { type: WorkerProcessMessageType.MOVEMENT_START }
  | { type: WorkerProcessMessageType.MOVEMENT_END }
  | { type: WorkerProcessMessageType.BALL_POCKETED, payload: { ballNumber: number }  }
  | { type: WorkerProcessMessageType.CUE_BALL_POCKETED }
  | { type: WorkerProcessMessageType.PLAY_SOUND, payload: { sound: string } }
  | { type: WorkerProcessMessageType.SYNC_GUIDE_LINE, payload: SyncGuideLineData };
