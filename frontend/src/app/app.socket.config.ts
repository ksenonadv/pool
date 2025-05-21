import { inject, Injectable } from '@angular/core';
import { Socket, SOCKET_CONFIG_TOKEN, SocketIoConfig } from 'ngx-socket-io';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/config.service';

/**
 * Extended Socket implementation specifically for game-related socket communications.
 * Configures the socket connection with authentication tokens.
 */
@Injectable({
    providedIn: 'root'
})
export class GameSocket extends Socket {

    /**
     * Creates a new GameSocket instance with proper configuration.
     * 
     * @param configService - Service providing application configuration
     * @param authService - Service providing authentication functionality
     */
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

/**
 * Factory function for providing a Socket instance to Angular's dependency injection.
 * Sets up a socket that reconnects with updated auth tokens when the user logs in.
 * 
 * @returns A configured Socket instance
 */
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