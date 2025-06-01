// src/app/app.config.ts - Add missing providers
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/config.service';
import { ApiService } from './services/api.service';
import { FormValidationService } from './services/form-validation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // HTTP Client with interceptors
    provideHttpClient(withInterceptorsFromDi()),

    // Animations for Material UI
    provideAnimations(),

    // Services
    AuthService,
    ConfigService,
    ApiService,
    FormValidationService,

    // Auth interceptor for JWT tokens
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
