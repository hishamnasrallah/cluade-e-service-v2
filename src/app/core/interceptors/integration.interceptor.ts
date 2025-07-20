// src/app/core/interceptors/integration.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class IntegrationInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept integration API calls
    if (!request.url.includes('/integrations/') && !request.url.includes('/api/')) {
      return next.handle(request);
    }

    console.log('🔗 Integration Interceptor: Processing request:', request.url);

    return next.handle(request).pipe(
      retry(1), // Retry once on failure
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Integration API Error:', error);

        let errorMessage = 'Integration failed';

        if (error.status === 0) {
          errorMessage = 'Unable to connect to integration service';
        } else if (error.status === 404) {
          errorMessage = 'Integration endpoint not found';
        } else if (error.status === 401) {
          errorMessage = 'Integration authentication failed';
        } else if (error.status === 500) {
          errorMessage = 'Integration server error';
        }

        // Show error message
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });

        return throwError(() => error);
      })
    );
  }
}
