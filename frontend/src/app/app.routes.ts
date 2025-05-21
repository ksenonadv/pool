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
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
  },  {
    path: 'history',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/match-history/match-history.component').then(m => m.MatchHistoryComponent),
  },  {
    path: 'rankings',
    loadComponent: () => import('./components/rankings/rankings.component').then(m => m.RankingsComponent),
  },
  {
    path: 'cue-shop',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/cue-shop/cue-shop.component').then(m => m.CueShopComponent),
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  }
];
