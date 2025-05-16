import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    canActivate: [GuestGuard],
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    canActivate: [GuestGuard],
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) 
  },
  {
    path: 'play',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/play/play.component').then(m => m.PlayComponent),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'discord-callback',
    loadComponent: () => import('./components/auth/callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: '**',
    redirectTo: '/play',
    pathMatch: 'full',
  }
];
