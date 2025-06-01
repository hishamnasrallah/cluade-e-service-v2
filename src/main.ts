// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

console.log('🚀 Starting Angular application...');

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('✅ Angular application started successfully');
  })
  .catch((err) => {
    console.error('❌ Application bootstrap failed:', err);
  });
