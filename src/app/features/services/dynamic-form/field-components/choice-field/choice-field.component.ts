// src/app/features/services/dynamic-form/field-components/choice-field/choice-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-choice-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChoiceFieldComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field.display_name }}</mat-label>
      <mat-select [formControl]="control"
                  [multiple]="isMultiple()"
                  [disabled]="field.is_disabled">
        <mat-option *ngFor="let option of getOptions()" [value]="option.id">
          {{ option.name }}
        </mat-option>
      </mat-select>
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
export class ChoiceFieldComponent implements ControlValueAccessor {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Input() options: any[] = [];
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

  isMultiple(): boolean {
    return this.field.max_selections !== 1;
  }

  getOptions(): any[] {
    return this.field.allowed_lookups || this.options || [];
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
