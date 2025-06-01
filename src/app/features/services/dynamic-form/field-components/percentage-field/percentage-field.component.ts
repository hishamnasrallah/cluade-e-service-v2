// src/app/features/services/dynamic-form/field-components/percentage-field/percentage-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServiceFlowField } from '../../../../../models/interfaces';

@Component({
  selector: 'app-percentage-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PercentageFieldComponent),
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
             min="0"
             max="100"
             step="0.01"
             [readonly]="field.is_disabled">
      <span matSuffix>%</span>
      <mat-error *ngIf="control.hasError('required')">
        {{ field.display_name }} is required
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class PercentageFieldComponent implements ControlValueAccessor {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl(null);

  private onChange = (value: any) => {
  };
  private onTouched = () => {
  };

  ngOnInit() {
    this.control.valueChanges.subscribe(value => {
      this.onChange(value);
      this.valueChange.emit(value);
    });
  }

  writeValue(value: any): void {
    this.control.setValue(value, {emitEvent: false});
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
