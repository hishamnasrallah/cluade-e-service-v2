// src/app/features/services/dynamic-form/field-components/number-field/number-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFieldComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field.display_name }}</mat-label>
      <input matInput
             type="number"
             [formControl]="control"
             [placeholder]="field.display_name"
             [min]="getMinValue()"
             [max]="getMaxValue()"
             [step]="field.integer_only ? 1 : 0.01"
             [readonly]="field.is_disabled">
      <mat-error *ngIf="control.hasError('required')">
        {{ field.display_name }} is required
      </mat-error>
      <mat-error *ngIf="control.hasError('min')">
        Value must be greater than {{ getMinValue() }}
      </mat-error>
      <mat-error *ngIf="control.hasError('max')">
        Value must be less than {{ getMaxValue() }}
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class NumberFieldComponent implements ControlValueAccessor {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl(null);

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.control.valueChanges.subscribe(value => {
      this.onChange(value);
      this.valueChange.emit(value);
    });
  }

  getMinValue(): number | null {
    return this.field.value_greater_than ?? null;
  }

  getMaxValue(): number | null {
    return this.field.value_less_than ?? null;
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
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }
}
