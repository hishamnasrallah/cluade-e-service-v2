// src/app/features/services/service-wizard/service-wizard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../../core/services/api.service';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import {
  ServiceFlowResponse,
  ServiceFlowStep,
  CaseSubmission,
  WizardState,
  Application, evaluateVisibilityCondition
} from '../../../core/models/interfaces';

@Component({
  selector: 'app-service-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    DynamicFormComponent
  ],
  template: `
    <div class="service-wizard-container">
      <!-- Header -->
      <div class="wizard-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1 class="wizard-title">
              {{ isEditMode ? 'Edit Application' : 'Service Application' }}
              {{ getWizardTitle() }}
            </h1>
            <p class="wizard-subtitle" *ngIf="serviceCode">
              Service Code: {{ serviceCode }} | Service ID: {{ serviceId }}
              <span *ngIf="isEditMode && existingApplication">
                | Application #{{ existingApplication.serial_number }}
              </span>
            </p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section" *ngIf="!isLoading && visibleSteps.length > 0">
          <mat-progress-bar
            mode="determinate"
            [value]="getProgressPercentage()"
            class="main-progress">
          </mat-progress-bar>
          <div class="progress-text">
            Step {{ wizardState.currentStep + 1 }} of {{ wizardState.totalSteps }}
            <span class="progress-percentage">({{ getProgressPercentage().toFixed(0) }}%)</span>
            <span *ngIf="isEditMode" class="edit-mode-indicator">
              <mat-icon class="edit-icon">edit</mat-icon>
              Edit Mode
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="60"></mat-spinner>
        <p class="loading-text">
          {{ isEditMode ? 'Loading application data...' : 'Loading service flow...' }}
        </p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <div class="error-details">
              <h3>{{ isEditMode ? 'Unable to Load Application' : 'Unable to Load Service Flow' }}</h3>
              <p>{{ error }}</p>
              <div class="error-actions">
                <button mat-raised-button color="primary" (click)="loadData()">
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

      <!-- Wizard Steps -->
      <div class="wizard-container" *ngIf="!isLoading && !error && serviceFlowSteps.length > 0">
        <mat-stepper
          #stepper
          [selectedIndex]="wizardState.currentStep"
          orientation="vertical"
          class="service-stepper">

          <mat-step
            *ngFor="let step of visibleSteps; let i = index"
            [stepControl]="getStepForm(i)"
            [editable]="true"
            [optional]="false">

            <!-- Step Label -->
            <ng-template matStepLabel>
              <div class="step-label">
                <span class="step-title">{{ step.name }}</span>
                <mat-icon *ngIf="wizardState.completedSteps[i]" class="step-check">check_circle</mat-icon>
              </div>
            </ng-template>

            <!-- Step Content -->
            <div class="step-content">
              <!-- Step Description -->
              <div class="step-description" *ngIf="step.description">
                <mat-card class="description-card">
                  <mat-card-content>
                    <div [innerHTML]="formatDescription(step.description)"></div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Edit Mode Notice -->
              <div class="edit-notice" *ngIf="isEditMode">
                <mat-card class="notice-card">
                  <mat-card-content>
                    <div class="notice-content">
                      <mat-icon class="notice-icon">edit</mat-icon>
                      <div class="notice-text">
                        <strong>Edit Mode:</strong> You are editing an existing application.
                        Make your changes and click "Update Application" to save.
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Dynamic Form with Complete Form Data -->
              <div class="form-container">
                <app-dynamic-form
                  [categories]="step.categories"
                  [formData]="wizardState.formData"
                  (formChange)="onFormChange($event)">
                </app-dynamic-form>
              </div>

              <!-- Debug Panel -->
              <div class="debug-panel" *ngIf="debugMode">
                <h4>Wizard Form Data Debug</h4>
                <div class="debug-content">
                  <h5>Complete Wizard Form Data:</h5>
                  <pre>{{ wizardState.formData | json }}</pre>
                  <h5>Current Step Fields:</h5>
                  <pre>{{ getCurrentStepFieldNames() | json }}</pre>
                  <h5>Edit Mode Info:</h5>
                  <pre>{{ getEditModeDebugInfo() | json }}</pre>
                  <button mat-button (click)="debugVisibilityConditions()">Debug Visibility</button>
                  <button mat-button (click)="debugMode = false">Hide Debug</button>
                </div>
              </div>

              <!-- Form Validation Messages -->
              <div class="validation-messages" *ngIf="currentStepValidation && !currentStepValidation.isValid">
                <mat-card class="validation-card">
                  <mat-card-content>
                    <div class="validation-header">
                      <mat-icon class="warning-icon">warning</mat-icon>
                      <span>Please fix the following issues:</span>
                    </div>
                    <ul class="validation-list">
                      <li *ngFor="let error of currentStepValidation.errors">{{ error }}</li>
                    </ul>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Step Actions -->
              <div class="step-actions">
                <button mat-button
                        (click)="previousStep()"
                        [disabled]="wizardState.currentStep === 0"
                        class="prev-btn">
                  <mat-icon>navigate_before</mat-icon>
                  Previous
                </button>

                <div class="action-spacer"></div>

                <button mat-button
                        (click)="saveDraft()"
                        [disabled]="isSubmitting"
                        class="draft-btn">
                  <mat-icon>save</mat-icon>
                  {{ isEditMode ? 'Save Changes' : 'Save Draft' }}
                </button>

                <button mat-button
                        (click)="debugMode = !debugMode"
                        class="debug-btn">
                  <mat-icon>bug_report</mat-icon>
                  {{ debugMode ? 'Hide' : 'Show' }} Debug
                </button>

                <button mat-raised-button
                        color="primary"
                        (click)="nextStep()"
                        [disabled]="isSubmitting || (currentStepValidation && !currentStepValidation.isValid)"
                        class="next-btn">
                  <mat-spinner diameter="20" *ngIf="isSubmitting && isLastStep()"></mat-spinner>
                  <mat-icon *ngIf="!isSubmitting">
                    {{ isLastStep() ? (isEditMode ? 'update' : 'send') : 'navigate_next' }}
                  </mat-icon>
                  {{ isLastStep() ? (isEditMode ? 'Update Application' : 'Submit Application') : 'Next' }}
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    </div>
  `,
  styles: [`
    .service-wizard-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .wizard-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
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

    .wizard-title {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
      line-height: 1.2;
    }

    .wizard-subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin: 4px 0 0 0;
    }

    .progress-section {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .main-progress {
      height: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .progress-text {
      font-size: 14px;
      color: #666;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-percentage {
      color: #2EC4B6;
      font-weight: 600;
    }

    .edit-mode-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      color: #f39c12;
      font-weight: 600;
      font-size: 13px;
    }

    .edit-icon {
      font-size: 16px !important;
      width: 16px;
      height: 16px;
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

    .service-stepper {
      background: transparent;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-title {
      font-weight: 500;
    }

    .step-check {
      color: #27ae60;
      font-size: 20px;
    }

    .step-content {
      padding: 24px 0;
    }

    .description-card {
      margin-bottom: 24px;
      border-left: 4px solid #2EC4B6;
    }

    .edit-notice {
      margin-bottom: 24px;
    }

    .notice-card {
      border-left: 4px solid #f39c12;
      background: #fff9f0;
    }

    .notice-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notice-icon {
      color: #f39c12;
      font-size: 24px;
    }

    .notice-text {
      color: #d68910;
      line-height: 1.5;
    }

    .form-container {
      margin-bottom: 24px;
    }

    .debug-panel {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .debug-panel h4, .debug-panel h5 {
      margin: 0 0 12px 0;
      color: #495057;
    }

    .debug-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .debug-panel pre {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #ced4da;
      overflow-x: auto;
      font-size: 12px;
      max-height: 200px;
    }

    .validation-messages {
      margin-bottom: 24px;
    }

    .validation-card {
      border-left: 4px solid #f39c12;
      background: #fff9f0;
    }

    .validation-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #e67e22;
    }

    .warning-icon {
      color: #f39c12;
    }

    .validation-list {
      margin: 0;
      padding-left: 20px;
      color: #d35400;
    }

    .validation-list li {
      margin-bottom: 4px;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;
    }

    .action-spacer {
      flex: 1;
    }

    .prev-btn {
      color: #6c757d;
    }

    .draft-btn {
      color: #17a2b8;
      border: 1px solid #17a2b8;
    }

    .draft-btn:hover {
      background: rgba(23, 162, 184, 0.1);
    }

    .debug-btn {
      color: #6f42c1;
      border: 1px solid #6f42c1;
    }

    .debug-btn:hover {
      background: rgba(111, 66, 193, 0.1);
    }

    .next-btn {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      color: white;
      font-weight: 600;
      min-width: 180px;
      height: 44px;
    }

    .next-btn:disabled {
      background: #bdc3c7;
      color: #95a5a6;
    }

    .next-btn mat-icon {
      margin-right: 6px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .service-wizard-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .wizard-title {
        font-size: 24px;
      }

      .progress-text {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .edit-mode-indicator {
        margin-left: 0;
      }

      .step-actions {
        flex-direction: column;
        gap: 8px;
      }

      .step-actions button {
        width: 100%;
      }

      .error-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ServiceWizardComponent implements OnInit, OnDestroy {
  serviceCode: string = '';
  serviceId: number = 0;
  serviceFlowSteps: ServiceFlowStep[] = [];
  stepForms: FormGroup[] = [];

  // Edit mode properties
  isEditMode = false;
  continueApplicationId: number | null = null;
  existingApplication: Application | null = null;

  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  debugMode = false; // Enable this to see debug information

  wizardState: WizardState = {
    currentStep: 0,
    totalSteps: 0,
    formData: {},
    completedSteps: [],
    isValid: false
  };

  currentStepValidation: { isValid: boolean; errors: string[] } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🚀 ServiceWizard: Initializing...');

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.serviceCode = params['serviceCode']; // Service code for API calls (e.g., "01")
      this.serviceId = parseInt(params['serviceId']); // Service ID for case submission

      console.log('📋 ServiceWizard: Route params - Service Code:', this.serviceCode, 'Service ID:', this.serviceId);
      console.log('🔍 ServiceWizard: Service code will be used for service flow API, Service ID for case submission');
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
      this.continueApplicationId = queryParams['continueId'] ? parseInt(queryParams['continueId']) : null;
      this.isEditMode = queryParams['mode'] === 'continue' && this.continueApplicationId !== null;

      console.log('🔄 ServiceWizard: Query params - Edit mode:', this.isEditMode, 'Continue ID:', this.continueApplicationId);

      // Load data based on mode
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    if (this.isEditMode && this.continueApplicationId) {
      this.loadExistingApplicationAndServiceFlow();
    } else {
      this.loadServiceFlow();
    }
  }

  loadExistingApplicationAndServiceFlow(): void {
    console.log('🔄 ServiceWizard: Loading existing application and service flow...');
    this.isLoading = true;
    this.error = null;

    // First load the existing application
    this.apiService.getCase(this.continueApplicationId!).subscribe({
      next: (application: Application) => {
        console.log('✅ ServiceWizard: Existing application loaded:', application);
        this.existingApplication = application;

        // Now load the service flow
        this.loadServiceFlow();
      },
      error: (error: any) => {
        console.error('❌ ServiceWizard: Error loading existing application:', error);
        this.error = error.message || 'Failed to load existing application';
        this.isLoading = false;
      }
    });
  }

  loadServiceFlow(): void {
    if (!this.isEditMode) {
      this.isLoading = true;
      this.error = null;
    }

    console.log('🌐 ServiceWizard: Loading service flow for code:', this.serviceCode);

    this.apiService.getServiceFlow(this.serviceCode).subscribe({
      next: (response: ServiceFlowResponse) => {
        console.log('✅ ServiceWizard: Service flow loaded:', response);

        this.serviceFlowSteps = response.service_flow || [];
        this.initializeWizard();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ServiceWizard: Error loading service flow:', error);
        this.error = error.message || 'Failed to load service flow';
        this.isLoading = false;
      }
    });
  }

  initializeWizard(): void {
    console.log('🔧 ServiceWizard: Initializing wizard with', this.serviceFlowSteps.length, 'steps');

    // Filter visible steps and sort by sequence number
    const visibleSteps = this.serviceFlowSteps
      .filter(step => !step.is_hidden_page)
      .sort((a, b) => parseInt(a.sequence_number) - parseInt(b.sequence_number));

    this.serviceFlowSteps = visibleSteps;
    this.wizardState.totalSteps = visibleSteps.length;
    this.wizardState.completedSteps = new Array(visibleSteps.length).fill(false);

    console.log('📊 ServiceWizard: Visible steps:', this.wizardState.totalSteps);

    // Initialize form data with default values for ALL fields across ALL steps
    this.initializeCompleteFormData();

    // If in edit mode, populate with existing application data
    if (this.isEditMode && this.existingApplication) {
      this.populateFormWithExistingData();
    }

    // Create form controls for each step
    this.stepForms = [];
    this.serviceFlowSteps.forEach((step, index) => {
      const form = this.createStepForm(step);
      this.stepForms.push(form);
    });

    // Validate initial step
    this.validateCurrentStep();
  }

  // Initialize form data with all fields from all steps
  initializeCompleteFormData(): void {
    console.log('🏗️ ServiceWizard: Initializing complete form data...');

    const completeFormData: any = {};

    // Process all steps to get all field names and default values
    this.serviceFlowSteps.forEach(step => {
      step.categories.forEach(category => {
        category.fields.forEach(field => {
          const defaultValue = this.getDefaultValue(field);
          completeFormData[field.name] = defaultValue;
          console.log(`📝 ServiceWizard: Initialized field ${field.name} = ${defaultValue} (${field.field_type})`);
        });
      });
    });

    this.wizardState.formData = completeFormData;
    console.log('✅ ServiceWizard: Complete form data initialized:', this.wizardState.formData);
  }

  // Populate form with existing application data
  populateFormWithExistingData(): void {
    if (!this.existingApplication?.case_data) return;

    console.log('📝 ServiceWizard: Populating form with existing data:', this.existingApplication.case_data);

    // Merge existing data with initialized form data
    Object.keys(this.existingApplication.case_data).forEach(fieldName => {
      if (fieldName !== 'uploaded_files') { // Skip uploaded_files for now - handle separately
        this.wizardState.formData[fieldName] = this.existingApplication!.case_data[fieldName];
        console.log(`📝 ServiceWizard: Set ${fieldName} = ${this.existingApplication!.case_data[fieldName]}`);
      }
    });

    // FIXED: Handle uploaded_files array - map to file fields
    if (this.existingApplication.case_data['uploaded_files'] && Array.isArray(this.existingApplication.case_data['uploaded_files'])) {
      const uploadedFiles = this.existingApplication.case_data['uploaded_files'];
      console.log('📎 ServiceWizard: Processing uploaded files:', uploadedFiles);

      // Get all file fields from service flow
      const fileFields: any[] = [];
      this.serviceFlowSteps.forEach(step => {
        step.categories.forEach(category => {
          category.fields.forEach(field => {
            if (field.field_type === 'file') {
              fileFields.push(field);
            }
          });
        });
      });

      console.log('📁 ServiceWizard: Found file fields:', fileFields.map(f => f.name));

      // Map uploaded files to file fields (for now, map first file to first file field, etc.)
      uploadedFiles.forEach((file: any, index: number) => {
        if (fileFields[index]) {
          const fieldName = fileFields[index].name;
          this.wizardState.formData[fieldName] = file.file_url;
          console.log(`📎 ServiceWizard: Mapped file ${index} to field ${fieldName}: ${file.file_url}`);
        }
      });
    }

    console.log('✅ ServiceWizard: Final form data:', this.wizardState.formData);
  }

  createStepForm(step: ServiceFlowStep): FormGroup {
    const formControls: { [key: string]: any } = {};

    step.categories.forEach(category => {
      category.fields.forEach(field => {
        const currentValue = this.wizardState.formData[field.name];
        formControls[field.name] = [currentValue];
      });
    });

    return this.fb.group(formControls);
  }

  getDefaultValue(field: any): any {
    switch (field.field_type) {
      case 'boolean':
        return field.default_boolean || false;
      case 'number':
      case 'decimal':
      case 'percentage':
        return null;
      case 'choice':
        return field.max_selections === 1 ? null : [];
      case 'file':
        return null;
      default:
        return '';
    }
  }

  get visibleSteps(): ServiceFlowStep[] {
    return this.serviceFlowSteps.filter(step => !step.is_hidden_page);
  }

  get currentStep(): ServiceFlowStep | null {
    return this.visibleSteps[this.wizardState.currentStep] || null;
  }

  getStepForm(stepIndex: number): FormGroup {
    return this.stepForms[stepIndex] || this.fb.group({});
  }

  getProgressPercentage(): number {
    return this.wizardState.totalSteps > 0
      ? ((this.wizardState.currentStep + 1) / this.wizardState.totalSteps) * 100
      : 0;
  }

  isLastStep(): boolean {
    return this.wizardState.currentStep === this.wizardState.totalSteps - 1;
  }

  getWizardTitle(): string {
    return this.currentStep?.name ? ` - ${this.currentStep.name}` : '';
  }

  formatDescription(description: string): string {
    return description
      .replace(/\r?\n/g, '<br>')
      .replace(/\r/g, '<br>');
  }

  // Form data handling - ensure form data is merged properly across all steps
  onFormChange(formData: any): void {
    console.log('📝 ServiceWizard: Form data changed:', formData);

    // Merge the changed data with existing wizard form data
    this.wizardState.formData = {
      ...this.wizardState.formData,
      ...formData
    };

    console.log('📊 ServiceWizard: Complete wizard form data:', this.wizardState.formData);

    // Validate current step when form changes
    this.validateCurrentStep();
  }

  getCurrentStepFieldNames(): string[] {
    if (!this.currentStep) return [];

    const fieldNames: string[] = [];
    this.currentStep.categories.forEach(category => {
      category.fields.forEach(field => {
        fieldNames.push(field.name);
      });
    });
    return fieldNames;
  }

  getEditModeDebugInfo(): any {
    return {
      isEditMode: this.isEditMode,
      continueApplicationId: this.continueApplicationId,
      existingApplication: this.existingApplication ? {
        id: this.existingApplication.id,
        serial_number: this.existingApplication.serial_number,
        status: this.existingApplication.status,
        case_type: this.existingApplication.case_type
      } : null
    };
  }

  debugVisibilityConditions(): void {
    console.log('=== DEBUGGING VISIBILITY CONDITIONS ===');
    console.log('Complete wizard form data:', this.wizardState.formData);
    console.log('Edit mode info:', this.getEditModeDebugInfo());

    if (!this.currentStep) return;

    console.log(`\n--- Current Step: ${this.currentStep.name} ---`);

    this.currentStep.categories.forEach(category => {
      console.log(`\n--- Category: ${category.name} ---`);

      category.fields.forEach(field => {
        if (field.visibility_conditions && field.visibility_conditions.length > 0) {
          console.log(`\nField: ${field.name}`);
          console.log('Visibility conditions:', field.visibility_conditions);

          field.visibility_conditions.forEach((condition, condIndex) => {
            console.log(`Evaluating condition ${condIndex}:`, condition);
          });
        } else {
          console.log(`Field: ${field.name} - No visibility conditions`);
        }
      });
    });
  }
// Add this method to the ServiceWizardComponent class
  private isFieldVisible(field: any): boolean {
    // Skip explicitly hidden fields
    if (field.is_hidden) {
      return false;
    }

    // Check visibility conditions using the complete wizard form data
    if (field.visibility_conditions && field.visibility_conditions.length > 0) {
      // ALL visibility conditions must be met for the field to be visible
      const isVisible = field.visibility_conditions.every((condition: any) => {
        return evaluateVisibilityCondition(condition, this.wizardState.formData);
      });

      return isVisible;
    }

    // No conditions means visible by default
    return true;
  }
  validateCurrentStep(): void {
    if (!this.currentStep) {
      this.currentStepValidation = null;
      return;
    }

    const errors: string[] = [];
    let isValid = true;

    // Validate all fields in current step
    this.currentStep.categories.forEach(category => {
      category.fields.forEach(field => {
        // Skip hidden and disabled fields
        if (field.is_hidden || field.is_disabled) return;
        if (!this.isFieldVisible(field)) return;
        const value = this.wizardState.formData[field.name];

        // Check required fields
        if (field.mandatory) {
          if (!value || (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${field.display_name} is required`);
            isValid = false;
          }
        }

        // Validate choice fields
        if (field.field_type === 'choice' && value) {
          if (field.min_selections && Array.isArray(value) && value.length < field.min_selections) {
            errors.push(`${field.display_name} requires at least ${field.min_selections} selections`);
            isValid = false;
          }

          if (field.max_selections && field.max_selections > 1 && Array.isArray(value) && value.length > field.max_selections) {
            errors.push(`${field.display_name} allows at most ${field.max_selections} selections`);
            isValid = false;
          }
        }

        // Validate file fields
        if (field.field_type === 'file' && field.mandatory && !value) {
          errors.push(`${field.display_name} file is required`);
          isValid = false;
        }

        // Validate text fields
        if (field.field_type === 'text' && value) {
          if (field.min_length && value.length < field.min_length) {
            errors.push(`${field.display_name} must be at least ${field.min_length} characters`);
            isValid = false;
          }
          if (field.max_length && value.length > field.max_length) {
            errors.push(`${field.display_name} cannot exceed ${field.max_length} characters`);
            isValid = false;
          }
        }

        // Validate number fields
        if ((field.field_type === 'number' || field.field_type === 'decimal') && value !== null && value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${field.display_name} must be a valid number`);
            isValid = false;
          } else {
            if (field.value_greater_than !== undefined && num <= field.value_greater_than) {
              errors.push(`${field.display_name} must be greater than ${field.value_greater_than}`);
              isValid = false;
            }
            if (field.value_less_than !== undefined && field.value_less_than !== null && num >= field.value_less_than) {
              errors.push(`${field.display_name} must be less than ${field.value_less_than}`);
              isValid = false;
            }
          }
        }
      });
    });

    this.currentStepValidation = { isValid, errors };
  }

  nextStep(): void {
    this.validateCurrentStep();

    if (this.currentStepValidation && !this.currentStepValidation.isValid) {
      this.snackBar.open('Please fix the validation errors before proceeding', 'Close', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (this.isLastStep()) {
      this.submitApplication();
    } else {
      this.wizardState.completedSteps[this.wizardState.currentStep] = true;
      this.wizardState.currentStep++;

      // Validate the new step
      this.validateCurrentStep();

      console.log('➡️ ServiceWizard: Moved to step', this.wizardState.currentStep + 1);
    }
  }

  previousStep(): void {
    if (this.wizardState.currentStep > 0) {
      this.wizardState.currentStep--;
      this.validateCurrentStep();
      console.log('⬅️ ServiceWizard: Moved to step', this.wizardState.currentStep + 1);
    }
  }

  goBack(): void {
    console.log('🔙 ServiceWizard: Going back');
    if (this.isEditMode) {
      this.router.navigate(['/home']); // Go back to applications list when editing
    } else {
      this.router.navigate(['/services']); // Go back to services when creating new
    }
  }

  saveDraft(): void {
    console.log('💾 ServiceWizard: Saving draft...');

    if (this.isEditMode) {
      // In edit mode, save the changes as an update
      this.updateApplication(false); // false = don't submit, just save
    } else {
      // In create mode, create as draft
      this.snackBar.open('Draft saving not yet implemented for new applications', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
    }
  }

  submitApplication(): void {
    console.log('🚀 ServiceWizard: Starting application submission...');

    if (this.isEditMode) {
      this.updateApplication(true); // true = submit the application
    } else {
      this.createNewApplication();
    }
  }

  private createNewApplication(): void {
    console.log('📝 ServiceWizard: Creating new application...');
    this.isSubmitting = true;

    // Collect file types from form fields
    const fileTypes = this.collectFileTypes();

    const caseData: CaseSubmission = {
      applicant_type: 13, // This should be configurable or from user profile
      case_type: this.serviceId,
      case_data: this.wizardState.formData,
      file_types: fileTypes
    };

    console.log('📦 ServiceWizard: Submitting case data:', caseData);

    // First create the case
    this.apiService.submitCase(caseData).subscribe({
      next: (response: any) => {
        console.log('✅ ServiceWizard: Case created successfully:', response);

        // After case creation, submit it using the ID
        if (response.id) {
          this.submitCreatedCase(response.id);
        } else {
          // If no ID returned, just show success message
          this.handleSubmissionSuccess();
        }
      },
      error: (error: any) => {
        console.error('❌ ServiceWizard: Case creation failed:', error);
        this.isSubmitting = false;
        this.snackBar.open('Failed to submit application. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private updateApplication(shouldSubmit: boolean = false): void {
    console.log('🔄 ServiceWizard: Updating application...', { shouldSubmit });
    this.isSubmitting = true;

    // Collect file types from form fields
    const fileTypes = this.collectFileTypes();

    const caseData: Partial<CaseSubmission> = {
      applicant_type: this.existingApplication?.applicant_type || 13,
      case_type: this.existingApplication?.case_type || this.serviceId,
      case_data: this.wizardState.formData,
      file_types: fileTypes
    };

    console.log('📦 ServiceWizard: Updating case data:', caseData);

    this.apiService.continueApplication(this.continueApplicationId!, caseData).subscribe({
      next: (response: any) => {
        console.log('✅ ServiceWizard: Application updated successfully:', response);

        if (shouldSubmit) {
          // If we should submit after updating, call the submit endpoint
          this.submitCreatedCase(this.continueApplicationId!);
        } else {
          // Just saved as draft
          this.isSubmitting = false;
          this.snackBar.open('Changes saved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error: any) => {
        console.error('❌ ServiceWizard: Application update failed:', error);
        this.isSubmitting = false;
        this.snackBar.open('Failed to update application. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private collectFileTypes(): string[] {
    const fileTypes: string[] = [];

    // Iterate through all service flow steps to find file fields
    this.serviceFlowSteps.forEach(step => {
      step.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.field_type === 'file' && this.wizardState.formData[field.name]) {
            // If field has allowed_lookups, use the first one's code
            if (field.allowed_lookups && field.allowed_lookups.length > 0) {
              fileTypes.push(field.allowed_lookups[0].code);
            } else {
              // Default file type if no specific type is configured
              fileTypes.push('01');
            }
          }
        });
      });
    });

    console.log('📎 ServiceWizard: Collected file types:', fileTypes);
    return fileTypes;
  }

  private submitCreatedCase(caseId: number): void {
    console.log('🔄 ServiceWizard: Submitting case with ID:', caseId);

    // Make PUT request to submit the case
    this.apiService.submitCreatedCase(caseId).subscribe({
      next: (response: any) => {
        console.log('✅ ServiceWizard: Case submitted successfully:', response);
        this.handleSubmissionSuccess();
      },
      error: (error: any) => {
        console.error('❌ ServiceWizard: Case submission failed:', error);
        this.isSubmitting = false;

        const message = this.isEditMode
          ? 'Application was updated but submission failed. Please try again.'
          : 'Case was created but submission failed. Please try again.';

        this.snackBar.open(message, 'Close', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
    });
  }

  private handleSubmissionSuccess(): void {
    this.isSubmitting = false;

    const message = this.isEditMode
      ? '🎉 Application updated and submitted successfully!'
      : '🎉 Application submitted successfully!';

    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });

    // Navigate back to home with a small delay to show the success message
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  }
}
