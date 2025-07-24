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
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatChip} from '@angular/material/chips';

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
    DynamicFormComponent,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    MatChip
  ],
  template: `
    <div class="service-wizard-container">
      <!-- Enhanced Header -->
      <div class="wizard-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1 class="wizard-title">
              {{ isEditMode ? 'Edit Application' : 'Service Application' }}
            </h1>
            <p class="wizard-subtitle" *ngIf="serviceCode">
              <span class="subtitle-item">
                <mat-icon class="subtitle-icon">qr_code_2</mat-icon>
                Service Code: {{ serviceCode }}
              </span>
              <span class="subtitle-divider">•</span>
              <span class="subtitle-item">
                <mat-icon class="subtitle-icon">tag</mat-icon>
                Service ID: {{ serviceId }}
              </span>
              <span *ngIf="isEditMode && existingApplication" class="subtitle-item">
                <span class="subtitle-divider">•</span>
                <mat-icon class="subtitle-icon">description</mat-icon>
                Application #{{ existingApplication.serial_number }}
              </span>
            </p>
          </div>
          <div class="header-actions" *ngIf="!isLoading">
            <button mat-button (click)="saveDraft()" [disabled]="isSubmitting" class="header-draft-btn">
              <mat-icon>save</mat-icon>
              {{ isEditMode ? 'Save Changes' : 'Save Draft' }}
            </button>
            <mat-chip *ngIf="isEditMode" class="edit-mode-chip">
              <mat-icon class="chip-icon">edit</mat-icon>
              Edit Mode
            </mat-chip>
          </div>
        </div>
      </div>

      <!-- Horizontal Progress Steps -->
      <div class="horizontal-stepper-container" *ngIf="!isLoading && visibleSteps.length > 0">
        <div class="stepper-wrapper">
          <div class="stepper-header">
            <div class="stepper-progress-bar">
              <div class="progress-track"></div>
              <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
            </div>
            <div class="stepper-steps">
              <div
                *ngFor="let step of visibleSteps; let i = index"
                class="stepper-step"
                [class.active]="i === wizardState.currentStep"
                [class.completed]="wizardState.completedSteps[i]"
                [class.clickable]="i < wizardState.currentStep || wizardState.completedSteps[i]"
                (click)="goToStep(i)">
                <div class="step-indicator">
                  <span class="step-number" *ngIf="!wizardState.completedSteps[i]">{{ i + 1 }}</span>
                  <mat-icon class="step-icon" *ngIf="wizardState.completedSteps[i]">check</mat-icon>
                </div>
                <div class="step-info">
                  <span class="step-name">{{ step.name }}</span>
                  <span class="step-status">
                    {{ i === wizardState.currentStep ? 'Current' :
                    (wizardState.completedSteps[i] ? 'Completed' : 'Pending') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <div class="loading-card">
          <mat-spinner diameter="60"></mat-spinner>
          <h3 class="loading-title">
            {{ isEditMode ? 'Loading Application' : 'Preparing Service Form' }}
          </h3>
          <p class="loading-text">
            {{ isEditMode ? 'Retrieving your application data...' : 'Setting up the service flow...' }}
          </p>
          <div class="loading-animation">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <mat-card class="error-card" *ngIf="error && !isLoading">
        <mat-card-content>
          <div class="error-content">
            <div class="error-icon-wrapper">
              <mat-icon class="error-icon">error_outline</mat-icon>
            </div>
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

      <!-- Wizard Content -->
      <div class="wizard-content" *ngIf="!isLoading && !error && currentStep">
        <!-- Step Header -->
        <div class="step-header">
          <h2 class="step-title">{{ currentStep.name }}</h2>
          <div class="step-progress-info">
            <span class="progress-text">Step {{ wizardState.currentStep + 1 }} of {{ wizardState.totalSteps }}</span>
            <span class="progress-percentage">{{ getProgressPercentage().toFixed(0) }}% Complete</span>
          </div>
        </div>

        <!-- Step Description -->
        <div class="step-description-wrapper" *ngIf="currentStep.description">
          <mat-card class="description-card">
            <mat-card-content>
              <mat-icon class="description-icon">info</mat-icon>
              <div class="description-text" [innerHTML]="formatDescription(currentStep.description)"></div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Review Page Notice -->
        <div class="review-page-notice" *ngIf="currentStep.is_review_page">
          <mat-card class="review-notice-card">
            <mat-card-content>
              <div class="review-notice-content">
                <mat-icon class="review-notice-icon">visibility</mat-icon>
                <div class="review-notice-text">
                  <strong>Review Page:</strong> Please review all the information you have entered.
                  All fields are read-only on this page. Use the Previous button to go back and make changes if needed.
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Edit Mode Notice -->
        <div class="edit-notice" *ngIf="isEditMode && wizardState.currentStep === 0">
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

        <!-- Dynamic Form -->
        <div class="form-wrapper">
          <app-dynamic-form
            [categories]="currentStep.categories"
            [formData]="wizardState.formData"
            [isReviewMode]="currentStep.is_review_page || false"
            (formChange)="onFormChange($event)">
          </app-dynamic-form>
        </div>

        <!-- Validation Messages -->
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

        <!-- Navigation Actions -->
        <div class="wizard-actions">
          <button mat-stroked-button
                  (click)="previousStep()"
                  [disabled]="wizardState.currentStep === 0"
                  class="action-btn prev-btn">
            <mat-icon>navigate_before</mat-icon>
            Previous
          </button>

          <div class="action-spacer"></div>

          <button mat-button
                  (click)="debugMode = !debugMode"
                  *ngIf="!isSubmitting"
                  class="debug-toggle-btn">
            <mat-icon>bug_report</mat-icon>
            Debug
          </button>

          <button mat-raised-button
                  color="primary"
                  (click)="nextStep()"
                  [disabled]="isSubmitting || (currentStepValidation && !currentStepValidation.isValid)"
                  class="action-btn next-btn">
            <mat-spinner diameter="20" *ngIf="isSubmitting && isLastStep()"></mat-spinner>
            <span class="btn-content" *ngIf="!isSubmitting || !isLastStep()">
              {{ isLastStep() ? (isEditMode ? 'Update Application' : 'Submit Application') : 'Next Step' }}
              <mat-icon class="btn-icon-right" *ngIf="!isLastStep()">navigate_next</mat-icon>
              <mat-icon class="btn-icon-right" *ngIf="isLastStep() && !isEditMode">send</mat-icon>
              <mat-icon class="btn-icon-right" *ngIf="isLastStep() && isEditMode">update</mat-icon>
            </span>
          </button>
        </div>

        <!-- Debug Panel -->
        <div class="debug-panel" *ngIf="debugMode">
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>bug_report</mat-icon>
                Debug Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="debug-content">
              <h5>Complete Wizard Form Data:</h5>
              <pre>{{ wizardState.formData | json }}</pre>
              <h5>Current Step Fields:</h5>
              <pre>{{ getCurrentStepFieldNames() | json }}</pre>
              <h5>Edit Mode Info:</h5>
              <pre>{{ getEditModeDebugInfo() | json }}</pre>
              <div class="debug-actions">
                <button mat-button (click)="debugVisibilityConditions()">Debug Visibility</button>
                <button mat-button (click)="debugMode = false">Hide Debug</button>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-wizard-container {
      min-height: 100vh;
      background: #f8f9fa;
    }

    /* Enhanced Header */
    .wizard-header {
      background: white;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .back-btn {
      background: #f8f9fa;
      color: #6c757d;
      width: 48px;
      height: 48px;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: #e9ecef;
      color: #495057;
      transform: translateX(-2px);
    }

    .header-info {
      flex: 1;
    }

    .wizard-title {
      font-size: 28px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
      line-height: 1.2;
    }

    .wizard-subtitle {
      font-size: 14px;
      color: #7f8c8d;
      margin: 8px 0 0 0;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .subtitle-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .subtitle-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #95a5a6;
    }

    .subtitle-divider {
      color: #cbd5e0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-draft-btn {
      border: 2px solid #17a2b8;
      color: #17a2b8;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .header-draft-btn:hover {
      background: #17a2b8;
      color: white;
      box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
    }

    .edit-mode-chip {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      color: white;
      font-weight: 600;
      padding: 4px 16px;
      height: 32px;
    }

    .chip-icon {
      font-size: 16px !important;
      margin-right: 4px;
    }

    /* Horizontal Stepper */
    .horizontal-stepper-container {
      background: white;
      padding: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 32px;
    }

    .stepper-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .stepper-header {
      position: relative;
    }

    .stepper-progress-bar {
      position: absolute;
      top: 28px;
      left: 40px;
      right: 40px;
      height: 4px;
      z-index: 0;
    }

    .progress-track {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: #e9ecef;
      border-radius: 2px;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, #2EC4B6 0%, #2BA99B 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .stepper-steps {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }

    .stepper-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: default;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 8px;
    }

    .stepper-step.clickable {
      cursor: pointer;
    }

    .stepper-step.clickable:hover {
      background: rgba(46, 196, 182, 0.05);
    }

    .step-indicator {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: white;
      border: 3px solid #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: #95a5a6;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .stepper-step.active .step-indicator {
      border-color: #2EC4B6;
      color: #2EC4B6;
      transform: scale(1.1);
      box-shadow: 0 4px 16px rgba(46, 196, 182, 0.3);
    }

    .stepper-step.completed .step-indicator {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      border-color: #2EC4B6;
      color: white;
    }

    .step-icon {
      font-size: 28px;
    }

    .step-info {
      text-align: center;
      max-width: 150px;
    }

    .step-name {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      line-height: 1.3;
      display: block;
      margin-bottom: 4px;
    }

    .step-status {
      font-size: 12px;
      color: #95a5a6;
      display: block;
    }

    .stepper-step.active .step-status {
      color: #2EC4B6;
      font-weight: 600;
    }

    .stepper-step.completed .step-status {
      color: #27ae60;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      padding: 40px;
    }

    .loading-card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    .loading-title {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      margin: 24px 0 12px 0;
    }

    .loading-text {
      color: #7f8c8d;
      font-size: 16px;
      margin: 0 0 24px 0;
    }

    .loading-animation {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .loading-dot {
      width: 8px;
      height: 8px;
      background: #2EC4B6;
      border-radius: 50%;
      animation: loadingBounce 1.4s ease-in-out infinite;
    }

    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes loadingBounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    /* Error State */
    .error-card {
      margin: 40px auto;
      max-width: 600px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
    }

    .error-icon-wrapper {
      width: 80px;
      height: 80px;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .error-icon {
      font-size: 48px;
      color: #e74c3c;
    }

    .error-details h3 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 22px;
      font-weight: 600;
    }

    .error-details p {
      margin: 0 0 20px 0;
      color: #7f8c8d;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 12px;
    }

    /* Wizard Content */
    .wizard-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 24px 40px;
    }

    .step-header {
      background: white;
      border-radius: 16px;
      padding: 24px 32px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .step-title {
      font-size: 32px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
    }

    .step-progress-info {
      text-align: right;
    }

    .progress-text {
      font-size: 14px;
      color: #7f8c8d;
      display: block;
      margin-bottom: 4px;
    }

    .progress-percentage {
      font-size: 20px;
      font-weight: 700;
      color: #2EC4B6;
      display: block;
    }

    /* Description Card */
    .step-description-wrapper {
      margin-bottom: 24px;
    }

    .description-card {
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #f0fffe 0%, #e6faf8 100%);
      box-shadow: 0 2px 8px rgba(46, 196, 182, 0.1);
    }

    .description-card mat-card-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 20px 24px;
    }

    .description-icon {
      color: #2EC4B6;
      font-size: 24px;
      flex-shrink: 0;
    }

    .description-text {
      color: #2c3e50;
      line-height: 1.6;
      flex: 1;
    }

    /* Review Notice */
    .review-page-notice {
      margin-bottom: 24px;
    }

    .review-notice-card {
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #e3f2fd 0%, #d6e9fb 100%);
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
    }

    .review-notice-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
    }

    .review-notice-icon {
      color: #1976d2;
      font-size: 24px;
      flex-shrink: 0;
    }

    .review-notice-text {
      color: #1565c0;
      line-height: 1.6;
      flex: 1;
    }

    .review-notice-text strong {
      color: #0d47a1;
    }

    /* Edit Notice */
    .edit-notice {
      margin-bottom: 24px;
    }

    .notice-card {
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #fff9f0 0%, #ffedda 100%);
      box-shadow: 0 2px 8px rgba(243, 156, 18, 0.1);
    }

    .notice-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
    }

    .notice-icon {
      color: #f39c12;
      font-size: 24px;
      flex-shrink: 0;
    }

    .notice-text {
      color: #d68910;
      line-height: 1.6;
      flex: 1;
    }

    /* Form Wrapper */
    .form-wrapper {
      background: white;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    /* Validation Messages */
    .validation-messages {
      margin-bottom: 24px;
    }

    .validation-card {
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #fff9f0 0%, #ffedda 100%);
      box-shadow: 0 2px 8px rgba(243, 156, 18, 0.1);
    }

    .validation-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #e67e22;
      font-size: 16px;
    }

    .warning-icon {
      color: #f39c12;
      font-size: 24px;
    }

    .validation-list {
      margin: 0;
      padding-left: 36px;
      color: #d35400;
    }

    .validation-list li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    /* Navigation Actions */
    .wizard-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      border-radius: 16px;
      padding: 24px 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: sticky;
      bottom: 24px;
      z-index: 50;
    }

    .action-btn {
      height: 48px;
      border-radius: 24px;
      font-weight: 600;
      font-size: 16px;
      padding: 0 32px;
      transition: all 0.3s ease;
    }

    .prev-btn {
      color: #6c757d;
      border: 2px solid #dee2e6;
    }

    .prev-btn:hover:not(:disabled) {
      border-color: #6c757d;
      background: #f8f9fa;
    }

    .prev-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-spacer {
      flex: 1;
    }

    .debug-toggle-btn {
      color: #6f42c1;
      font-weight: 600;
    }

    .next-btn {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      color: white;
      min-width: 200px;
      box-shadow: 0 4px 16px rgba(46, 196, 182, 0.3);
    }

    .next-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #2BA99B 0%, #2EC4B6 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(46, 196, 182, 0.4);
    }

    .next-btn:disabled {
      background: #bdc3c7;
      color: #95a5a6;
      box-shadow: none;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-icon-right {
      font-size: 20px;
      margin-left: 4px;
    }

    /* Debug Panel */
    .debug-panel {
      margin-top: 24px;
    }

    .debug-panel mat-expansion-panel {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .debug-content {
      padding: 16px;
    }

    .debug-content h5 {
      margin: 16px 0 8px 0;
      color: #495057;
      font-size: 14px;
      font-weight: 600;
    }

    .debug-content pre {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
      overflow-x: auto;
      font-size: 12px;
      max-height: 300px;
      margin: 0 0 16px 0;
    }

    .debug-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .stepper-step {
        padding: 4px;
      }

      .step-info {
        max-width: 120px;
      }

      .step-name {
        font-size: 13px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-wrap: wrap;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .wizard-title {
        font-size: 24px;
      }

      .stepper-steps {
        overflow-x: auto;
        padding-bottom: 16px;
      }

      .stepper-progress-bar {
        display: none;
      }

      .step-indicator {
        width: 48px;
        height: 48px;
        font-size: 16px;
      }

      .step-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .step-progress-info {
        text-align: left;
      }

      .step-title {
        font-size: 24px;
      }

      .form-wrapper {
        padding: 24px 16px;
      }

      .wizard-actions {
        flex-direction: column;
        padding: 16px;
        position: relative;
        bottom: 0;
      }

      .action-btn {
        width: 100%;
      }

      .action-spacer {
        display: none;
      }

      .debug-toggle-btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .stepper-wrapper {
        padding: 24px 16px;
      }

      .wizard-content {
        padding: 0 16px 24px;
      }

      .step-info {
        display: none;
      }

      .wizard-subtitle {
        font-size: 12px;
      }

      .subtitle-item {
        font-size: 12px;
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

    // DynamicFormComponent will handle calculations when it receives this data
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
    // If field has default_value from backend, convert it based on field type
    if (field.default_value !== undefined && field.default_value !== null) {
      return this.convertDefaultValue(field.default_value, field.field_type);
    }

    // Fall back to legacy behavior
    switch (field.field_type) {
      case 'boolean':
        return field.default_boolean || false;
      case 'number':
      case 'decimal':
      case 'percentage':
      case 'calculated_field':
        return null;
      case 'choice':
        return field.max_selections === 1 ? null : [];
      case 'file':
        return null;
      default:
        return '';
    }
  }

  /**
   * Convert default value string to appropriate type based on field type
   */
  private convertDefaultValue(defaultValue: string, fieldType: string): any {
    // Same implementation as in dynamic-form.component.ts
    // Handle empty string
    if (defaultValue === '') {
      switch (fieldType) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'url':
        case 'phone_number':
          return '';
        case 'number':
        case 'decimal':
        case 'percentage':
        case 'currency':
        case 'calculated_field':
          return null;
        case 'boolean':
          return false;
        case 'choice':
        case 'multi_choice':
          return null;
        case 'date':
        case 'datetime':
        case 'time':
          return null;
        default:
          return null;
      }
    }

    // Convert based on field type
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'phone_number':
      case 'password':
      case 'uuid':
      case 'ip_address':
      case 'slug':
      case 'color_picker':
      case 'richtext':
        return defaultValue;

      case 'number':
      case 'decimal':
      case 'percentage':
      case 'currency':
      case 'calculated_field':
        const num = Number(defaultValue);
        return isNaN(num) ? null : num;

      case 'boolean':
        const lowerValue = defaultValue.toLowerCase().trim();
        return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'on';

      case 'date':
      case 'datetime':
        try {
          const date = new Date(defaultValue);
          if (!isNaN(date.getTime())) {
            return defaultValue;
          }
        } catch (e) {
          console.warn('Invalid date default value:', defaultValue);
        }
        return null;

      case 'time':
        return defaultValue;

      case 'choice':
      case 'lookup':
        const choiceNum = Number(defaultValue);
        return isNaN(choiceNum) ? defaultValue : choiceNum;

      case 'multi_choice':
        try {
          const parsed = JSON.parse(defaultValue);
          if (Array.isArray(parsed)) {
            return parsed.map(val => {
              const num = Number(val);
              return isNaN(num) ? val : num;
            });
          }
        } catch (e) {
          const num = Number(defaultValue);
          return [isNaN(num) ? defaultValue : num];
        }
        return [];

      case 'json':
      case 'array':
        try {
          return JSON.parse(defaultValue);
        } catch (e) {
          console.warn('Invalid JSON default value:', defaultValue);
          return null;
        }

      default:
        const unknownNum = Number(defaultValue);
        if (!isNaN(unknownNum) && defaultValue.trim() !== '') {
          return unknownNum;
        }
        return defaultValue;
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

    // Collect file types mapping from form fields
    const fileTypesMapping = this.collectFileTypesMapping();

    const caseData: any = {
      applicant_type: 13, // This should be configurable or from user profile
      case_type: this.serviceId,
      case_data: this.wizardState.formData,
      file_types_mapping: fileTypesMapping
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

    // Collect file types mapping from form fields
    const fileTypesMapping = this.collectFileTypesMapping();

    const caseData: any = {
      applicant_type: this.existingApplication?.applicant_type || 13,
      case_type: this.existingApplication?.case_type || this.serviceId,
      case_data: this.wizardState.formData,
      file_types_mapping: fileTypesMapping
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

  private collectFileTypesMapping(): { [fieldName: string]: string } {
    const fileTypesMapping: { [fieldName: string]: string } = {};

    // Iterate through all service flow steps to find file fields
    this.serviceFlowSteps.forEach(step => {
      step.categories.forEach(category => {
        category.fields.forEach(field => {
          if (field.field_type === 'file' && this.wizardState.formData[field.name]) {
            // Get the file type code from allowed_lookups
            if (field.allowed_lookups && field.allowed_lookups.length > 0) {
              const fileTypeCode = field.allowed_lookups[0].code;
              fileTypesMapping[field.name] = fileTypeCode;
              console.log(`📎 ServiceWizard: File type mapping - ${field.name}: code="${fileTypeCode}" (${field.allowed_lookups[0].name})`);
            } else {
              // Fallback to default if no allowed_lookups
              fileTypesMapping[field.name] = '01';
              console.log(`📎 ServiceWizard: No file type found for ${field.name}, using default "01"`);
            }
          }
        });
      });
    });

    console.log('📎 ServiceWizard: Collected file types mapping:', fileTypesMapping);
    return fileTypesMapping;
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
  goToStep(stepIndex: number): void {
    // Only allow navigation to previous steps or completed steps
    if (stepIndex < this.wizardState.currentStep || this.wizardState.completedSteps[stepIndex]) {
      this.wizardState.currentStep = stepIndex;
      this.validateCurrentStep();
      console.log('📍 ServiceWizard: Navigated to step', stepIndex + 1);
    }
  }
}
