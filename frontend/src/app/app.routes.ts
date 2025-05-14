import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'play',
    loadComponent: () => import('./play/play.component').then(m => m.PlayComponent),
  },
  {
    path: '**',
    redirectTo: '/play',
    pathMatch: 'full',
  }
];
