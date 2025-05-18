import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameGateway } from 'src/app.gateway';
import { UsersModule } from './users.module';
import { GameService } from 'src/services/game.service';
import { GameCoreModule } from 'src/game/game-core.module';
import { StatsModule } from './stats.module';

@Module({
    imports: [
        JwtModule.register({}),
        UsersModule,
        GameCoreModule,
        StatsModule
    ],
    providers: [
        GameGateway, 
        GameService
    ]
})
export class GameModule { }