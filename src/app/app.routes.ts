import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'lobby', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'lobby',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'game/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/game/game.component').then(m => m.GameComponent),
  },
];
