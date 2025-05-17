/**
 * Socket events types enum
 */

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
  SET_CAN_SHOOT = 'set-can-shoot',
  UPDATE_BALLS = 'update-balls',
  SYNC_CUE = 'sync-cue',
  MOVEMENT_START = 'movement-start',
  MOVEMENT_END = 'movement-end',
};

export type ServerGameEventData = {
  event: ServerEvent;
  data: Array<Ball> | boolean | SyncCueEventData;
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