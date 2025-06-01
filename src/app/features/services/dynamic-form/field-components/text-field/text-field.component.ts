// src/app/features/services/dynamic-form/field-components/text-field/text-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
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
             [maxlength]="field.max_length"
             [minlength]="field.min_length"
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
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TextFieldComponent implements ControlValueAccessor {
  @Input() field!: ServiceFlowField;
  @Input() value: any = '';
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl('');

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.control.valueChanges.subscribe(value => {
      this.onChange(value);
      this.valueChange.emit(value);
    });
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
