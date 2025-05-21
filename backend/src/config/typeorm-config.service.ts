import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { MatchPlayer } from '../entities/match-player.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { Cue } from '../entities/cue.entity';

/**
 * Service that configures TypeORM for the application.
 * 
 * Provides database connection options based on environment variables.
 * Implements TypeOrmOptionsFactory to integrate with NestJS's TypeORM module.
 */
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  /**
   * Creates TypeORM configuration options.
   * 
   * Reads database connection parameters from environment variables with defaults.
   * Registers all entity classes used in the application.
   * Enables schema synchronization for development.
   * 
   * @returns TypeORM configuration options
   */
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_NAME', 'pool'),
      entities: [User, Match, MatchPlayer, PlayerStats, Cue],
      synchronize: true,
      logging: false
    };
  }
}
