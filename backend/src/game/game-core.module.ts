import { Module } from '@nestjs/common';
import { GameStateService } from './services/game-state.service';
import { CommunicationService } from './services/communication.service';
import { PhysicsService } from './services/physics.service';
import { RulesService } from './services/rules.service';
import { GameStateManagerService } from './services/game-state-manager.service';
import { GameFactoryService } from './services/game-factory.service';
import { GameResultHandlerService } from './services/game-result-handler.service';
import { StatsModule } from 'src/modules/stats.module';

@Module({
  imports: [StatsModule],
  providers: [
    GameStateService,
    CommunicationService,
    PhysicsService,
    RulesService,
    GameStateManagerService,
    GameFactoryService,
    GameResultHandlerService
  ],
  exports: [
    GameStateService,
    CommunicationService,
    PhysicsService,
    RulesService,
    GameStateManagerService,
    GameFactoryService,
    GameResultHandlerService
  ]
})
export class GameCoreModule {}
