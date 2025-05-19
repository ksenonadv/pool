import { inject, Injectable } from '@angular/core';
import { Socket, SOCKET_CONFIG_TOKEN, SocketIoConfig } from 'ngx-socket-io';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/config.service';

@Injectable({
    providedIn: 'root'
})
export class GameSocket extends Socket {

    constructor(
        configService: ConfigService,
        authService: AuthService
    ) 
    {
        super({
            url: configService.socketUrl,
            options: {
                autoConnect: false,
                auth: {
                    token: authService.getAccessToken()!
                }
            }
        } as SocketIoConfig);     
    }
}

export const provideSocket = [
    {
        provide: Socket,
        useFactory: () => {

            const config = inject(SOCKET_CONFIG_TOKEN);
            const socket = new Socket(config);

            const authService = inject(AuthService);
            let oldLoginState: boolean = false;

            authService.isLoggedIn().subscribe((isLoggedIn: boolean) => {
                
                if (oldLoginState == isLoggedIn)
                    return;

                if (!isLoggedIn)
                    return;

                socket.ioSocket.auth = { token: authService.getAccessToken() };                
            });

            return socket;
        }
    }
];