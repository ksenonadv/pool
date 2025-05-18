import { Injectable } from '@nestjs/common';
import { BallGroup } from '@shared/game.types';

/**
 * Interface for a game player
 */
export interface IGamePlayer {
  name: string;
  avatar: string;
  userId: string;
  socket: any; // Using 'any' for Socket to avoid circular dependencies
  ballGroup?: BallGroup;
}
