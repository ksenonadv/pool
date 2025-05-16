import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PoolGateway } from 'src/gateways/pool.gateway';
import { UsersModule } from './users.module';

@Module({
    imports: [
        JwtModule.register({}),
        UsersModule
    ],
    providers: [PoolGateway]
})
export class PoolModule { }