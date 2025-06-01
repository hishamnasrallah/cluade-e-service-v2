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
  WizardState
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
            <h1 class="wizard-title">{{ currentStep?.name || 'Service Application' }}</h1>
            <p class="wizard-subtitle" *ngIf="serviceCode">Service: {{ serviceCode }}</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <mat-progress-bar
            mode="determinate"
            [value]="getProgressPercentage()"
            class="main-progress">
          </mat-progress-bar>
          <div class="progress-text">
            Step {{ wizardState.currentStep + 1 }} of {{ wizardState.totalSteps }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="60"></mat-spinner>
        <p class="loading-text">Loading service flow...</p>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <div class="error-details">
              <h3>Unable to Load Service Flow</h3>
              <p>{{ error }}</p>
              <div class="error-actions">
                <button mat-raised-button color="primary" (click)="loadServiceFlow()">
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

              <!-- Dynamic Form -->
              <app-dynamic-form
                [categories]="step.categories"
                [formData]="wizardState.formData"
                (formChange)="onFormChange($event)">
              </app-dynamic-form>

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
                  Save Draft
                </button>

                <button mat-raised-button
                        color="primary"
                        (click)="nextStep()"
                        [disabled]="isSubmitting"
                        class="next-btn">
                  <mat-spinner diameter="20" *ngIf="isSubmitting && isLastStep()"></mat-spinner>
                  <mat-icon *ngIf="!isSubmitting">
                    {{ isLastStep() ? 'send' : 'navigate_next' }}
                  </mat-icon>
                  {{ isLastStep() ? 'Submit Application' : 'Next' }}
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    </div>
  `,
  styleUrls: ['./service-wizard.component.scss']
})
export class ServiceWizardComponent implements OnInit, OnDestroy {
  serviceCode: string = '';
  serviceId: number = 0;
  serviceFlowSteps: ServiceFlowStep[] = [];
  stepForms: FormGroup[] = [];

  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  wizardState: WizardState = {
    currentStep: 0,
    totalSteps: 0,
    formData: {},
    completedSteps: [],
    isValid: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.serviceCode = params['serviceCode'];
      this.serviceId = parseInt(params['serviceId']);

      if (this.serviceCode && this.serviceId) {
        this.loadServiceFlow();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadServiceFlow(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getServiceFlow(this.serviceCode).subscribe({
      next: (response: ServiceFlowResponse) => {
        this.serviceFlowSteps = response.service_flow || [];
        this.initializeWizard();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.error = error.message || 'Failed to load service flow';
        this.isLoading = false;
      }
    });
  }

  initializeWizard(): void {
    const visibleSteps = this.serviceFlowSteps
      .filter(step => !step.is_hidden_page)
      .sort((a, b) => parseInt(a.sequence_number) - parseInt(b.sequence_number));

    this.serviceFlowSteps = visibleSteps;
    this.wizardState.totalSteps = visibleSteps.length;
    this.wizardState.completedSteps = new Array(visibleSteps.length).fill(false);

    this.stepForms = [];
    this.serviceFlowSteps.forEach((step, index) => {
      const form = this.createStepForm(step);
      this.stepForms.push(form);
    });
  }

  createStepForm(step: ServiceFlowStep): FormGroup {
    const formControls: { [key: string]: any } = {};

    step.categories.forEach(category => {
      category.fields.forEach(field => {
        const defaultValue = this.getDefaultValue(field);
        formControls[field.name] = [defaultValue];
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
        return null;
      case 'choice':
        return field.max_selections === 1 ? null : [];
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

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }

  onFormChange(formData: any): void {
    Object.assign(this.wizardState.formData, formData);
  }

  nextStep(): void {
    if (this.isLastStep()) {
      this.submitApplication();
    } else {
      this.wizardState.completedSteps[this.wizardState.currentStep] = true;
      this.wizardState.currentStep++;
    }
  }

  previousStep(): void {
    if (this.wizardState.currentStep > 0) {
      this.wizardState.currentStep--;
    }
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }

  saveDraft(): void {
    this.snackBar.open('Draft saved successfully', 'Close', {duration: 3000});
  }

  submitApplication(): void {
    this.isSubmitting = true;

    // Collect file types from form fields
    const fileTypes = this.collectFileTypes();

    const caseData: CaseSubmission = {
      applicant_type: 13,
      case_type: this.serviceId,
      case_data: this.wizardState.formData,
      file_types: fileTypes
    };

    console.log('🚀 Submitting case data:', caseData);

    // First create the case
    this.apiService.submitCase(caseData).subscribe({
      next: (response: any) => {
        console.log('✅ Case created successfully:', response);

        // After case creation, submit it using the ID
        if (response.id) {
          this.submitCreatedCase(response.id);
        } else {
          // If no ID returned, just show success message
          this.handleSubmissionSuccess();
        }
      },
      error: (error: any) => {
        console.error('❌ Case creation failed:', error);
        this.isSubmitting = false;
        this.snackBar.open('Failed to submit application. Please try again.', 'Close', {
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

    return fileTypes;
  }

  private submitCreatedCase(caseId: number): void {
    console.log('🔄 Submitting case with ID:', caseId);

    // Make PUT request to submit the case
    this.apiService.put(`/case/cases/submit/${caseId}/`, {}).subscribe({
      next: (response: any) => {
        console.log('✅ Case submitted successfully:', response);
        this.handleSubmissionSuccess();
      },
      error: (error: any) => {
        console.error('❌ Case submission failed:', error);
        this.isSubmitting = false;
        this.snackBar.open('Case was created but submission failed. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
    });
  }

  private handleSubmissionSuccess(): void {
    this.isSubmitting = false;
    this.snackBar.open('🎉 Application submitted successfully!', 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });

    // Navigate back to home with a small delay to show the success message
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  }
}
