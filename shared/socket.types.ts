/**
 * Socket event types used for communication between the client and server.
 * Defines the event channels used in the WebSocket communication.
 */

import { BallGroup } from "./game.types";

export enum SocketEvent {
  /** Join event used by client to authenticate */
  JOIN = 'join',

  /** Set connection state event used by server to notify client of connection state changes */
  SET_CONNECTION_STATE = 'set-connection-state',
  
  /** Game event used by server to notify client of game events */
  SERVER_GAME_EVENT = 'game-event',
  
  /** Client game event used by client to notify server of game events */
  CLIENT_GAME_EVENT = 'client-game-event',

  /** Chat message event used for both sending and receiving messages */
  CHAT_MESSAGE = 'chat-message',
};

/**
 * Client-initiated game events that can be sent to the server.
 */
export enum ClientGameEvent {
  /** Event for taking a shot */
  SHOOT = 'shoot',
  
  /** Event for updating cue position */
  SYNC_CUE = 'sync-cue',
}

/**
 * Data structure for client game events.
 */
export type ClientGameEventData = {
  /** The type of client event */
  event: ClientGameEvent;
  
  /** The data associated with the event */
  data: ShootEventData | SyncCueEventData;
};

/**
 * Server-initiated game events that can be sent to the client.
 */
export enum ServerEvent {
  /** Updates the players in the game */
  SET_PLAYERS = 'set-players-data',
  
  /** Sets whether the current player can shoot */
  SET_CAN_SHOOT = 'set-can-shoot',
  
  /** Provides a full sync of all ball positions */
  BALLS_SYNC = 'full-balls-sync',
  
  /** Updates only the moving balls positions */
  MOVING_BALLS_SYNC = 'moving-balls-sync',
  
  /** Syncs the cue position */
  SYNC_CUE = 'sync-cue',
  
  /** Indicates ball movement has started */
  MOVEMENT_START = 'movement-start',
  
  /** Indicates ball movement has ended */
  MOVEMENT_END = 'movement-end',
  
  /** Sets which ball group (stripes/solids) belongs to which player */
  SET_BALL_GROUP = 'set-ball-group',
  
  /** Indicates the game is over */
  GAME_OVER = 'game-over',
  
  /** Indicates a ball has been pocketed */
  BALL_POCKETED = 'ball-pocketed',
  
  /** Indicates the cue ball has been pocketed */
  CUE_BALL_POCKETED = 'cue-ball-pocketed',
  
  /** Triggers a sound effect */
  PLAY_SOUND = 'play-sound',

  /** Sync guide line segments data */
  SYNC_GUIDE_LINE = 'sync-guide-line',
};

/**
 * Data structure for server game events.
 */
export type ServerGameEventData = {
  /** The type of server event */
  event: ServerEvent;
  
  /** The data associated with the event */
  data: SetPlayersEventData | Array<Ball> | boolean | SyncCueEventData | string | SetBallGroupEventData | undefined | BallPocketedEventData | GameOverEventData;
};

/**
 * Connection state values that can be sent from the server.
 */
export const enum ConnectionStateEventData {
  /** Player is in the waiting room */
  InWaitingRoom,
  
  /** Player is in an active game */
  InGame
};

/**
 * Chat message structure for in-game communication.
 */
export type ChatMessage = {
  /** The name of the player sending the message */
  name: string;
  
  /** The content of the message */
  text: string;
  
  /** The timestamp when the message was sent */
  date: Date;
};

/**
 * Data structure for a shooting event.
 * Alias for SyncCueEventData since both use the same data structure.
 */
export type ShootEventData = SyncCueEventData;

/**
 * Data structure for cue position and power.
 */
export type SyncCueEventData = {
  /** X coordinate of the mouse position */
  mouseX: number;
  
  /** Y coordinate of the mouse position */
  mouseY: number;
  
  /** Power level of the shot (0-1) */
  power: number;
};

export type SyncGuideLineData = Array<{

  /** Start coordonate of the line */
  from: { x: number; y: number };

  /** End coordonate of the line */
  to: { x: number; y: number };

  ball?: boolean;
}>;

/**
 * Data structure for a ball on the pool table.
 */
export type Ball = {
  /** Ball number (0 = cue ball, 1-7 = solids, 8 = eight ball, 9-15 = stripes) */
  no: number;
  
  /** Position coordinates on the table */
  position: {
    x: number;
    y: number;
  };
  
  /** Rotation angle of the ball */
  angle: number;
};

/**
 * Array of player data for the current game.
 */
export type SetPlayersEventData = Array<{
  /** Unique identifier of the player */
  userId: string;
  
  /** Display name of the player */
  name: string;
  
  /** URL to the player's avatar image */
  avatar: string;
  
  /** ID of the cue equipment the player is using */
  cue: string;
  
  /** Ball group assigned to the player (stripes or solids) */
  group?: BallGroup;
}>;

/**
 * Mapping of player IDs to their assigned ball groups.
 */
export type SetBallGroupEventData = Record<string, BallGroup>;

/**
 * Data structure for a ball that has been pocketed.
 */
export type BallPocketedEventData = {
  /** The number of the ball that was pocketed */
  ball: number;
  
  /** The group the ball belongs to (stripes or solids) */
  group: BallGroup;
};

/**
 * Reasons why a game might end.
 */
export const enum GameOverReason {
  /** Player disconnected or timed out */
  DISCONNECT = 'timeout',
  
  /** Player committed a game-ending fault (like pocketing the 8-ball early) */
  FAULT = 'fault',
  
  /** Player won by legally pocketing all their balls and the 8-ball */
  WIN = 'win'
};

/**
 * Basic player information structure.
 */
export type NameAndAvatar = {
  /** Display name of the player */
  name: string;
  
  /** URL to the player's avatar image */
  avatar: string;
};

/**
 * Data structure for game over event.
 */
export type GameOverEventData = {
  /** The reason why the game ended */
  reason: GameOverReason;
  
  /** Information about the player who won or caused the game to end */
  player: NameAndAvatar;
  
  /** Duration of the game in seconds (optional) */
  duration?: number;
};