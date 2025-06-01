// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

// Import Material modules that need to be provided globally
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Services
import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';
import { ApiService } from './core/services/api.service';
import { FormValidationService } from './core/services/form-validation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router
    provideRouter(routes),

    // HTTP Client with interceptors
    provideHttpClient(withInterceptorsFromDi()),

    // Animations for Material UI
    provideAnimations(),

    // Import Material modules globally
    importProvidersFrom(MatSnackBarModule),

    // Core Services
    AuthService,
    ConfigService,
    ApiService,
    FormValidationService,

    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
