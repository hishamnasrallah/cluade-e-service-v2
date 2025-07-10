// Fix decimal-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-decimal-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DecimalFieldComponent),
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
             type="number"
             [formControl]="control"
             [placeholder]="field.display_name"
             [min]="getMinValue()"
             [max]="getMaxValue()"
             [step]="getStep()"
             [readonly]="field.is_disabled">
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
export class DecimalFieldComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl(null);

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    // Set initial value
    this.control.setValue(this.value, { emitEvent: false });

    this.control.valueChanges.subscribe(value => {
      this.onChange(value);
      this.valueChange.emit(value);
      this.onTouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.control) {
      const newValue = changes['value'].currentValue;
      if (this.control.value !== newValue) {
        this.control.setValue(newValue, { emitEvent: false });
      }
    }
  }

  getMinValue(): number | null {
    return this.field.value_greater_than ?? null;
  }

  getMaxValue(): number | null {
    return this.field.value_less_than ?? null;
  }

  getStep(): number {
    return this.field.precision ? Math.pow(10, -this.field.precision) : 0.01;
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
