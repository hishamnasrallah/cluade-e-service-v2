// src/app/features/services/services.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ApiService } from '../../core/services/api.service';
import { Service, ServicesResponse } from '../../core/models/interfaces';
import { ServicesListComponent } from './services-list/services-list.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    ServicesListComponent
  ],
  template: `
    <div class="services-page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h1 class="page-title">Available Services</h1>
            <p class="page-subtitle">Select a service to start your application</p>
          </div>
          <button mat-icon-button
                  (click)="refreshServices()"
                  matTooltip="Refresh services"
                  [disabled]="isLoading"
                  class="refresh-btn">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Services List -->
      <app-services-list
        [services]="services"
        [loading]="isLoading"
        [error]="error"
        (onStart)="startService($event)"
        (onPreview)="previewService($event)"
        (onRefresh)="refreshServices()">
      </app-services-list>
    </div>
  `,
  styles: [`
    .services-page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .header-info {
      flex: 1;
    }

    .page-title {
      font-size: 32px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0;
      line-height: 1.5;
    }

    .refresh-btn {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      width: 48px;
      height: 48px;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #e9ecef;
      border-color: #dee2e6;
    }

    .refresh-btn mat-icon {
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .services-page-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .page-title {
        font-size: 24px;
      }

      .refresh-btn {
        align-self: flex-end;
      }
    }
  `]
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getServices().subscribe({
      next: (response: ServicesResponse) => {
        this.services = response.results || [];
        this.isLoading = false;

        console.log('✅ Services loaded successfully:', this.services.length, 'services');
      },
      error: (error: any) => {
        console.error('❌ Error loading services:', error);
        this.error = error.message || 'Failed to load services';
        this.isLoading = false;

        this.snackBar.open('Failed to load services. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  refreshServices(): void {
    this.loadServices();
  }

  startService(service: Service): void {
    if (!service.active_ind) {
      this.snackBar.open('This service is currently unavailable', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    console.log('🚀 Starting service:', service.name, 'Code:', service.code, 'ID:', service.id);

    // Navigate to service wizard with both service code and service ID
    // serviceCode is used for the service flow API call
    // serviceId is used for case submission
    this.router.navigate(['/service-flow', service.code, service.id]);
  }

  previewService(service: Service): void {
    console.log('👀 Previewing service:', service.name);

    // Here you could implement a service preview modal or page
    // For now, just show service details in a snackbar
    this.snackBar.open(`Service: ${service.name} (Code: ${service.code})`, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}
