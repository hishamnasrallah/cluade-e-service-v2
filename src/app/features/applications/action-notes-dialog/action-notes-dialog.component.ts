import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add Notes for "{{ data.actionName }}"</h2>
    <mat-dialog-content class="mat-typography">
      <p>Please provide any necessary notes for this action.</p>
      <form [formGroup]="notesForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="5" placeholder="Enter notes here..."></textarea>
          <mat-error *ngIf="notesForm.get('notes')?.hasError('required')">Notes are required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submitNotes()" [disabled]="notesForm.invalid">Submit</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class ActionNotesDialogComponent {
  notesForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ActionNotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actionName: string },
    private fb: FormBuilder
  ) {
    this.notesForm = this.fb.group({
      notes: ['', Validators.required]
    });
  }

  submitNotes(): void {
    if (this.notesForm.valid) {
      this.dialogRef.close(this.notesForm.value.notes);
    }
  }
}
