// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Fixed component imports using lazy loading to avoid circular dependencies
export const routes: Routes = [
  {
    path: 'config',
    loadComponent: () => import('./features/configuration/configuration.component').then(m => m.ConfigComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'service-flow/:serviceCode/:serviceId',
    loadComponent: () => import('./components/service-flow/service-flow.component').then(m => m.ServiceFlowComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
