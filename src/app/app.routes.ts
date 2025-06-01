// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Configuration route - accessible without authentication
  {
    path: 'config',
    loadComponent: () => {
      return import('./features/configuration/configuration.component').then(m => {
        return m.ConfigComponent;
      });
    }
  },

  // Login route - accessible without authentication
  {
    path: 'login',
    loadComponent: () => {
      return import('./features/auth/login/login.component').then(m => {
        return m.LoginComponent;
      });
    }
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
  {
    path: 'service-flow/:serviceCode/:serviceId',
    loadComponent: () => {
      return import('./features/services/service-wizard/service-wizard.component').then(m => {
        return m.ServiceWizardComponent;
      });
    },
    canActivate: [AuthGuard]
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
