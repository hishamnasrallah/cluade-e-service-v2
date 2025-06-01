// src/app/features/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../core/services/api.service';
import { Application, ApplicationsResponse, ApplicationStatus } from '../../core/models/interfaces';
import { ApplicationsListComponent } from '../applications/applications-list/applications-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    ApplicationsListComponent
  ],
  template: `
    <div class="home-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h1 class="page-title">My Applications</h1>
            <p class="page-subtitle">Manage and track your applications</p>
          </div>

          <div class="header-actions">
            <button mat-raised-button
                    color="primary"
                    (click)="goToServices()"
                    class="new-application-btn">
              <mat-icon>add</mat-icon>
              New Application
            </button>

            <button mat-icon-button
                    (click)="refreshApplications()"
                    matTooltip="Refresh applications"
                    [disabled]="isLoading">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-container">
          <div class="stat-card"
               *ngFor="let stat of applicationStats"
               [class]="'stat-' + stat.colorClass">
            <div class="stat-icon">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-count">{{ stat.count }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Applications Tabs -->
      <div class="applications-tabs">
        <mat-tab-group
          [selectedIndex]="selectedTabIndex"
          (selectedTabChange)="onTabChange($event)"
          class="applications-tab-group">

          <!-- All Applications -->
          <mat-tab [label]="'All (' + applications.length + ')'">
            <app-applications-list
              [applications]="applications"
              [loading]="isLoading"
              [status]="'all'"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)">
            </app-applications-list>
          </mat-tab>

          <!-- Draft Applications -->
          <mat-tab [label]="'Draft (' + getApplicationsByStatus('draft').length + ')'">
            <app-applications-list
              [applications]="getApplicationsByStatus('draft')"
              [loading]="isLoading"
              [status]="'draft'"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)">
            </app-applications-list>
          </mat-tab>

          <!-- Returned Applications -->
          <mat-tab [label]="'Returned (' + getApplicationsByStatus('returned').length + ')'">
            <app-applications-list
              [applications]="getApplicationsByStatus('returned')"
              [loading]="isLoading"
              [status]="'returned'"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)">
            </app-applications-list>
          </mat-tab>

          <!-- Submitted Applications -->
          <mat-tab [label]="'Submitted (' + getApplicationsByStatus('submitted').length + ')'">
            <app-applications-list
              [applications]="getApplicationsByStatus('submitted')"
              [loading]="isLoading"
              [status]="'submitted'"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)">
            </app-applications-list>
          </mat-tab>

          <!-- Completed Applications -->
          <mat-tab [label]="'Completed (' + getApplicationsByStatus('completed').length + ')'">
            <app-applications-list
              [applications]="getApplicationsByStatus('completed')"
              [loading]="isLoading"
              [status]="'completed'"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)">
            </app-applications-list>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
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
      margin-bottom: 24px;
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

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .new-application-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
      height: 44px;
      padding: 0 24px;
      border-radius: 22px;
    }

    .new-application-btn mat-icon {
      margin-right: 8px;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-card.stat-draft {
      border-left-color: #f39c12;
    }

    .stat-card.stat-returned {
      border-left-color: #e74c3c;
    }

    .stat-card.stat-submitted {
      border-left-color: #3498db;
    }

    .stat-card.stat-completed {
      border-left-color: #27ae60;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-draft .stat-icon {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
    }

    .stat-returned .stat-icon {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .stat-submitted .stat-icon {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    .stat-completed .stat-icon {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-count {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #7f8c8d;
      font-weight: 500;
      margin-top: 4px;
    }

    .applications-tabs {
      min-height: 500px;
    }

    .applications-tab-group {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    ::ng-deep .applications-tab-group .mat-mdc-tab-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    ::ng-deep .applications-tab-group .mat-mdc-tab-body-wrapper {
      padding: 24px;
    }

    ::ng-deep .applications-tab-group .mat-mdc-tab {
      font-weight: 500;
      opacity: 0.7;
    }

    ::ng-deep .applications-tab-group .mat-mdc-tab.mdc-tab--active {
      opacity: 1;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .page-title {
        font-size: 24px;
      }

      .stats-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-card {
        padding: 16px;
        gap: 12px;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
      }

      .stat-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .stat-count {
        font-size: 20px;
      }

      ::ng-deep .applications-tab-group .mat-mdc-tab-body-wrapper {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .stats-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  applications: Application[] = [];
  isLoading = false;
  selectedTabIndex = 0;

  applicationStats = [
    { icon: 'edit', label: 'Draft', colorClass: 'draft', count: 0 },
    { icon: 'undo', label: 'Returned', colorClass: 'returned', count: 0 },
    { icon: 'send', label: 'Submitted', colorClass: 'submitted', count: 0 },
    { icon: 'check_circle', label: 'Completed', colorClass: 'completed', count: 0 }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;

    this.apiService.getApplications().subscribe({
      next: (response: ApplicationsResponse) => {
        this.applications = response.results || [];
        this.updateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.applications = [];
        this.updateStats();
        this.isLoading = false;
      }
    });
  }

  refreshApplications(): void {
    this.loadApplications();
  }

  getApplicationsByStatus(status: ApplicationStatus): Application[] {
    return this.applications.filter(app => app.status === status);
  }

  updateStats(): void {
    this.applicationStats.forEach(stat => {
      const statusKey = stat.label.toLowerCase() as ApplicationStatus;
      stat.count = this.getApplicationsByStatus(statusKey).length;
    });
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  goToServices(): void {
    this.router.navigate(['/services']);
  }

  // Application actions
  editApplication(application: Application): void {
    console.log('Edit application:', application);
    // Navigate to edit flow or open edit modal
  }

  viewApplication(application: Application): void {
    console.log('View application:', application);
    // Navigate to view page or open view modal
  }

  deleteApplication(application: Application): void {
    if (confirm(`Are you sure you want to delete this application?`)) {
      this.apiService.deleteCase(application.id).subscribe({
        next: () => {
          this.loadApplications(); // Refresh list
          console.log('Application deleted successfully');
        },
        error: (error: any) => {
          console.error('Error deleting application:', error);
        }
      });
    }
  }

  continueApplication(application: Application): void {
    console.log('Continue application:', application);
    // Navigate to continue the application flow
  }

  resubmitApplication(application: Application): void {
    console.log('Resubmit application:', application);
    // Navigate to resubmit flow
  }

  trackApplication(application: Application): void {
    console.log('Track application:', application);
    // Show tracking information
  }

  downloadApplication(application: Application): void {
    console.log('Download application:', application);
    // Download application documents
  }
}
