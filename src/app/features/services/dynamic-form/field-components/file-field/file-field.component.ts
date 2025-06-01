// src/app/features/services/dynamic-form/field-components/file-field/file-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-file-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="file-field">
      <label class="file-label">
        {{ field.display_name }}
        <span *ngIf="field.mandatory" class="required-indicator">*</span>
      </label>
      <div class="file-input-container">
        <input type="file"
               #fileInput
               (change)="onFileSelected($event)"
               [accept]="getAcceptTypes()"
               [disabled]="field.is_disabled"
               class="file-input">
        <button mat-stroked-button
                type="button"
                (click)="fileInput.click()"
                [disabled]="field.is_disabled"
                class="file-button">
          <mat-icon>attach_file</mat-icon>
          Choose File
        </button>
        <span class="file-name" *ngIf="selectedFileName">
          {{ selectedFileName }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .file-field {
      margin: 16px 0;
    }

    .file-label {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: #555;
      margin-bottom: 8px;
    }

    .required-indicator {
      color: #f44336;
      margin-left: 4px;
    }

    .file-input-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-input {
      display: none;
    }

    .file-button {
      min-width: 140px;
      height: 40px;
      border: 2px dashed #bdc3c7;
      border-radius: 8px;
    }

    .file-button:hover:not(:disabled) {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.05);
    }

    .file-name {
      font-size: 14px;
      color: #27ae60;
      font-weight: 500;
    }
  `]
})
export class FileFieldComponent implements ControlValueAccessor {
  @Input() field!: ServiceFlowField;
  @Input() value: File | null = null;
  @Output() valueChange = new EventEmitter<File | null>();

  selectedFileName: string = '';

  private onChange = (value: File | null) => {};
  private onTouched = () => {};

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.onChange(file);
      this.valueChange.emit(file);
    }
  }

  getAcceptTypes(): string {
    return this.field.file_types || '*/*';
  }

  writeValue(value: File | null): void {
    this.selectedFileName = value ? value.name : '';
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // File input disabled state is handled in template
  }
}
