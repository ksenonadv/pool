import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { MatchPlayer } from '../entities/match-player.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { UsersModule } from './users.module';
import { User } from '../entities/user.entity';
import { StatsService } from 'src/services/stats.service';
import { StatsController } from 'src/controllers/stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchPlayer, PlayerStats, User]),
    UsersModule
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService]
})
export class StatsModule {}
