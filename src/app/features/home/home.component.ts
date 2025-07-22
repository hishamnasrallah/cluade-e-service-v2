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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../core/services/api.service';
import {
  Application,
  ApplicationsResponse,
  ApplicationStatus,
  ServicesResponse,
  ApplicantAction // Import ApplicantAction
} from '../../core/models/interfaces';
import { StatusService } from '../../core/services/status.service';
import { ApplicationsListComponent } from '../applications/applications-list/applications-list.component';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

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

        <!-- Dynamic Statistics Cards - Only show statuses with applications -->
        <div class="stats-container" *ngIf="applicationStats.length > 0">
          <div class="stat-card"
               *ngFor="let stat of applicationStats"
               [style.border-left-color]="stat.color"
               (click)="filterByStatus(stat.name)">
            <div class="stat-icon"
                 [style.background]="stat.backgroundColor"
                 [style.color]="stat.color">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-count">{{ stat.count }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Applications Tabs - Dynamic based on actual statuses -->
      <div class="applications-tabs">
        <mat-tab-group
          [selectedIndex]="selectedTabIndex"
          (selectedTabChange)="onTabChange($event)"
          class="applications-tab-group">

          <!-- All Applications Tab -->
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
              (onDownload)="downloadApplication($event)"
              (onApplicantAction)="handleApplicantActionFromList($event)"> <!-- Add this line -->
            </app-applications-list>
          </mat-tab>

          <!-- Dynamic Status Tabs - Only for statuses that have applications -->
          <mat-tab *ngFor="let statusTab of statusTabs"
                   [label]="statusTab.name + ' (' + statusTab.count + ')'">
            <app-applications-list
              [applications]="getApplicationsByStatusId(statusTab.id)"
              [loading]="isLoading"
              [status]="statusTab.name"
              (onView)="viewApplication($event)"
              (onEdit)="editApplication($event)"
              (onDelete)="deleteApplication($event)"
              (onContinue)="continueApplication($event)"
              (onResubmit)="resubmitApplication($event)"
              (onTrack)="trackApplication($event)"
              (onDownload)="downloadApplication($event)"
              (onApplicantAction)="handleApplicantActionFromList($event)"> <!-- Add this line -->
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
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
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
      cursor: pointer;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-card {
      position: relative;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
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
  // activeTab: ApplicationStatus = 'all';
  error: string | null = null;  // Add this line
  selectedTabIndex = 0;

  applicationStats: any[] = [];
  statusTabs: any[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(statusFilter?: string): void {
    this.isLoading = true;
    this.error = null;

    console.log('📋 Home: Loading applications with status filter:', statusFilter);

    // First ensure statuses are loaded
    this.statusService.loadStatuses().pipe(
      switchMap(() => this.apiService.getApplications()),
      switchMap((response: ApplicationsResponse) => {
        console.log('✅ Home: Applications loaded:', response);

        let filteredApps = response.results;

        // Filter by status if specified
        if (statusFilter && statusFilter !== 'all') {
          // Find status ID by name
          const allStatuses = this.statusService.getAllStatuses();
          const matchingStatus = allStatuses.find(s =>
            s.name.toLowerCase() === statusFilter.toLowerCase()
          );

          if (matchingStatus) {
            filteredApps = response.results.filter(app =>
              app.status === matchingStatus.id
            );
          }
        }

        // Enrich applications with service names
        return this.enrichApplicationsWithServiceNames(filteredApps);
      })
    ).subscribe({
      next: (enrichedApplications: Application[]) => {
        console.log('✅ Home: Applications enriched with service names');
        this.applications = enrichedApplications;
        this.updateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Home: Error loading applications:', error);
        this.error = error.message || 'Failed to load applications';
        this.isLoading = false;
      }
    });
  }

  refreshApplications(): void {
    console.log('🔄 HomeComponent: Refreshing applications');
    this.loadApplications();
  }
  private enrichApplicationsWithServiceNames(applications: Application[]): Observable<Application[]> {
    if (applications.length === 0) {
      return of([]);
    }

    // Get services to map case_type to service names
    return this.apiService.getServices().pipe(
      map((servicesResponse: ServicesResponse) => {
        const servicesMap = new Map<number, string>();

        // Create a map of service ID to service name
        servicesResponse.results.forEach(service => {
          servicesMap.set(service.id, service.name);
        });

        // Enrich each application with service name
        return applications.map(app => ({
          ...app,
          service_name: servicesMap.get(app.case_type) || 'Unknown Service'
        }));
      }),
      catchError(() => {
        console.error('Failed to fetch services, returning applications without service names');
        return of(applications);
      })
    );
  }

  updateStats(): void {
    // Get unique status IDs from applications
    const statusIdsInUse = new Set<number>();
    this.applications.forEach(app => {
      if (app.status) {
        statusIdsInUse.add(app.status);
      }
    });

    // Build stats only for statuses that have applications
    this.applicationStats = [];
    this.statusTabs = [];

    statusIdsInUse.forEach(statusId => {
      const statusInfo = this.statusService.getStatus(statusId);
      if (statusInfo) {
        const count = this.applications.filter(app => app.status === statusId).length;

        const stat = {
          id: statusId,
          name: statusInfo.name,
          icon: statusInfo.icon || 'info',
          label: statusInfo.name,
          count: count,
          color: statusInfo.color,
          backgroundColor: statusInfo.backgroundColor
        };

        this.applicationStats.push(stat);

        // Add to tabs if it has applications
        if (count > 0) {
          this.statusTabs.push(stat);
        }
      }
    });

    // Sort by count descending
    this.applicationStats.sort((a, b) => b.count - a.count);
    this.statusTabs.sort((a, b) => b.count - a.count);

    // Limit stats display to top 6 if there are many
    if (this.applicationStats.length > 6) {
      this.applicationStats = this.applicationStats.slice(0, 6);
    }
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  goToServices(): void {
    console.log('🚀 HomeComponent: Navigating to services');
    this.router.navigate(['/services']);
  }

  // Application actions implementation

  /**
   * Navigate to application detail view
   */
  viewApplication(application: Application): void {
    console.log('👁️ HomeComponent: Viewing application:', application.id);
    this.router.navigate(['/application', application.id]);
  }

  /**
   * Edit application - same as continue for draft/returned applications
   */
  editApplication(application: Application): void {
    console.log('✏️ HomeComponent: Editing application:', application.id);
    this.continueApplication(application);
  }

  /**
   * Continue application - navigate to service wizard with existing data
   */
  continueApplication(application: Application): void {
    console.log('🔄 HomeComponent: Continuing application:', application.id, 'Case type (service ID):', application.case_type);

    // Get service code from case type (service ID) by looking up the service
    this.apiService.getServiceCodeFromCaseType(application.case_type).subscribe({
      next: (serviceCode: string) => {
        console.log('📋 HomeComponent: Found service code for case type', application.case_type, ':', serviceCode);

        // Navigate to service wizard with continue mode
        // serviceCode: actual service code (e.g., "01") for API calls
        // application.case_type: service ID for case submission
        this.router.navigate(['/service-flow', serviceCode, application.case_type], {
          queryParams: {
            continueId: application.id,
            mode: 'continue'
          }
        });
      },
      error: (error: any) => {
        console.error('❌ HomeComponent: Error getting service code for case type', application.case_type, ':', error);
        this.snackBar.open('Unable to continue application. Could not find service information.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Resubmit application - same as continue but with different messaging
   */
  resubmitApplication(application: Application): void {
    console.log('🔄 HomeComponent: Resubmitting application:', application.id);

    const confirmed = confirm(
      `Are you sure you want to resubmit this application?\n\n` +
      `Application #${application.serial_number}\n` +
      `You can make changes before resubmitting.`
    );

    if (confirmed) {
      this.continueApplication(application);
    }
  }

  /**
   * Delete application with confirmation
   */
  deleteApplication(application: Application): void {
    console.log('🗑️ HomeComponent: Deleting application:', application.id);

    const confirmed = confirm(
      `Are you sure you want to delete this application?\n\n` +
      `Application #${application.serial_number}\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      this.performDeleteApplication(application);
    }
  }

  /**
   * Actually perform the delete operation
   */
  private performDeleteApplication(application: Application): void {
    this.apiService.deleteCase(application.id).subscribe({
      next: () => {
        console.log('✅ HomeComponent: Application deleted successfully');

        this.snackBar.open('Application deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Remove the application from the list immediately for better UX
        this.applications = this.applications.filter(app => app.id !== application.id);
        this.updateStats();
      },
      error: (error: any) => {
        console.error('❌ HomeComponent: Error deleting application:', error);

        this.snackBar.open('Failed to delete application. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Track application progress
   */
  trackApplication(application: Application): void {
    console.log('📊 HomeComponent: Tracking application:', application.id);

    // For now, navigate to the detail view which shows the current status
    // In the future, this could open a tracking modal or navigate to a dedicated tracking page
    this.viewApplication(application);
  }


  /**
   * Download application documents
   */
  downloadApplication(application: Application): void {
    console.log('💾 HomeComponent: Downloading application:', application.id);

    // This is a placeholder implementation
    // In a real app, this would generate and download a PDF or ZIP file
    this.snackBar.open('Download feature not yet implemented', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  getApplicationsByStatusId(statusId: number): Application[] {
    return this.applications.filter(app => app.status === statusId);
  }

  filterByStatus(statusName: string): void {
    // Find the tab index for this status
    const tabIndex = this.statusTabs.findIndex(tab =>
      tab.name.toLowerCase() === statusName.toLowerCase()
    );

    if (tabIndex >= 0) {
      // +1 because first tab is "All"
      this.selectedTabIndex = tabIndex + 1;
    }
  }

  handleApplicantActionFromList(event: { application: Application, action: ApplicantAction }): void {
    console.log('⚡ HomeComponent: Applicant action from list:', event.action.name, 'for application:', event.application.id);

    // Navigate to the dedicated action execution page
    this.router.navigate(['/cases', event.application.id, 'action', event.action.id]);
  }
}
