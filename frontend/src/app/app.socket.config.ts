import { inject } from '@angular/core';
import { SocketIoConfig, provideSocketIo, Socket, SOCKET_CONFIG_TOKEN } from 'ngx-socket-io';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

export const provideSocket = [
    provideSocketIo({
        url: `${environment.apiUrl}/pool`,
        options: {
            autoConnect: false,
            auth: {
                token: localStorage.getItem('access_token')
            }
        }
    } as SocketIoConfig),
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