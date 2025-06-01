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
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

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
    MatTooltipModule,
    ErrorMessageComponent,
    LoadingComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
        error: (error: any) => {
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
