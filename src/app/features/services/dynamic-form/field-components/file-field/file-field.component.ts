// Fix file-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
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
        <span class="existing-file" *ngIf="!selectedFileName && hasExistingFile">
          {{ getExistingFileName() }}
          <mat-icon class="existing-file-icon">cloud_done</mat-icon>
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

    .existing-file {
      font-size: 14px;
      color: #3498db;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .existing-file-icon {
      font-size: 16px;
    }
  `]
})
export class FileFieldComponent implements ControlValueAccessor, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: File | string | null = null;
  @Output() valueChange = new EventEmitter<File | null>();

  selectedFileName: string = '';
  hasExistingFile: boolean = false;

  private onChange = (value: File | null) => {};
  private onTouched = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const newValue = changes['value'].currentValue;
      this.updateFileDisplay(newValue);
    }
  }

  private updateFileDisplay(value: any): void {
    if (value instanceof File) {
      this.selectedFileName = value.name;
      this.hasExistingFile = false;
    } else if (typeof value === 'string' && value) {
      // Existing file URL
      this.selectedFileName = '';
      this.hasExistingFile = true;
    } else {
      this.selectedFileName = '';
      this.hasExistingFile = false;
    }
  }

  getExistingFileName(): string {
    if (typeof this.value === 'string') {
      const parts = this.value.split('/');
      return parts[parts.length - 1] || 'Existing file';
    }
    return 'Existing file';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.hasExistingFile = false;
      this.onChange(file);
      this.valueChange.emit(file);
      this.onTouched();
    }
  }

  getAcceptTypes(): string {
    return this.field.file_types || '*/*';
  }

  writeValue(value: File | string | null): void {
    this.updateFileDisplay(value);
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
