// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for login requests
    if (req.url.includes('/auth/login/') || req.url.includes('/auth/token/refresh/')) {
      return next.handle(req);
    }

    // Add auth token to request
    const authReq = this.addTokenToRequest(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors with token refresh
        if (error.status === 401 && !this.isRefreshing) {
          return this.handle401Error(authReq, next);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Add JWT token to request headers
   */
  private addTokenToRequest(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();

    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return request;
  }

  /**
   * Handle 401 errors by trying to refresh the token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      const refreshToken = this.authService.getRefreshToken();

      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap(() => {
            this.isRefreshing = false;
            // Retry the original request with new token
            const newAuthReq = this.addTokenToRequest(request);
            return next.handle(newAuthReq);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            // Refresh failed, redirect to login
            this.authService.logout();
            this.router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      } else {
        // No refresh token, redirect to login
        this.isRefreshing = false;
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => new Error('No refresh token available'));
      }
    }

    // If already refreshing, just fail the request
    return throwError(() => new Error('Token refresh in progress'));
  }
}
