import { Injectable } from '@nestjs/common';
import { Game } from '../game';
import { IGamePlayer } from '../interfaces/game-player.interface';
import { GameStateService } from './game-state.service';
import { CommunicationService } from './communication.service';
import { PhysicsService } from './physics.service';
import { RulesService } from './rules.service';
import { GameStateManagerService } from './game-state-manager.service';

/**
 * Factory service for creating game instances with their own isolated services
 */
@Injectable()
export class GameFactoryService {
  /**
   * Creates a new game instance with its own set of services
   * @param players The two players that will participate in the game
   * @returns A new Game instance with isolated services
   */
  createGame(players: [IGamePlayer, IGamePlayer]): Game {
    // Create isolated service instances for this game
    const gameStateService = new GameStateService();
    const communicationService = new CommunicationService(gameStateService);
    const physicsService = new PhysicsService();
    const rulesService = new RulesService(gameStateService, communicationService);
    const gameStateManagerService = new GameStateManagerService(
      gameStateService,
      rulesService,
      physicsService,
      communicationService
    );
    
    // Create and return a new game with these services
    return new Game(
      players,
      gameStateService,
      communicationService,
      physicsService,
      rulesService,
      gameStateManagerService
    );
  }
}
