import { Module } from '@nestjs/common';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';

import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { GameModule } from './modules/game.module';
import { StatsModule } from './modules/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: '.env' 
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    UsersModule,
    AuthModule,
    GameModule,
    StatsModule
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
