// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    // First check if the app is configured
    if (!this.configService.isConfigured()) {
      console.log('🔄 App not configured, redirecting to config page');
      this.router.navigate(['/config']);
      return false;
    }

    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // Check if token is expiring soon and refresh if needed
      if (this.authService.isTokenExpiringSoon()) {
        console.log('🔄 Token expiring soon, attempting refresh');
        return this.authService.refreshToken().pipe(
          map(() => {
            console.log('✅ Token refreshed successfully');
            return true;
          }),
          catchError((error) => {
            console.error('❌ Token refresh failed:', error);
            this.authService.logout();
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: state.url }
            });
            return of(false);
          })
        );
      }

      console.log('✅ User is authenticated');
      return true;
    }

    // User is not authenticated, redirect to login
    console.log('❌ User not authenticated, redirecting to login');
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // If user is already authenticated, redirect to home
    if (this.authService.isAuthenticated()) {
      console.log('✅ User already authenticated, redirecting to home');
      this.router.navigate(['/home']);
      return false;
    }

    // User is not authenticated, allow access to login/config pages
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ConfigGuard implements CanActivate {

  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // Always allow access to config page
    // But if already configured and trying to access other routes,
    // this guard can provide logic for that
    return true;
  }
}
