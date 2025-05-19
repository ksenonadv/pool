import { BallGroup } from '@shared/game.types';
import { Socket } from 'socket.io';

/**
 * Interface for a game player
 */
export interface IGamePlayer {
  name: string;
  avatar: string;
  userId: string;
  socket: Socket;
  ballGroup?: BallGroup;
  shotsTaken?: number;
  ballsPocketed?: number;
  fouls?: number;
};