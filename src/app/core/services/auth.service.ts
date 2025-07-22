// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { ConfigService } from './config.service';
import { LoginRequest, LoginResponse } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    console.log('🔐 AuthService: Initializing...');
    this.checkAuthStatus();
    console.log('✅ AuthService: Initialized');
  }

  /**
   * Login user with username and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const baseUrl = this.configService.getBaseUrl();

    if (!baseUrl) {
      console.error('❌ AuthService: No base URL configured for login');
      throw new Error('Base URL not configured');
    }

    console.log('🔐 AuthService: Attempting login for user:', credentials.username);

    return this.http.post<LoginResponse>(`${baseUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          this.storeTokens(response.access, response.refresh);
          this.isAuthenticatedSubject.next(true);
          console.log('✅ AuthService: Login successful, tokens stored');
        }),
        catchError(error => {
          console.error('❌ AuthService: Login failed:', error);
          throw error;
        })
      );
  }

  /**
   * Logout user and clear tokens
   */
  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    console.log('✅ AuthService: User logged out, tokens cleared');
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('❌ AuthService: Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ AuthService: Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      console.log('🔍 AuthService: No access token found');
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('⚠️ AuthService: Access token expired');
      return false;
    }

    console.log('✅ AuthService: User is authenticated');
    return true;
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    const baseUrl = this.configService.getBaseUrl();

    if (!refreshToken || !baseUrl) {
      console.error('❌ AuthService: No refresh token or base URL available');
      return of().pipe(
        tap(() => {
          throw new Error('No refresh token or base URL available');
        })
      );
    }

    console.log('🔄 AuthService: Attempting token refresh');

    return this.http.post<LoginResponse>(`${baseUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        this.storeTokens(response.access, response.refresh);
        console.log('✅ AuthService: Token refreshed successfully');
      }),
      catchError(error => {
        console.error('❌ AuthService: Token refresh failed:', error);
        this.logout(); // Clear invalid tokens
        throw error;
      })
    );
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      console.log('💾 AuthService: Tokens stored successfully');
    } catch (error) {
      console.error('❌ AuthService: Failed to store tokens:', error);
    }
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      console.log('🗑️ AuthService: Tokens cleared successfully');
    } catch (error) {
      console.error('❌ AuthService: Failed to clear tokens:', error);
    }
  }

  /**
   * Check initial authentication status on service initialization
   */
  private checkAuthStatus(): void {
    try {
      const isAuth = this.isAuthenticated();
      this.isAuthenticatedSubject.next(isAuth);
      console.log('🔍 AuthService: Initial auth status check:', isAuth ? 'authenticated' : 'not authenticated');

      if (!isAuth && this.getRefreshToken()) {
        console.log('🔄 AuthService: No valid access token but refresh token exists, attempting refresh');
        // Try to refresh token if we have a refresh token but access token is invalid
        this.refreshToken().subscribe({
          next: () => {
            this.isAuthenticatedSubject.next(true);
            console.log('✅ AuthService: Token refreshed during initialization');
          },
          error: (error) => {
            console.log('❌ AuthService: Token refresh failed during initialization:', error.message);
            this.isAuthenticatedSubject.next(false);
          }
        });
      }
    } catch (error) {
      console.error('❌ AuthService: Error during auth status check:', error);
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;

      if (isExpired) {
        console.log('⏰ AuthService: Token expired at:', new Date(payload.exp * 1000));
      }

      return isExpired;
    } catch (error) {
      console.error('❌ AuthService: Error parsing token:', error);
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Get user information from token
   */
  getUserInfo(): any {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        username: decoded.username || decoded.sub,
        userId: decoded.user_id,
        userGroups: decoded.groups || [], // Array of group IDs the user belongs to
        exp: decoded.exp
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + (5 * 60);
      const expiringSoon = payload.exp < fiveMinutesFromNow;

      if (expiringSoon) {
        console.log('⚠️ AuthService: Token expiring soon, expires at:', new Date(payload.exp * 1000));
      }

      return expiringSoon;
    } catch (error) {
      console.error('❌ AuthService: Error checking token expiration:', error);
      return false;
    }
  }
}
