import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ServiceFlowField } from '../../../../../models/interfaces';

@Component({
  selector: 'app-boolean-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCheckboxModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BooleanFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="boolean-field">
      <mat-checkbox [formControl]="control" [disabled]="field.is_disabled">
        {{ field.display_name }}
        <span *ngIf="field.mandatory" class="required-indicator">*</span>
      </mat-checkbox>
    </div>
  `,
  styleUrls: ['./boolean-field.component.scss']
})
export class BooleanFieldComponent implements ControlValueAccessor, OnInit {
  @Input() field!: ServiceFlowField;
  @Input() value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  control = new FormControl(false);

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.control.valueChanges.subscribe(value => {
      const boolValue = Boolean(value);
      this.onChange(boolValue);
      this.valueChange.emit(boolValue);
    });
  }

  writeValue(value: boolean): void {
    this.control.setValue(Boolean(value), { emitEvent: false });
  }

  registerOnChange(fn: (value: boolean) => void): void {
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
