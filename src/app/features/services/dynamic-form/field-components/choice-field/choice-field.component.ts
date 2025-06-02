// Fix choice-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ServiceFlowField, LookupOption } from '../../../../../core/models/interfaces';
import { ApiService } from '../../../../../core/services/api.service';

@Component({
  selector: 'app-choice-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
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

      <!-- Loading State -->
      @if (isLoading) {
        <mat-select disabled>
          <mat-option>
            <mat-spinner diameter="20"></mat-spinner>
            Loading options...
          </mat-option>
        </mat-select>
      } @else if (hasError) {
        <!-- Error State -->
        <mat-select disabled>
          <mat-option>
            <mat-icon>error</mat-icon>
            Failed to load options
          </mat-option>
        </mat-select>
      } @else {
        <!-- Normal State -->
        <mat-select [formControl]="control"
                    [multiple]="isMultiple()"
                    [disabled]="field.is_disabled">
          @if (!isMultiple() && !field.mandatory) {
            <mat-option [value]="null">-- Please select --</mat-option>
          }
          @for (option of availableOptions; track option.id) {
            <mat-option [value]="option.id">
              {{ option.name }}
              @if (option.name_ara) {
                <span class="option-arabic"> ({{ option.name_ara }})</span>
              }
            </mat-option>
          }
          @if (availableOptions.length === 0 && !isLoading) {
            <mat-option disabled>No options available</mat-option>
          }
        </mat-select>
      }

      @if (field.mandatory) {
        <mat-error *ngIf="control.hasError('required')">
          {{ field.display_name }} is required
        </mat-error>
      }
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }

    .option-arabic {
      color: #666;
      font-style: italic;
    }
  `]
})
export class ChoiceFieldComponent implements ControlValueAccessor, OnInit, OnDestroy, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Input() staticOptions: LookupOption[] = [];
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl(null);
  availableOptions: LookupOption[] = [];
  isLoading = false;
  hasError = false;

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    console.log('🔧 ChoiceField: Initializing field:', this.field.name, 'Lookup:', this.field.lookup, 'Initial value:', this.value);

    // Set up form control validation
    this.setupValidation();

    // Load options based on field configuration
    this.loadOptions().then(() => {
      // Set initial value after options are loaded
      this.setInitialValue();
    });

    // Subscribe to value changes
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      console.log('📝 ChoiceField: Value changed for', this.field.name, ':', value);

      const formattedValue = this.formatValueForEmission(value);

      this.onChange(formattedValue);
      this.valueChange.emit(formattedValue);
      this.onTouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.control && this.availableOptions.length > 0) {
      this.updateControlValue(changes['value'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setInitialValue(): void {
    if (this.value !== null && this.value !== undefined) {
      this.updateControlValue(this.value);
    }
  }

  private updateControlValue(value: any): void {
    let controlValue = value;

    if (this.isMultiple()) {
      // Multiple selection - ensure it's an array
      controlValue = Array.isArray(value) ? value : (value ? [value] : []);
    } else {
      // Single selection - extract from array if needed
      controlValue = Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
    }

    if (JSON.stringify(this.control.value) !== JSON.stringify(controlValue)) {
      console.log('🔄 ChoiceField: Updating control value for', this.field.name, ':', controlValue);
      this.control.setValue(controlValue, { emitEvent: false });
    }
  }

  private formatValueForEmission(value: any): any {
    if (this.isMultiple()) {
      return Array.isArray(value) ? value : (value ? [value] : []);
    } else {
      return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
    }
  }

  private setupValidation(): void {
    if (this.field.mandatory) {
      this.control.addValidators((control) => {
        const value = control.value;
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return { required: true };
        }
        return null;
      });
    }
  }

  private async loadOptions(): Promise<void> {
    // Case 1: Static options provided directly
    if (this.staticOptions && this.staticOptions.length > 0) {
      console.log('📋 ChoiceField: Using static options:', this.staticOptions.length);
      this.availableOptions = this.staticOptions;
      return Promise.resolve();
    }

    // Case 2: Field has allowed_lookups but no lookup ID
    if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0 && !this.field.lookup) {
      console.log('📋 ChoiceField: Using field allowed_lookups:', this.field.allowed_lookups.length);
      this.availableOptions = this.field.allowed_lookups;
      return Promise.resolve();
    }

    // Case 3: Field has lookup ID - fetch from API
    if (this.field.lookup) {
      console.log('🌐 ChoiceField: Fetching lookup options for parent:', this.field.lookup);
      return this.fetchLookupOptions();
    }

    // Case 4: No options available
    console.warn('⚠️ ChoiceField: No options source found for field:', this.field.name);
    this.availableOptions = [];
    return Promise.resolve();
  }

  private fetchLookupOptions(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    return new Promise((resolve) => {
      this.apiService.getLookupOptions(this.field.lookup!).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          console.log('✅ ChoiceField: Lookup options loaded:', response);

          const allOptions: LookupOption[] = response.results || [];

          if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0) {
            const allowedIds = this.field.allowed_lookups.map(opt => opt.id);
            this.availableOptions = allOptions.filter(opt => allowedIds.includes(opt.id));
          } else {
            this.availableOptions = allOptions;
          }

          this.isLoading = false;
          resolve();
        },
        error: (error: any) => {
          console.error('❌ ChoiceField: Error loading lookup options:', error);
          this.hasError = true;
          this.isLoading = false;

          if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0) {
            this.availableOptions = this.field.allowed_lookups;
            this.hasError = false;
          }
          resolve();
        }
      });
    });
  }

  isMultiple(): boolean {
    return this.field.max_selections !== 1 && this.field.max_selections !== null && this.field.max_selections !== undefined;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    console.log('✏️ ChoiceField: Writing value for', this.field.name, ':', value);
    this.updateControlValue(value);
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
