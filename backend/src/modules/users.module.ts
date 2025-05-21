import { Module } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Cue } from '../entities/cue.entity';
import { UserController } from 'src/controllers/user.controller';

@Module({  imports: [
    TypeOrmModule.forFeature([User, Cue]),
  ],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
