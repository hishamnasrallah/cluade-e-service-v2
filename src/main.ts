// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

console.log('🚀 Starting Angular application...');

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    console.log('✅ Angular application started successfully');

    // Remove the initial loading indicator
    setTimeout(() => {
      const loadingIndicator = document.querySelector('.initial-loading');
      if (loadingIndicator) {
        loadingIndicator.remove();
        console.log('🎯 Initial loading indicator removed');
      }
    }, 100);
  })
  .catch((err) => {
    console.error('❌ Application bootstrap failed:', err);

    // Show error message to user
    const loadingIndicator = document.querySelector('.initial-loading');
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `
        <div style="text-align: center; color: #e74c3c;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; margin-bottom: 8px;">Application Failed to Start</div>
          <div style="font-size: 14px; color: #666;">Please refresh the page or contact support</div>
          <div style="font-size: 12px; color: #999; margin-top: 16px;">Error: ${err.message || 'Unknown error'}</div>
        </div>
      `;
    }
  });
