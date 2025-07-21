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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotesComponent } from '../../notes/notes.component';
import { ApiService } from '../../../core/services/api.service';
import {
  Application,
  getStatusLabel,
  getStatusIcon,
  ServiceFlowResponse,
  ServiceFlowField,
  LookupOption,
  LookupResponse, ServicesResponse
} from '../../../core/models/interfaces';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';

interface FieldMetadata {
  field: ServiceFlowField;
  lookupOptions?: LookupOption[];
}

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
    MatDividerModule,
    NotesComponent
  ],
  template: `
    <div class="application-detail-container">
      <!-- Header -->
      <div class="detail-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="detail-title">Application Details</h1>
          <p class="detail-subtitle" *ngIf="application">
            Application #{{ application.serial_number }}
          </p>
        </div>
        <div class="header-actions">
          <button mat-icon-button
                  (click)="refreshApplication()"
                  matTooltip="Refresh"
                  [disabled]="isLoading">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
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
              <div class="error-actions">
                <button mat-raised-button color="primary" (click)="loadApplication()">
                  <mat-icon>refresh</mat-icon>
                  Try Again
                </button>
                <button mat-button (click)="goBack()">
                  <mat-icon>arrow_back</mat-icon>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Application Details -->
      <div class="detail-content" *ngIf="application && !isLoading && !error">
        <!-- Basic Information Card -->
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>Basic Information</mat-card-title>
          </mat-card-header>
          <mat-card-content class="basic-info-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Status:</span>
                <mat-chip [class]="'status-' + application.status" class="status-chip">
                  <mat-icon class="chip-icon">{{ getStatusIcon(application.status) }}</mat-icon>
                  {{ getStatusLabel(application.status) }}
                </mat-chip>
              </div>
              <div class="info-item">
                <span class="info-label">Serial Number:</span>
                <span class="info-value">{{ application.serial_number }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Application ID:</span>
                <span class="info-value">#{{ application.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Service:</span>
                <span class="info-value">{{ serviceName || 'Loading...' }}</span>
              </div>
<!--              <div class="info-item">-->
<!--                <span class="info-label">Applicant Type:</span>-->
<!--                <span class="info-value">{{ applicantTypeName || 'Loading...' }}</span>-->
<!--              </div>-->
              <div class="info-item" *ngIf="application.sub_status">
                <span class="info-label">Sub Status:</span>
                <span class="info-value">{{ subStatusName || 'Loading...' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span class="info-value">{{ formatDate(application.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Updated:</span>
                <span class="info-value">{{ formatDate(application.updated_at) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Application Data Card -->
        <mat-card class="detail-card">
          <mat-card-header>
            <mat-card-title>Application Data</mat-card-title>
            <mat-card-subtitle>Form fields and submitted information</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="application-data-content">
            <div class="data-grid">
              <div
                class="data-item"
                *ngFor="let item of getFormattedApplicationData()"
                [class.file-item]="item.isFile">

                <div class="data-label">
                  <mat-icon class="data-icon" [class.file-icon]="item.isFile">
                    {{ item.isFile ? 'attach_file' : 'info' }}
                  </mat-icon>
                  <span>{{ item.label }}</span>
                </div>

                <div class="data-value" [class.file-value]="item.isFile">
                  <span *ngIf="!item.isFile">{{ item.displayValue }}</span>

                  <!-- File handling -->
                  <div *ngIf="item.isFile" class="file-info">
                    <mat-icon class="file-type-icon">description</mat-icon>
                    <div class="file-details">
                      <span class="file-name">{{ item.fileName }}</span>
                      <span class="file-type">{{ item.fileType }}</span>
                    </div>
                    <button mat-icon-button
                            color="primary"
                            (click)="downloadFile(item.fileUrl)"
                            matTooltip="Download file">
                      <mat-icon>download</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No data message -->
            <div class="no-data" *ngIf="getFormattedApplicationData().length === 0">
              <mat-icon class="no-data-icon">inbox</mat-icon>
              <p>No application data available</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Actions Card -->
        <mat-card class="detail-card actions-card">
          <mat-card-content class="actions-content">
            <div class="action-group">
              <h4 class="action-group-title">Application Actions</h4>
              <div class="action-buttons">
                <button mat-button (click)="goBack()" class="secondary-btn">
                  <mat-icon>arrow_back</mat-icon>
                  Back to List
                </button>

                <button mat-raised-button
                        color="accent"
                        *ngIf="canContinue()"
                        (click)="continueApplication()"
                        [disabled]="isProcessing"
                        class="continue-btn">
                  <mat-spinner diameter="20" *ngIf="isProcessing"></mat-spinner>
                  <mat-icon *ngIf="!isProcessing">edit</mat-icon>
                  Continue Application
                </button>

                <button mat-raised-button
                        color="primary"
                        *ngIf="canTrack()"
                        (click)="trackApplication()"
                        class="track-btn">
                  <mat-icon>track_changes</mat-icon>
                  Track Progress
                </button>

                <button mat-raised-button
                        color="primary"
                        *ngIf="canDownload()"
                        (click)="downloadApplication()"
                        class="download-btn">
                  <mat-icon>download</mat-icon>
                  Download
                </button>
              </div>
            </div>

            <!-- Danger zone -->
            <div class="action-group danger-group" *ngIf="canDelete()">
              <mat-divider></mat-divider>
              <h4 class="action-group-title danger-title">Danger Zone</h4>
              <div class="action-buttons">
                <button mat-raised-button
                        color="warn"
                        (click)="confirmDeleteApplication()"
                        [disabled]="isProcessing"
                        class="delete-btn">
                  <mat-icon>delete</mat-icon>
                  Delete Application
                </button>
              </div>
              <p class="danger-description">
                This action cannot be undone. The application and all its data will be permanently deleted.
              </p>
            </div>
          </mat-card-content>
        </mat-card>
        <!-- Application Notes -->
        <app-notes [caseId]="application.id"></app-notes>
      </div>
    </div>
  `,
  styles: [`
    .application-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .back-btn {
      background: #f8f9fa;
      color: #6c757d;
      width: 48px;
      height: 48px;
    }

    .back-btn:hover {
      background: #e9ecef;
      color: #495057;
    }

    .header-info {
      flex: 1;
    }

    .detail-title {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
      line-height: 1.2;
    }

    .detail-subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin: 4px 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
    }

    .loading-text {
      color: #6c757d;
      font-size: 16px;
      margin: 0;
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

    .error-actions {
      display: flex;
      gap: 12px;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .detail-card {
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .basic-info-content {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 16px;
      color: #2c3e50;
      font-weight: 500;
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      font-weight: 600;
      font-size: 13px;
      height: 32px;
      border-radius: 16px;
    }

    .chip-icon {
      font-size: 16px !important;
      width: 16px;
      height: 16px;
    }

    .status-chip.status-20 {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
    }

    .status-chip.status-44 {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .status-chip.status-11 {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    .status-chip.status-21 {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .application-data-content {
      padding: 24px;
    }

    .data-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .data-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #e9ecef;
    }

    .data-item.file-item {
      border-left-color: #3498db;
      background: #f0f8ff;
    }

    .data-label {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
      font-weight: 600;
      color: #2c3e50;
    }

    .data-icon {
      font-size: 20px;
      color: #7f8c8d;
    }

    .data-icon.file-icon {
      color: #3498db;
    }

    .data-value {
      flex: 1;
      color: #555;
      font-size: 15px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-type-icon {
      font-size: 24px;
      color: #3498db;
    }

    .file-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .file-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .file-type {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #7f8c8d;
    }

    .no-data-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #bdc3c7;
    }

    .actions-card {
      border-top: 4px solid #3498db;
    }

    .actions-content {
      padding: 24px;
    }

    .action-group {
      margin-bottom: 24px;
    }

    .action-group:last-child {
      margin-bottom: 0;
    }

    .action-group-title {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 16px 0;
    }

    .danger-title {
      color: #e74c3c;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .secondary-btn {
      color: #6c757d;
      border: 1px solid #dee2e6;
    }

    .continue-btn {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      color: white;
      font-weight: 600;
    }

    .track-btn {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      font-weight: 600;
    }

    .download-btn {
      background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
      color: white;
      font-weight: 600;
    }

    .delete-btn {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      font-weight: 600;
    }

    .danger-group {
      border-top: 1px solid #fee;
      padding-top: 24px;
      background: #fef9f9;
      border-radius: 8px;
      margin-top: 16px;
      padding: 16px;
    }

    .danger-description {
      margin: 12px 0 0 0;
      font-size: 14px;
      color: #e74c3c;
      font-style: italic;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .application-detail-container {
        padding: 16px;
      }

      .detail-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .detail-title {
        font-size: 24px;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .data-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .data-label {
        min-width: auto;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }

      .error-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ApplicationDetailComponent implements OnInit {
  application: Application | null = null;
  isLoading = false;
  isProcessing = false;
  error: string | null = null;
  applicationId: number = 0;

  // New properties for lookup resolution
  fieldMetadata: Map<string, FieldMetadata> = new Map();
  lookupCache: Map<number, LookupOption[]> = new Map();
  serviceName: string = '';
  applicantTypeName: string = '';
  subStatusName: string = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.applicationId = parseInt(params['id']);
      if (this.applicationId) {
        this.loadApplication();
      } else {
        this.error = 'Invalid application ID';
      }
    });
  }

  loadApplication(): void {
    this.isLoading = true;
    this.error = null;

    console.log('📋 ApplicationDetail: Loading application with ID:', this.applicationId);

    this.apiService.getCase(this.applicationId).pipe(
      switchMap((application: Application) => {
        console.log('✅ ApplicationDetail: Application loaded:', application);
        this.application = application;

        // Fetch all system lookups in parallel
        let requests: any[];
        requests = [];

        // 1. Get service name (case_type)
        requests.push(
          this.apiService.getServices().pipe(
            map((response: ServicesResponse) => {
              const service = response.results.find(s => s.id === application.case_type);
              if (service) {
                this.serviceName = service.name;
              }
              return service?.code || application.case_type.toString();
            })
          )
        );

        // 2. Get applicant type name
        if (application.applicant_type) {
          requests.push(
            this.apiService.getLookupOptions(application.applicant_type).pipe(
              map((response: LookupResponse) => {
                if (response.results && response.results.length > 0) {
                  this.applicantTypeName = response.results[0].name;
                }
              }),
              catchError(() => of(null))
            )
          );
        }

        // 3. Get sub-status name if exists
        if (application.sub_status) {
          requests.push(
            this.apiService.getLookupOptions(application.sub_status).pipe(
              map((response: LookupResponse) => {
                if (response.results && response.results.length > 0) {
                  this.subStatusName = response.results[0].name;
                }
              }),
              catchError(() => of(null))
            )
          );
        }

        return forkJoin(requests).pipe(
          map(() => requests[0]) // Return the service code for next step
        );
      }),
      switchMap((serviceCode: any) => {
        console.log('🔍 ApplicationDetail: Loading service flow for code:', serviceCode);
        // Load service flow to get field metadata
        return this.apiService.getServiceFlow(serviceCode);
      }),
      switchMap((serviceFlowResponse: ServiceFlowResponse) => {
        console.log('✅ ApplicationDetail: Service flow loaded');

        // Extract all fields and build metadata
        this.buildFieldMetadata(serviceFlowResponse);

        // Get unique lookup IDs that need to be fetched
        const lookupIds = this.getUniqueLookupIds();

        // Fetch all lookup options in parallel
        if (lookupIds.length > 0) {
          console.log('🔍 ApplicationDetail: Fetching lookup options for IDs:', lookupIds);
          const lookupRequests = lookupIds.map(id =>
            this.apiService.getLookupOptions(id).pipe(
              map((response: LookupResponse) => ({
                lookupId: id,
                options: response.results || []
              })),
              catchError(() => of({ lookupId: id, options: [] }))
            )
          );

          return forkJoin(lookupRequests);
        }

        return of([]);
      })
    ).subscribe({
      next: (lookupResults: any[]) => {
        // Cache lookup options
        lookupResults.forEach(result => {
          this.lookupCache.set(result.lookupId, result.options);
        });

        console.log('✅ ApplicationDetail: All data loaded successfully');
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ApplicationDetail: Error loading application data:', error);
        this.error = error.message || 'Failed to load application details';
        this.isLoading = false;
      }
    });
  }

  refreshApplication(): void {
    this.loadApplication();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getStatusIcon(status: number): string {
    return getStatusIcon(status);
  }

  getStatusLabel(status: number): string {
    return getStatusLabel(status);
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

  getFormattedApplicationData(): any[] {
    if (!this.application?.case_data) return [];

    const formattedData: any[] = [];
    const caseData = this.application.case_data;

    Object.entries(caseData).forEach(([key, value]) => {
      // Skip uploaded_files as they're handled separately
      if (key === 'uploaded_files' ||
        key === 'case_type' ||
        key === 'applicant_type' ||
        key === 'sub_status' ||
        key === 'status') return;

      // Get field metadata to get proper display name
      const metadata = this.fieldMetadata.get(key);
      const label = metadata?.field.display_name || this.formatFieldName(key);

      formattedData.push({
        key,
        label,
        value,
        displayValue: this.getFieldDisplayValue(key, value), // Use new method
        isFile: false,
        fieldType: metadata?.field.field_type || 'text'
      });
    });

    // Handle uploaded files separately
    if (caseData['uploaded_files'] && Array.isArray(caseData['uploaded_files'])) {
      caseData['uploaded_files'].forEach((file: any, index: number) => {
        const fileName = this.extractFileName(file.file_url);
        formattedData.push({
          key: `file_${index}`,
          label: file.type || 'Uploaded File',
          value: file,
          displayValue: fileName,
          isFile: true,
          fileName,
          fileType: file.type || 'Unknown',
          fileUrl: file.file_url
        });
      });
    }

    return formattedData;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatFieldValue(value: any): string {
    if (value === null || value === undefined) return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  private extractFileName(fileUrl: string): string {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1] || 'Unknown file';
  }

  downloadFile(fileUrl: string): void {
    console.log('📎 ApplicationDetail: Downloading file:', fileUrl);

    // Open file in new tab for download
    window.open(fileUrl, '_blank');

    this.snackBar.open('File download started', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Permission check methods
  canContinue(): boolean {
    return this.application?.status === 20 || this.application?.status === 44; // draft or returned
  }

  canTrack(): boolean {
    return this.application?.status === 11; // submitted
  }

  canDownload(): boolean {
    return this.application?.status === 21; // completed
  }

  canDelete(): boolean {
    return this.application?.status === 20; // draft only
  }

  // Action methods
  continueApplication(): void {
    if (!this.application) return;

    console.log('🔄 ApplicationDetail: Continuing application:', this.application.id);
    this.isProcessing = true;

    // Navigate to service wizard with continue mode
    // We need to pass both the service code and the application ID
    // First, we need to determine the service code from case_type
    this.determineServiceCodeAndNavigate();
  }

  private determineServiceCodeAndNavigate(): void {
    // Since we don't have a direct mapping from case_type to service code,
    // we'll use a simple approach: navigate to a continue route with the application ID
    // The service wizard will need to handle loading the existing application data

    this.router.navigate(['/application', this.application!.id, 'continue']).then(() => {
      this.isProcessing = false;
    }).catch((error) => {
      console.error('❌ ApplicationDetail: Navigation error:', error);
      this.isProcessing = false;
      this.snackBar.open('Failed to navigate to continue application', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  trackApplication(): void {
    console.log('📊 ApplicationDetail: Tracking application:', this.application?.id);

    this.snackBar.open('Tracking feature not yet implemented', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  downloadApplication(): void {
    console.log('💾 ApplicationDetail: Downloading application:', this.application?.id);

    this.snackBar.open('Download feature not yet implemented', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  confirmDeleteApplication(): void {
    if (!this.application) return;

    const confirmed = confirm(
      `Are you sure you want to delete this application?\n\n` +
      `Application #${this.application.serial_number}\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      this.deleteApplication();
    }
  }

  private deleteApplication(): void {
    if (!this.application) return;

    console.log('🗑️ ApplicationDetail: Deleting application:', this.application.id);
    this.isProcessing = true;

    this.apiService.deleteCase(this.application.id).subscribe({
      next: () => {
        console.log('✅ ApplicationDetail: Application deleted successfully');

        this.snackBar.open('Application deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Navigate back to home after successful deletion
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (error: any) => {
        console.error('❌ ApplicationDetail: Error deleting application:', error);
        this.isProcessing = false;

        this.snackBar.open('Failed to delete application. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private buildFieldMetadata(serviceFlowResponse: ServiceFlowResponse): void {
    serviceFlowResponse.service_flow.forEach(step => {
      step.categories.forEach(category => {
        category.fields.forEach(field => {
          this.fieldMetadata.set(field.name, { field });
        });
      });
    });
  }

  private getUniqueLookupIds(): number[] {
    const lookupIds = new Set<number>();

    this.fieldMetadata.forEach((metadata) => {
      if (metadata.field.lookup) {
        lookupIds.add(metadata.field.lookup);
      }
    });

    return Array.from(lookupIds);
  }

  private getFieldDisplayValue(fieldName: string, value: any): string {
    const metadata = this.fieldMetadata.get(fieldName);

    if (!metadata || !metadata.field.lookup) {
      // Not a lookup field, return value as is
      return this.formatFieldValue(value);
    }

    // This is a lookup field, get the display name
    const lookupOptions = this.lookupCache.get(metadata.field.lookup) || [];

    if (Array.isArray(value)) {
      // Multiple choice field
      const displayNames = value.map(id => {
        const option = lookupOptions.find(opt => opt.id === Number(id));
        return option ? option.name : `Unknown (${id})`;
      });
      return displayNames.join(', ');
    } else {
      // Single choice field
      const option = lookupOptions.find(opt => opt.id === Number(value));
      return option ? option.name : this.formatFieldValue(value);
    }
  }
}
