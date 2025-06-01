// src/app/features/applications/application-detail/application-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../../../services/api.service';
import { Application } from '../../../models/interfaces';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="application-detail-container">
      <!-- Header -->
      <div class="detail-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="detail-title">Application Details</h1>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Loading application details...</p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <div class="error-details">
              <h3>Unable to Load Application</h3>
              <p>{{ error }}</p>
              <button mat-raised-button color="primary" (click)="loadApplication()">
                <mat-icon>refresh</mat-icon>
                Try Again
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Application Details -->
      <mat-card class="detail-card" *ngIf="application && !isLoading && !error">
        <mat-card-header>
          <mat-card-title>{{ application.title || 'Untitled Application' }}</mat-card-title>
          <mat-card-subtitle>Application #{{ application.id }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="detail-content">
          <div class="detail-section">
            <h3>Basic Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <mat-chip [class]="'status-' + application.status">
                  {{ getStatusLabel(application.status) }}
                </mat-chip>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(application.created_at) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Updated:</span>
                <span class="detail-value">{{ formatDate(application.updated_at) }}</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="detail-section">
            <h3>Application Data</h3>
            <div class="data-display">
              <pre>{{ formatApplicationData() }}</pre>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions class="detail-actions">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to List
          </button>

          <button mat-raised-button
                  color="primary"
                  *ngIf="canEdit()"
                  (click)="editApplication()">
            <mat-icon>edit</mat-icon>
            Edit Application
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit {
  application: Application | null = null;
  isLoading = false;
  error: string | null = null;
  applicationId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.applicationId = parseInt(params['id']);
      if (this.applicationId) {
        this.loadApplication();
      }
    });
  }

  loadApplication(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getCase(this.applicationId).subscribe({
      next: (application: Application) => {
        this.application = application;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load application';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  editApplication(): void {
    // Navigate to edit page or open edit modal
    console.log('Edit application:', this.application);
  }

  canEdit(): boolean {
    return this.application?.status === 'draft' || this.application?.status === 'returned';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'returned': return 'Returned';
      case 'submitted': return 'Submitted';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  }

  formatApplicationData(): string {
    if (!this.application) return '';
    return JSON.stringify(this.application, null, 2);
  }
}
