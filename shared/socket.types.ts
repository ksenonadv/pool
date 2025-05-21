/**
 * Socket events types enum
 */

import { BallGroup } from "./game.types";

export enum SocketEvent {

  JOIN = 'join', // Join event. (Used by client to authenticate)

  SET_CONNECTION_STATE = 'set-connection-state', // Set connection state event. (Used by server to notify client of connection state changes)
  
  SERVER_GAME_EVENT = 'game-event', // Game event. (Used by server to notify client of game events)
  CLIENT_GAME_EVENT = 'client-game-event', // Client game event. (Used by client to notify server of game events)

  CHAT_MESSAGE = 'chat-message', // Chat message event. (Used for both sending and receiving messages)
};

export enum ClientGameEvent {
  SHOOT = 'shoot',
  SYNC_CUE = 'sync-cue',
}

export type ClientGameEventData = {
  event: ClientGameEvent;
  data: ShootEventData | SyncCueEventData;
};

export enum ServerEvent {
  SET_PLAYERS = 'set-players-data',
  SET_CAN_SHOOT = 'set-can-shoot',
  BALLS_SYNC = 'full-balls-sync',
  MOVING_BALLS_SYNC = 'moving-balls-sync',
  SYNC_CUE = 'sync-cue',
  MOVEMENT_START = 'movement-start',
  MOVEMENT_END = 'movement-end',
  SET_BALL_GROUP = 'set-ball-group',
  GAME_OVER = 'game-over',
  BALL_POCKETED = 'ball-pocketed',
  CUE_BALL_POCKETED = 'cue-ball-pocketed',
  PLAY_SOUND = 'play-sound',
};

export type ServerGameEventData = {
  event: ServerEvent;
  data: SetPlayersEventData | Array<Ball> | boolean | SyncCueEventData | string | SetBallGroupEventData | undefined | BallPocketedEventData | GameOverEventData;
};

export const enum ConnectionStateEventData {
  InWaitingRoom,
  InGame
};

export type ChatMessage = {
  name: string;
  text: string;
  date: Date;
};

export type ShootEventData = SyncCueEventData;

export type SyncCueEventData = {
  mouseX: number;
  mouseY: number;
  power: number;
};

export type Ball = {
  no: number;
  position: {
    x: number;
    y: number;
  };
  angle: number;
};

export type SetPlayersEventData = Array<{
  userId: string;
  name: string;
  avatar: string;
  cue: string;
  group?: BallGroup;
}>;

export type SetBallGroupEventData = Record<string, BallGroup>;

export type BallPocketedEventData = {
  ball: number;
  group: BallGroup;
};

export const enum GameOverReason {
  DISCONNECT = 'timeout',
  FAULT = 'fault',
  WIN = 'win'
};

export type NameAndAvatar = {
  name: string;
  avatar: string;
};

export type GameOverEventData = {
  reason: GameOverReason;
  player: NameAndAvatar;
  duration?: number;
};