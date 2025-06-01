// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../services/auth.service';
import { ConfigService } from '../../../services/config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  template: `
    <div class="login-container">
      <div class="login-background">
        <div class="background-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>

      <mat-card class="login-card">
        <mat-card-header class="card-header">
          <div class="header-content">
            <mat-icon class="app-logo">account_circle</mat-icon>
            <div>
              <mat-card-title>Welcome Back</mat-card-title>
              <mat-card-subtitle>Sign in to your low-code platform</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content class="card-content">
          <!-- Backend URL Display -->
          @if (backendUrl) {
            <div class="backend-info">
              <mat-icon class="backend-icon">link</mat-icon>
              <div class="backend-details">
                <span class="backend-label">Backend Server:</span>
                <span class="backend-url">{{ backendUrl }}</span>
              </div>
              <button mat-icon-button
                      matTooltip="Change backend configuration"
                      (click)="goToConfig()"
                      class="config-btn">
                <mat-icon>settings</mat-icon>
              </button>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput
                     formControlName="username"
                     placeholder="Enter your username"
                     autocomplete="username"
                     [class.shake]="loginError">
              <mat-icon matSuffix>person</mat-icon>
              @if (loginForm.get('username')?.hasError('required')) {
                <mat-error>Username is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput
                     [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password"
                     placeholder="Enter your password"
                     autocomplete="current-password"
                     [class.shake]="loginError">
              <button mat-icon-button
                      matSuffix
                      (click)="hidePassword = !hidePassword"
                      type="button"
                      matTooltip="{{ hidePassword ? 'Show' : 'Hide' }} password">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
              @if (loginForm.get('password')?.hasError('minlength')) {
                <mat-error>Password must be at least 6 characters long</mat-error>
              }
            </mat-form-field>

            <!-- Remember Me -->
            <div class="form-options">
              <mat-checkbox formControlName="rememberMe" class="remember-checkbox">
                Remember me
              </mat-checkbox>
            </div>

            <!-- Login Error Message -->
            @if (loginError) {
              <div class="error-message">
                <mat-icon class="error-icon">error</mat-icon>
                <span>{{ loginError }}</span>
              </div>
            }
          </form>
        </mat-card-content>

        <mat-card-actions class="card-actions">
          <button mat-raised-button
                  color="primary"
                  (click)="onLogin()"
                  [disabled]="!loginForm.valid || isLoading"
                  class="login-button">
            @if (isLoading) {
              <mat-spinner diameter="20" class="spinner"></mat-spinner>
            } @else {
              <mat-icon>login</mat-icon>
            }
            <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
          </button>

          <div class="additional-actions">
            <button mat-button
                    (click)="goToConfig()"
                    class="config-link">
              <mat-icon>settings</mat-icon>
              Backend Configuration
            </button>
          </div>
        </mat-card-actions>
      </mat-card>

      <!-- Quick Demo Info -->
      @if (showDemoInfo) {
        <mat-card class="demo-card">
          <mat-card-content>
            <div class="demo-content">
              <mat-icon class="demo-icon">info</mat-icon>
              <div>
                <h4>Demo Credentials</h4>
                <p>For testing purposes, you can use:</p>
                <div class="demo-credentials">
                  <strong>Username:</strong> demo<br>
                  <strong>Password:</strong> demo123
                </div>
              </div>
              <button mat-icon-button (click)="showDemoInfo = false">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: -1;
    }

    .background-shapes {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
    }

    .shape-1 {
      width: 200px;
      height: 200px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 300px;
      height: 300px;
      top: 50%;
      right: 10%;
      animation-delay: 2s;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      bottom: 20%;
      left: 20%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px) rotate(0deg);
      }
      50% {
        transform: translateY(-20px) rotate(180deg);
      }
    }

    .login-card {
      width: 100%;
      max-width: 450px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      margin-bottom: 20px;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 20px 20px 0 0;
      padding: 32px 24px;
      text-align: center;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .app-logo {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #495057;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .card-content {
      padding: 32px 24px;
    }

    .backend-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 4px solid #2196f3;
    }

    .backend-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .backend-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .backend-label {
      font-size: 12px;
      color: #1565c0;
      font-weight: 500;
    }

    .backend-url {
      font-size: 14px;
      color: #1976d2;
      word-break: break-all;
    }

    .config-btn {
      color: #1976d2;
      width: 32px;
      height: 32px;
    }

    .login-form {
      width: 100%;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16px 0 24px 0;
    }

    .remember-checkbox {
      color: #495057;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;
      font-size: 14px;
      margin-bottom: 16px;
      border-left: 4px solid #f44336;
      animation: shake 0.5s ease-in-out;
    }

    .error-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .shake {
      animation: shake 0.5s ease-in-out;
    }

    .card-actions {
      padding: 24px;
      background: #f8f9fa;
      border-radius: 0 0 20px 20px;
    }

    .login-button {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      font-size: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .login-button:disabled {
      opacity: 0.7;
      transform: none;
      box-shadow: none;
    }

    .login-button .spinner {
      margin-right: 8px;
    }

    .login-button mat-icon {
      margin-right: 8px;
    }

    .additional-actions {
      text-align: center;
    }

    .config-link {
      color: #6c757d;
      font-size: 14px;
      height: 36px;
    }

    .config-link:hover {
      color: #495057;
      background: rgba(108, 117, 125, 0.1);
    }

    .demo-card {
      width: 100%;
      max-width: 450px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    .demo-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
    }

    .demo-icon {
      color: #2196f3;
      font-size: 24px;
      margin-top: 4px;
    }

    .demo-content h4 {
      margin: 0 0 8px 0;
      color: #495057;
      font-size: 16px;
    }

    .demo-content p {
      margin: 0 0 8px 0;
      color: #6c757d;
      font-size: 14px;
    }

    .demo-credentials {
      font-size: 13px;
      color: #495057;
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #2196f3;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .login-container {
        padding: 10px;
      }

      .login-card {
        margin: 10px;
      }

      .card-header {
        padding: 24px 16px;
      }

      .card-content {
        padding: 24px 16px;
      }

      .card-actions {
        padding: 16px;
      }

      .backend-url {
        font-size: 12px;
      }

      .shape {
        display: none;
      }
    }

    /* Focus and interaction improvements */
    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-text-field-wrapper {
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    ::ng-deep .mat-mdc-form-field-error-wrapper {
      padding-top: 8px;
    }

    /* Custom checkbox styling */
    ::ng-deep .remember-checkbox .mdc-checkbox__background {
      border-radius: 4px;
    }

    ::ng-deep .remember-checkbox .mdc-checkbox--selected .mdc-checkbox__background {
      background-color: #667eea;
      border-color: #667eea;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  loginError = '';
  showDemoInfo = true;
  backendUrl = '';
  returnUrl = '/home';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private configService: ConfigService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    // Check if backend is configured
    if (!this.configService.isConfigured()) {
      this.router.navigate(['/config']);
      return;
    }

    // Get backend URL for display
    this.backendUrl = this.configService.getBaseUrl();

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    // Load saved credentials if remember me was checked
    this.loadSavedCredentials();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      const credentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          // Save credentials if remember me is checked
          if (this.loginForm.value.rememberMe) {
            this.saveCredentials();
          } else {
            this.clearSavedCredentials();
          }

          this.snackBar.open('✅ Login successful! Welcome back.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          // Navigate to return URL or home
          this.router.navigate([this.returnUrl]);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Login error:', error);

          this.loginError = this.getErrorMessage(error);
          this.isLoading = false;

          // Add shake animation to form fields
          this.addShakeAnimation();

          this.snackBar.open('❌ Login failed. Please check your credentials.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  goToConfig(): void {
    this.router.navigate(['/config']);
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    // Handle different HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 401:
          return 'Invalid username or password. Please try again.';
        case 403:
          return 'Access denied. Your account may be suspended.';
        case 404:
          return 'Login service not found. Please check your backend configuration.';
        case 500:
          return 'Server error. Please try again later.';
        case 0:
          return 'Unable to connect to server. Please check your internet connection.';
        default:
          return `Login failed with error ${error.status}. Please try again.`;
      }
    }

    return 'Login failed. Please try again.';
  }

  private addShakeAnimation(): void {
    // Clear any existing error after animation
    setTimeout(() => {
      this.loginError = '';
    }, 3000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }

  private saveCredentials(): void {
    const credentials = {
      username: this.loginForm.value.username,
      rememberMe: true
    };
    localStorage.setItem('loginCredentials', JSON.stringify(credentials));
  }

  private loadSavedCredentials(): void {
    const saved = localStorage.getItem('loginCredentials');
    if (saved) {
      try {
        const credentials = JSON.parse(saved);
        if (credentials.rememberMe) {
          this.loginForm.patchValue({
            username: credentials.username,
            rememberMe: true
          });
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
        this.clearSavedCredentials();
      }
    }
  }

  private clearSavedCredentials(): void {
    localStorage.removeItem('loginCredentials');
  }
}
