// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard, ConfigGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Configuration route - accessible without authentication but with config guard
  {
    path: 'config',
    loadComponent: () => {
      return import('./features/configuration/configuration.component').then(m => {
        return m.ConfigComponent;
      });
    },
    canActivate: [ConfigGuard]
  },

  // Login route - accessible without authentication but with guest guard
  {
    path: 'login',
    loadComponent: () => {
      return import('./features/auth/login/login.component').then(m => {
        return m.LoginComponent;
      });
    },
    canActivate: [GuestGuard]
  },

  // Home route - requires authentication
  {
    path: 'home',
    loadComponent: () => {
      return import('./features/home/home.component').then(m => {
        return m.HomeComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Services route - requires authentication
  {
    path: 'services',
    loadComponent: () => {
      return import('./features/services/services.component').then(m => {
        return m.ServicesComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Service wizard route - requires authentication
  // Supports both new applications and continuing existing ones via query params
  {
    path: 'service-flow/:serviceCode/:serviceId',
    loadComponent: () => {
      return import('./features/services/service-wizard/service-wizard.component').then(m => {
        return m.ServiceWizardComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Alternative continue route - more intuitive URL structure
  // This route redirects to the service-flow route with proper query params
  {
    path: 'application/:id/continue',
    redirectTo: '/application/:id',
    pathMatch: 'full'
  },

  // Application detail route - requires authentication
  {
    path: 'application/:id',
    loadComponent: () => {
      return import('./features/applications/application-detail/application-detail.component').then(m => {
        return m.ApplicationDetailComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Default redirect to config (will be handled by AppComponent logic)
  {
    path: '',
    redirectTo: '/config',
    pathMatch: 'full'
  },

  // Wildcard route - redirect to config
  {
    path: '**',
    redirectTo: '/config'
  }
];
