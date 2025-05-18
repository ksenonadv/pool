import { Module } from '@nestjs/common';
import { GameStateService } from './services/game-state.service';
import { CommunicationService } from './services/communication.service';
import { PhysicsService } from './services/physics.service';
import { RulesService } from './services/rules.service';
import { GameStateManagerService } from './services/game-state-manager.service';
import { GameFactoryService } from './services/game-factory.service';

@Module({
  providers: [
    GameStateService,
    CommunicationService,
    PhysicsService,
    RulesService,
    GameStateManagerService,
    GameFactoryService
  ],
  exports: [
    GameStateService,
    CommunicationService,
    PhysicsService,
    RulesService,
    GameStateManagerService,
    GameFactoryService
  ]
})
export class GameCoreModule {}
