import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cue } from '../entities/cue.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { CueService } from '../services/cue.service';
import { CueController } from '../controllers/cue.controller';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cue, User, PlayerStats]),
  ],
  controllers: [CueController],
  providers: [CueService],
  exports: [CueService]
})
export class CueModule {}
