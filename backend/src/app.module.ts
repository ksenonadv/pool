import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersModule } from './modules/users.module';
import { AuthModule } from './modules/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolModule } from './modules/pool.module';
import { TypeOrmConfigService } from './config/typeorm-config.service';

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
    PoolModule
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
