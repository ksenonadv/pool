import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import Material from '@primeng/themes/material';

import { SocketIoConfig, provideSocketIo, Socket, SOCKET_CONFIG_TOKEN } from 'ngx-socket-io';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideSocketIo({
      url: 'http://localhost:3000',
    } as SocketIoConfig),
    {
      provide: Socket,
      useFactory: () => {
        const config = inject(SOCKET_CONFIG_TOKEN);
        return new Socket(config);
      }
    },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Material
      }
    }),
    provideRouter(routes)
  ]
};
