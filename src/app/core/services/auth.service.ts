// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
    this.checkAuthStatus();
  }

  /**
   * Login user with username and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    const baseUrl = this.configService.getBaseUrl();

    if (!baseUrl) {
      throw new Error('Base URL not configured');
    }

    return this.http.post<LoginResponse>(`${baseUrl}/auth/login/`, credentials)
      .pipe(
        tap(response => {
          this.storeTokens(response.access, response.refresh);
          this.isAuthenticatedSubject.next(true);
          console.log('✅ Login successful, tokens stored');
        }),
        catchError(error => {
          console.error('❌ Login failed:', error);
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
    console.log('✅ User logged out, tokens cleared');
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.log('⚠️ Access token expired');
      return false;
    }

    return true;
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    const baseUrl = this.configService.getBaseUrl();

    if (!refreshToken || !baseUrl) {
      throw new Error('No refresh token or base URL available');
    }

    return this.http.post<LoginResponse>(`${baseUrl}/auth/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        this.storeTokens(response.access, response.refresh);
        console.log('✅ Token refreshed successfully');
      }),
      catchError(error => {
        console.error('❌ Token refresh failed:', error);
        this.logout(); // Clear invalid tokens
        throw error;
      })
    );
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check initial authentication status on service initialization
   */
  private checkAuthStatus(): void {
    const isAuth = this.isAuthenticated();
    this.isAuthenticatedSubject.next(isAuth);

    if (!isAuth && this.getRefreshToken()) {
      // Try to refresh token if we have a refresh token but access token is invalid
      this.refreshToken().subscribe({
        next: () => {
          this.isAuthenticatedSubject.next(true);
        },
        error: () => {
          // Refresh failed, user needs to login again
          this.isAuthenticatedSubject.next(false);
        }
      });
    }
  }

  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Get user information from token
   */
  getUserInfo(): any {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.user_id,
        username: payload.username,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.error('Error parsing token for user info:', error);
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
      return payload.exp < fiveMinutesFromNow;
    } catch (error) {
      return false;
    }
  }
}
