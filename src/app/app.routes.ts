// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

console.log('📍 Loading application routes...');

export const routes: Routes = [
  // Configuration route - accessible without authentication
  {
    path: 'config',
    loadComponent: () => {
      console.log('🔧 Loading configuration component...');
      return import('./features/configuration/configuration.component').then(m => {
        console.log('✅ Configuration component loaded');
        return m.ConfigComponent;
      });
    }
  },

  // Login route - accessible without authentication
  {
    path: 'login',
    loadComponent: () => {
      console.log('🔐 Loading login component...');
      return import('./features/auth/login/login.component').then(m => {
        console.log('✅ Login component loaded');
        return m.LoginComponent;
      });
    }
  },

  // Home route - requires authentication
  {
    path: 'home',
    loadComponent: () => {
      console.log('🏠 Loading home component...');
      return import('./features/home/home.component').then(m => {
        console.log('✅ Home component loaded');
        return m.HomeComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Services route - requires authentication
  {
    path: 'services',
    loadComponent: () => {
      console.log('🛠️ Loading services component...');
      return import('./features/services/services.component').then(m => {
        console.log('✅ Services component loaded');
        return m.ServicesComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Service wizard route - requires authentication
  {
    path: 'service-flow/:serviceCode/:serviceId',
    loadComponent: () => {
      console.log('📋 Loading service wizard component...');
      return import('./features/services/service-wizard/service-wizard.component').then(m => {
        console.log('✅ Service wizard component loaded');
        return m.ServiceWizardComponent;
      });
    },
    canActivate: [AuthGuard]
  },

  // Application detail route - requires authentication
  {
    path: 'application/:id',
    loadComponent: () => {
      console.log('📄 Loading application detail component...');
      return import('./features/applications/application-detail/application-detail.component').then(m => {
        console.log('✅ Application detail component loaded');
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

console.log('✅ Application routes configured:', routes.length, 'routes');
