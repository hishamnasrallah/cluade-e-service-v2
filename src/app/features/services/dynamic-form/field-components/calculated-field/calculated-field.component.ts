import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServiceFlowField } from '../../../../../core/models/interfaces';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-calculated-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIcon],

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalculatedFieldComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>
        {{ field.display_name }}
        <span *ngIf="field.mandatory" class="required-indicator">*</span>
      </mat-label>
      <input matInput
             [formControl]="control"
             [placeholder]="field.display_name"
             readonly
             class="calculated-field-input">
      <mat-hint>
        <mat-icon class="hint-icon">calculate</mat-icon>
        Calculated field
      </mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }

    .calculated-field-input {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }

    .hint-icon {
      font-size: 14px;
      vertical-align: middle;
      margin-right: 4px;
    }

    .required-indicator {
      color: #f44336;
      margin-left: 4px;
      font-weight: 600;
    }
  `]
})
export class CalculatedFieldComponent implements ControlValueAccessor, OnInit {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();
  @Output() fieldBlur = new EventEmitter<{ field: ServiceFlowField; value: any; changed: boolean }>();

  control = new FormControl({ value: null, disabled: true });

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    // Set initial value
    this.control.setValue(this.value, { emitEvent: false });
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Calculated fields are always disabled/readonly
  }
}
