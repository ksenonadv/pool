import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import Material from '@primeng/themes/material';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { MessageService } from 'primeng/api';
import { provideSocket } from './app.socket.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors(
        [authInterceptor]
      )
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Material
      }
    }),
    provideRouter(routes),
    ...provideSocket,
    MessageService
  ]
};
