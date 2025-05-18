import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PoolGateway } from 'src/app.gateway';
import { UsersModule } from './users.module';
import { SocketService } from 'src/services/socket.service';

@Module({
    imports: [
        JwtModule.register({}),
        UsersModule
    ],
    providers: [
        PoolGateway, 
        SocketService
    ]
})
export class PoolModule { }