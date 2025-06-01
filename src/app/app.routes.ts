// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

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
    // Updated route to accept both service CODE and service ID
    // :serviceCode - for the service flow API (e.g., "01", "03", "05")
    // :serviceId - for case submission (numeric ID like 9, 46, 51)
    path: 'service-flow/:serviceCode/:serviceId',
    loadComponent: () => import('./features/services/service-wizard/service-wizard.component').then(m => m.ServiceWizardComponent),
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
