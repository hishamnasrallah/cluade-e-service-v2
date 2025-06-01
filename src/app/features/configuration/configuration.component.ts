// src/app/features/configuration/configuration.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule, // ✅ Added CommonModule
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="config-container">
      <mat-card class="config-card">
        <mat-card-header class="card-header">
          <div class="header-content">
            <mat-icon class="header-icon">settings</mat-icon>
            <div>
              <mat-card-title>Backend Configuration</mat-card-title>
              <mat-card-subtitle>Configure your backend URL to get started</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content class="card-content">
          <form [formGroup]="configForm" (ngSubmit)="saveConfig()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Backend URL</mat-label>
              <input matInput
                     formControlName="baseUrl"
                     placeholder="https://your-backend-server.com"
                     type="url"
                     autocomplete="url">
              <mat-icon matSuffix>link</mat-icon>

              @if (configForm.get('baseUrl')?.hasError('required')) {
                <mat-error>Backend URL is required</mat-error>
              }
              @if (configForm.get('baseUrl')?.hasError('pattern')) {
                <mat-error>Please enter a valid URL (must start with http:// or https://)</mat-error>
              }

              <mat-hint>Enter the full URL of your backend server</mat-hint>
            </mat-form-field>

            <!-- Current Configuration Status -->
            @if (configService.isConfigured()) {
              <div class="config-status">
                <mat-icon class="status-icon success">check_circle</mat-icon>
                <div class="status-content">
                  <strong>Configuration Active</strong>
                  <p>Current backend: {{ configService.getBaseUrl() }}</p>
                </div>
              </div>
            }

            <!-- Example URLs -->
            <div class="examples-section">
              <h4>Example URLs:</h4>
              <mat-chip-listbox class="example-chips">
                @for (example of exampleUrls; track example) {
                  <mat-chip-option (click)="setExampleUrl(example)" class="example-chip">
                    {{ example }}
                  </mat-chip-option>
                }
              </mat-chip-listbox>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="card-actions">
          <button mat-raised-button
                  color="primary"
                  (click)="saveConfig()"
                  [disabled]="!configForm.valid || isLoading"
                  class="primary-button">
            @if (isLoading) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            {{ isLoading ? 'Saving...' : 'Save Configuration' }}
          </button>

          @if (configForm.get('baseUrl')?.value) {
            <button mat-stroked-button
                    color="accent"
                    (click)="testConnection()"
                    [disabled]="!configForm.valid || isLoading"
                    class="test-button">
              <mat-icon>wifi</mat-icon>
              Test Connection
            </button>
          }

          @if (configService.isConfigured()) {
            <button mat-button (click)="goToLogin()" class="secondary-button">
              <mat-icon>login</mat-icon>
              Go to Login
            </button>
          }

          @if (configService.isConfigured()) {
            <button mat-button (click)="clearConfig()" class="clear-button">
              <mat-icon>clear</mat-icon>
              Clear Configuration
            </button>
          }
        </mat-card-actions>
      </mat-card>

      <!-- Connection Status Card -->
      @if (connectionStatus) {
        <mat-card class="status-card">
          <mat-card-content>
            <div class="connection-status" [ngClass]="connectionStatus.type">
              <mat-icon class="connection-icon">{{ connectionStatus.icon }}</mat-icon>
              <div class="connection-content">
                <strong>{{ connectionStatus.title }}</strong>
                <p>{{ connectionStatus.message }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Advanced Options -->
      @if (showAdvanced) {
        <mat-card class="advanced-card">
          <mat-card-header>
            <mat-card-title>Advanced Options</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="advanced-actions">
              <button mat-stroked-button (click)="exportConfig()">
                <mat-icon>download</mat-icon>
                Export Configuration
              </button>

              <button mat-stroked-button (click)="importConfig()">
                <mat-icon>upload</mat-icon>
                Import Configuration
              </button>

              <input #fileInput type="file" accept=".json" style="display: none" (change)="onFileSelected($event)">
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Toggle Advanced Options -->
      <button mat-button
              class="advanced-toggle"
              (click)="showAdvanced = !showAdvanced">
        <mat-icon>{{ showAdvanced ? 'expand_less' : 'expand_more' }}</mat-icon>
        {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Options
      </button>
    </div>
  `,
  styles: [`
    .config-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .config-card {
      width: 100%;
      max-width: 600px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .card-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 16px 16px 0 0;
      padding: 24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #495057;
    }

    .card-content {
      padding: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .config-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e8f5e8;
      border-radius: 8px;
      margin: 16px 0;
    }

    .status-icon.success {
      color: #4caf50;
      font-size: 24px;
    }

    .status-content strong {
      color: #2e7d32;
      font-size: 14px;
    }

    .status-content p {
      margin: 4px 0 0 0;
      color: #2e7d32;
      font-size: 12px;
      opacity: 0.8;
    }

    .examples-section {
      margin: 20px 0;
    }

    .examples-section h4 {
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 14px;
      font-weight: 500;
    }

    .example-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .example-chip {
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
    }

    .example-chip:hover {
      background: #e3f2fd;
      color: #1976d2;
    }

    .card-actions {
      padding: 16px 24px;
      background: #f8f9fa;
      border-radius: 0 0 16px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .primary-button {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white;
      font-weight: 600;
      height: 44px;
      min-width: 160px;
    }

    .test-button {
      border: 2px solid #2196f3;
      color: #2196f3;
      height: 44px;
      font-weight: 500;
    }

    .test-button:hover {
      background: #e3f2fd;
    }

    .secondary-button {
      color: #495057;
      height: 44px;
    }

    .clear-button {
      color: #f44336;
      height: 44px;
    }

    .status-card {
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
    }

    .connection-status.success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .connection-status.error {
      background: #ffebee;
      color: #c62828;
    }

    .connection-status.info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .connection-status.warning {
      background: #fff3e0;
      color: #ef6c00;
    }

    .connection-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .connection-content strong {
      font-size: 16px;
      font-weight: 600;
    }

    .connection-content p {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .advanced-card {
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .advanced-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .advanced-toggle {
      color: white;
      margin-bottom: 40px;
    }

    @media (max-width: 768px) {
      .config-container {
        padding: 10px;
      }

      .card-actions {
        flex-direction: column;
      }

      .card-actions button {
        width: 100%;
      }

      .advanced-actions {
        flex-direction: column;
      }

      .advanced-actions button {
        width: 100%;
      }
    }
  `]
})
export class ConfigComponent implements OnInit {
  configForm: FormGroup;
  isLoading = false;
  showAdvanced = false;

  connectionStatus: {
    type: 'success' | 'error' | 'info' | 'warning';
    icon: string;
    title: string;
    message: string;
  } | null = null;

  exampleUrls = [
    'https://api.example.com',
    'http://localhost:8000',
    'http://192.168.1.100:8080'
  ];

  constructor(
    private fb: FormBuilder,
    public configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.configForm = this.fb.group({
      baseUrl: ['', [
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/)
      ]]
    });
  }

  ngOnInit(): void {
    // Load current configuration if available
    const currentUrl = this.configService.getBaseUrl();
    if (currentUrl) {
      this.configForm.patchValue({ baseUrl: currentUrl });
    }
  }

  saveConfig(): void {
    if (this.configForm.valid) {
      this.isLoading = true;
      const baseUrl = this.configForm.value.baseUrl.trim();

      try {
        this.configService.setBaseUrl(baseUrl);

        this.connectionStatus = {
          type: 'success',
          icon: 'check_circle',
          title: 'Configuration Saved',
          message: 'Backend URL has been saved successfully. You can now proceed to login.'
        };

        this.snackBar.open('✅ Configuration saved successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Auto-navigate to login after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);

      } catch (error) {
        this.connectionStatus = {
          type: 'error',
          icon: 'error',
          title: 'Configuration Error',
          message: 'Failed to save configuration. Please check the URL format.'
        };

        this.snackBar.open('❌ Failed to save configuration', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }

      this.isLoading = false;
    } else {
      this.snackBar.open('Please enter a valid backend URL', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  testConnection(): void {
    if (this.configForm.valid) {
      this.isLoading = true;
      this.connectionStatus = {
        type: 'info',
        icon: 'sync',
        title: 'Testing Connection',
        message: 'Attempting to connect to the backend server...'
      };

      const baseUrl = this.configForm.value.baseUrl;

      // Test connection using the config service
      this.configService.testConnection().subscribe({
        next: (success) => {
          this.connectionStatus = {
            type: 'success',
            icon: 'wifi',
            title: 'Connection Successful',
            message: 'Successfully connected to the backend server!'
          };

          this.snackBar.open('✅ Connection test successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          this.isLoading = false;
        },
        error: (error) => {
          this.connectionStatus = {
            type: 'error',
            icon: 'wifi_off',
            title: 'Connection Failed',
            message: `Unable to connect to the server. ${error.message}`
          };

          this.snackBar.open('❌ Connection test failed', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });

          this.isLoading = false;
        }
      });
    }
  }

  setExampleUrl(url: string): void {
    this.configForm.patchValue({ baseUrl: url });
  }

  clearConfig(): void {
    if (confirm('Are you sure you want to clear the configuration?')) {
      this.configService.clearConfig();
      this.configForm.reset();
      this.connectionStatus = null;

      this.snackBar.open('✅ Configuration cleared', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  exportConfig(): void {
    try {
      const configJson = this.configService.exportConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lowcode-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.snackBar.open('✅ Configuration exported successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('❌ Failed to export configuration', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  importConfig(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const configJson = e.target?.result as string;
          this.configService.importConfig(configJson);

          // Update form with imported config
          const currentUrl = this.configService.getBaseUrl();
          this.configForm.patchValue({ baseUrl: currentUrl });

          this.snackBar.open('✅ Configuration imported successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } catch (error) {
          this.snackBar.open('❌ Failed to import configuration', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      };

      reader.readAsText(file);
    }
  }
}
