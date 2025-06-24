// src/app/features/services/services-list/services-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Service } from '../../../core/models/interfaces';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule, // ✅ Added CommonModule
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="services-container">
      <!-- Loading State -->
      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <p class="loading-text">Loading available services...</p>
          <div class="loading-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error && !loading) {
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <div class="error-details">
                <h3>Unable to Load Services</h3>
                <p>{{ error }}</p>
                <button mat-raised-button color="primary" (click)="onRefresh.emit()">
                  <mat-icon>refresh</mat-icon>
                  Try Again
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Services Grid -->
      @if (!loading && !error && services.length > 0) {
        <div class="services-grid">
          @for (service of services; track trackByServiceId($index, service)) {
            <mat-card class="service-card"
                      [class.active-service]="service.active_ind"
                      (click)="selectService(service)">

              <!-- Service Icon -->
              <div class="service-icon-container">
                @if (service.icon) {
                  <img [src]="service.icon"
                       [alt]="service.name"
                       class="service-icon"
                       (error)="onImageError($event)">
                } @else {
                  <mat-icon class="default-service-icon">build</mat-icon>
                }

                <!-- Status Badge -->
                <div class="status-badge" [class.active]="service.active_ind">
                  <mat-icon>{{ service.active_ind ? 'check_circle' : 'pause_circle' }}</mat-icon>
                </div>
              </div>

              <!-- Service Info -->
              <mat-card-header class="service-header">
                <mat-card-title class="service-title">
                  {{ service.name }}
                </mat-card-title>
                @if (service.name_ara) {
                  <mat-card-subtitle class="service-subtitle">
                    {{ service.name_ara }}
                  </mat-card-subtitle>
                }
              </mat-card-header>

              <!-- Service Details -->
              <mat-card-content class="service-content">
                <div class="service-details">
                  <div class="detail-item">
                    <mat-icon class="detail-icon">tag</mat-icon>
                    <span class="detail-text">Code: {{ service.code }}</span>
                  </div>

                  <div class="detail-item">
                    <mat-icon class="detail-icon">fingerprint</mat-icon>
                    <span class="detail-text">ID: {{ service.id }}</span>
                  </div>

                  <div class="detail-item">
                    <mat-icon class="detail-icon">category</mat-icon>
                    <span class="detail-text">Type: {{ service.type }}</span>
                  </div>
                </div>

                <!-- Service Status -->
                <div class="service-status">
                  <mat-chip [class]="service.active_ind ? 'active-chip' : 'inactive-chip'">
                    <mat-icon class="chip-icon">
                      {{ service.active_ind ? 'check_circle' : 'pause_circle' }}
                    </mat-icon>
                    {{ service.active_ind ? 'Available' : 'Unavailable' }}
                  </mat-chip>
                </div>
              </mat-card-content>

              <!-- Service Actions -->
              <mat-card-actions class="service-actions">
                <button mat-button
                        color="primary"
                        (click)="onPreview.emit(service); $event.stopPropagation()">
                  <mat-icon>preview</mat-icon>
                  Preview
                </button>

                <button mat-raised-button
                        color="primary"
                        [disabled]="!service.active_ind"
                        (click)="onStart.emit(service); $event.stopPropagation()"
                        class="start-btn">
                  <mat-icon>play_arrow</mat-icon>
                  Start Application
                </button>
              </mat-card-actions>

              <!-- Hover Overlay -->
              @if (service.active_ind) {
                <div class="hover-overlay">
                  <mat-icon class="overlay-icon">arrow_forward</mat-icon>
                  <span class="overlay-text">Click to Start</span>
                </div>
              }
            </mat-card>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading && !error && services.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">search_off</mat-icon>
          <h3 class="empty-title">No services available</h3>
          <p class="empty-subtitle">
            There are currently no services available. Please contact your administrator.
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .services-container {
      width: 100%;
      min-height: 400px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 24px;
    }

    .loading-text {
      color: #6c757d;
      font-size: 18px;
      margin: 0;
      font-weight: 500;
    }

    .loading-progress {
      width: 200px;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #9b59b6, #3498db, #9b59b6);
      background-size: 200% 100%;
      animation: progressAnimation 2s linear infinite;
    }

    @keyframes progressAnimation {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .error-card {
      margin: 40px auto;
      max-width: 600px;
      border-radius: 16px;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 20px;
      text-align: left;
    }

    .error-icon {
      font-size: 48px;
      color: #e74c3c;
      flex-shrink: 0;
    }

    .error-details h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 20px;
    }

    .error-details p {
      margin: 0 0 16px 0;
      color: #7f8c8d;
      line-height: 1.5;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .service-card {
      border-radius: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: white;
      border: 2px solid transparent;
      height: fit-content;
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border-color: #9b59b6;
    }

    .service-card.active-service:hover .hover-overlay {
      opacity: 1;
    }

    .service-icon-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      margin: -1px -1px 0 -1px;
    }

    .service-icon {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 12px;
      background: white;
      padding: 8px;
    }

    .default-service-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 8px;
    }

    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }

    .status-badge mat-icon {
      font-size: 20px;
      color: #e74c3c;
    }

    .status-badge.active mat-icon {
      color: #27ae60;
    }

    .service-header {
      padding: 20px 20px 16px 20px;
      text-align: center;
    }

    .service-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
      line-height: 1.4;
    }

    .service-subtitle {
      font-size: 14px;
      color: #7f8c8d;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }

    .service-content {
      padding: 0 20px 20px 20px;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9b59b6;
    }

    .detail-text {
      font-size: 14px;
      color: #555;
      font-weight: 500;
    }

    .service-status {
      display: flex;
      justify-content: center;
    }

    .active-chip {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
      font-weight: 600;
    }

    .inactive-chip {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      font-weight: 600;
    }

    .chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .service-actions {
      padding: 16px 20px 20px 20px;
      background: #fafbfc;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .start-btn {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      color: white;
      font-weight: 600;
      flex: 1;
      height: 40px;
      border-radius: 20px;
    }

    .start-btn:disabled {
      background: #bdc3c7;
      color: #95a5a6;
    }

    .start-btn mat-icon {
      margin-right: 6px;
    }

    .hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(46, 196, 182, 0.9) 0%, rgba(43, 169, 155, 0.9) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.3s ease;
      backdrop-filter: blur(2px);
    }

    .overlay-icon {
      font-size: 48px;
      color: white;
      margin-bottom: 8px;
    }

    .overlay-text {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #cbd5e0;
      margin-bottom: 24px;
    }

    .empty-title {
      font-size: 24px;
      font-weight: 600;
      color: #4a5568;
      margin: 0 0 12px 0;
    }

    .empty-subtitle {
      font-size: 16px;
      color: #718096;
      margin: 0 0 32px 0;
      max-width: 500px;
      line-height: 1.6;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .services-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }
    }

    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .service-actions {
        flex-direction: column;
      }

      .service-actions button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .error-content {
        flex-direction: column;
        text-align: center;
      }

      .error-icon {
        font-size: 40px;
      }
    }
  `]
})
export class ServicesListComponent {
  @Input() services: Service[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() onStart = new EventEmitter<Service>();
  @Output() onPreview = new EventEmitter<Service>();
  @Output() onRefresh = new EventEmitter<void>();

  trackByServiceId(index: number, service: Service): number {
    return service.id;
  }

  selectService(service: Service): void {
    if (service.active_ind) {
      this.onStart.emit(service);
    }
  }

  onImageError(event: any): void {
    // Hide the broken image and show default icon
    event.target.style.display = 'none';
  }
}
