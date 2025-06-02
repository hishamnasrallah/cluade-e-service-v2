// Fix boolean-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

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
      <mat-checkbox
        [formControl]="control"
        [disabled]="field.is_disabled"
        (change)="onCheckboxChange($event)">
        {{ field.display_name }}
        <span *ngIf="field.mandatory" class="required-indicator">*</span>
      </mat-checkbox>

      <!-- Debug info -->
      <div class="debug-info" *ngIf="showDebug">
        <small>Value: {{ control.value }}, Type: {{ typeof control.value }}</small>
      </div>
    </div>
  `,
  styles: [`
    .boolean-field {
      margin: 16px 0;
      width: 100%;
    }

    .required-indicator {
      color: #f44336;
      margin-left: 4px;
      font-weight: 600;
    }

    .debug-info {
      margin-top: 4px;
      font-size: 11px;
      color: #666;
      font-family: monospace;
    }
  `]
})
export class BooleanFieldComponent implements ControlValueAccessor, OnInit, OnDestroy, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  control = new FormControl(false);
  showDebug = false;

  private destroy$ = new Subject<void>();
  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    console.log('✅ BooleanField: Initializing field:', this.field.name, 'Initial value:', this.value);

    // Set initial value
    const initialValue = this.convertToBoolean(this.value);
    this.control.setValue(initialValue, { emitEvent: false });

    // Subscribe to value changes
    this.control.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      const boolValue = this.convertToBoolean(value);
      console.log('📝 BooleanField: Value changed for', this.field.name, ':', boolValue, 'Type:', typeof boolValue);

      this.onChange(boolValue);
      this.valueChange.emit(boolValue);
      this.onTouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.control) {
      const newValue = this.convertToBoolean(changes['value'].currentValue);
      if (this.control.value !== newValue) {
        console.log('🔄 BooleanField: Input value changed for', this.field.name, ':', newValue);
        this.control.setValue(newValue, { emitEvent: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCheckboxChange(event: any): void {
    const checked = event.checked;
    console.log('✅ BooleanField: Checkbox changed for', this.field.name, ':', checked);

    const boolValue = this.convertToBoolean(checked);

    if (this.control.value !== boolValue) {
      this.control.setValue(boolValue, { emitEvent: true });
    }
  }

  private convertToBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'on';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    const boolValue = this.convertToBoolean(value);
    console.log('✏️ BooleanField: Writing value for', this.field.name, ':', boolValue, 'Original:', value);
    this.control.setValue(boolValue, { emitEvent: false });
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
