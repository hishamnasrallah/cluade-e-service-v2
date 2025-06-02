// src/app/features/services/dynamic-form/field-components/text-field/text-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextFieldComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field.display_name }}</mat-label>
      <input matInput
             [formControl]="control"
             [placeholder]="field.display_name"
             [maxlength]="getMaxLength()"
             [minlength]="getMinLength()"
             [readonly]="field.is_disabled">
      <mat-hint *ngIf="field.max_length">
        {{ control.value?.length || 0 }}/{{ field.max_length }}
      </mat-hint>
      <mat-error *ngIf="control.hasError('required')">
        {{ field.display_name }} is required
      </mat-error>
      <mat-error *ngIf="control.hasError('pattern')">
        Invalid format
      </mat-error>
      <mat-error *ngIf="control.hasError('minlength')">
        Minimum length is {{ field.min_length }}
      </mat-error>
      <mat-error *ngIf="control.hasError('maxlength')">
        Maximum length is {{ field.max_length }}
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TextFieldComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: any = '';
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl('');

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    // Set initial value
    this.control.setValue(this.value || '', { emitEvent: false });

    this.control.valueChanges.subscribe(value => {
      this.onChange(value);
      this.valueChange.emit(value);
      this.onTouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.control) {
      const newValue = changes['value'].currentValue || '';
      if (this.control.value !== newValue) {
        this.control.setValue(newValue, { emitEvent: false });
      }
    }
  }

  getMaxLength(): number | null {
    return this.field.max_length ?? null;
  }

  getMinLength(): number | null {
    return this.field.min_length ?? null;
  }

  writeValue(value: any): void {
    const safeValue = value || '';
    this.control.setValue(safeValue, { emitEvent: false });
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
