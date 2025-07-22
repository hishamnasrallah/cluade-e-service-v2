import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CaseService } from '../../../core/services/case.service';
import { Application, ApplicantAction } from '../../../core/models/interfaces';

@Component({
  selector: 'app-case-action',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="action-container">
      <mat-card class="action-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>play_arrow</mat-icon>
            {{ action?.name }}
          </mat-card-title>
          <mat-card-subtitle>
            Application #{{ case?.serial_number }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Loading action details...</p>
          </div>

          <div *ngIf="error" class="error-message">
            <mat-icon>error</mat-icon>
            {{ error }}
          </div>

          <form [formGroup]="actionForm" (ngSubmit)="submitAction()" *ngIf="action && !loading">
            <div class="action-info">
              <div class="info-item">
                <strong>Action:</strong> {{ action.name }}
              </div>
              <div class="info-item" *ngIf="action.to_status">
                <strong>Will change status to:</strong> {{ action.to_status }}
              </div>
              <div class="info-item" *ngIf="action.sub_status">
                <strong>Sub-status:</strong> {{ action.sub_status }}
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes {{ action.notes_mandatory ? '(Required)' : '(Optional)' }}</mat-label>
              <textarea
                matInput
                formControlName="notes"
                rows="5"
                placeholder="Enter any notes or comments...">
  </textarea>
              <mat-hint *ngIf="!action.notes_mandatory">Notes are optional for this action</mat-hint>
              <mat-error *ngIf="actionForm.get('notes')?.hasError('required')">
                Notes are required for this action
              </mat-error>
            </mat-form-field>
          </form>
        </mat-card-content>

        <mat-card-actions align="end" *ngIf="action && !loading">
          <button mat-button (click)="cancel()" [disabled]="submitting">
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="submitAction()"
            [disabled]="submitting || actionForm.invalid">
            <mat-spinner diameter="20" *ngIf="submitting"></mat-spinner>
            <span *ngIf="!submitting">Submit {{ action.name }}</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .action-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .action-card {
      border-radius: 16px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      padding: 16px;
      background: #ffebee;
      border-radius: 8px;
    }

    .action-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-item {
      font-size: 16px;
      color: #555;
    }

    .section-divider {
      margin: 24px 0;
    }

    .full-width {
      width: 100%;
    }

    mat-card-actions {
      padding: 16px;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .action-container {
        padding: 16px;
      }
    }
  `]
})
export class CaseActionComponent implements OnInit {
  case: Application | null = null;
  action: ApplicantAction | null = null;
  actionForm: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private caseService: CaseService,
    private snackBar: MatSnackBar
  ) {
    this.actionForm = this.fb.group({
      notes: ['']
    });
  }

  ngOnInit(): void {
    const caseId = Number(this.route.snapshot.paramMap.get('caseId'));
    const actionId = Number(this.route.snapshot.paramMap.get('actionId'));

    if (caseId && actionId) {
      this.loadCaseAndAction(caseId, actionId);
    } else {
      this.error = 'Invalid case or action ID';
    }
  }

  loadCaseAndAction(caseId: number, actionId: number): void {
    this.loading = true;

    this.caseService.getCaseById(caseId).subscribe({
      next: (caseData) => {
        this.case = caseData;
        this.action = caseData.available_applicant_actions?.find(
          (a: ApplicantAction) => a.id === actionId
        ) || null;

        if (!this.action) {
          this.error = 'Action not available';
        } else {
          // Set validators based on notes_mandatory
          if (this.action.notes_mandatory) {
            this.actionForm.get('notes')?.setValidators([Validators.required]);
          } else {
            this.actionForm.get('notes')?.clearValidators();
          }
          this.actionForm.get('notes')?.updateValueAndValidity();
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load case details';
        this.loading = false;
      }
    });
  }

  submitAction(): void {
    if (!this.case || !this.action) return;

    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const actionData = {
      action_id: this.action.id,
      notes: this.actionForm.value.notes
    };

    this.caseService.submitApplicantAction(this.case.id, actionData).subscribe({
      next: (response) => {
        // Use the action name from the current action object
        const actionName = this.action?.name || 'Action';
        this.snackBar.open(`${actionName} completed successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Navigate to application detail
        this.router.navigate(['/application', this.case!.id]);
      },
      error: (err) => {
        this.submitting = false;

        if (err.error && err.error.detail) {
          this.error = err.error.detail;
        } else {
          this.error = 'Failed to submit action. Please try again.';
        }

        this.snackBar.open(this.error || 'Failed to submit action. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/application', this.case?.id]);
  }
}
