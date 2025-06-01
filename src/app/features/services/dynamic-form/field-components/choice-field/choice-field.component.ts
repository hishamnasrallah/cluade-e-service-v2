// src/app/features/services/dynamic-form/field-components/choice-field/choice-field.component.ts
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
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

      @if (isMultiple() && field.min_selections) {
        <mat-error *ngIf="control.hasError('minSelections')">
          Please select at least {{ field.min_selections }} options
        </mat-error>
      }

      @if (isMultiple() && field.max_selections) {
        <mat-error *ngIf="control.hasError('maxSelections')">
          Please select at most {{ field.max_selections }} options
        </mat-error>
      }

      <mat-hint *ngIf="isMultiple()">
        @if (field.min_selections || field.max_selections) {
          Select {{ getSelectionHint() }}
        } @else {
          Multiple selection allowed
        }
      </mat-hint>
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

    .loading-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-option {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
    }
  `]
})
export class ChoiceFieldComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Input() staticOptions: LookupOption[] = []; // For cases where options are passed directly
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
    console.log('🔧 ChoiceField: Initializing field:', this.field.name, 'Lookup:', this.field.lookup);

    // Set up form control validation
    this.setupValidation();

    // Load options based on field configuration
    this.loadOptions();

    // Subscribe to value changes
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      console.log('📝 ChoiceField: Value changed for', this.field.name, ':', value);
      this.onChange(value);
      this.valueChange.emit(value);
      this.onTouched();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    if (this.isMultiple()) {
      if (this.field.min_selections) {
        this.control.addValidators((control) => {
          const value = control.value;
          if (Array.isArray(value) && value.length < this.field.min_selections!) {
            return { minSelections: { required: this.field.min_selections, actual: value.length } };
          }
          return null;
        });
      }

      if (this.field.max_selections) {
        this.control.addValidators((control) => {
          const value = control.value;
          if (Array.isArray(value) && value.length > this.field.max_selections!) {
            return { maxSelections: { required: this.field.max_selections, actual: value.length } };
          }
          return null;
        });
      }
    }
  }

  private loadOptions(): void {
    // Case 1: Static options provided directly (highest priority)
    if (this.staticOptions && this.staticOptions.length > 0) {
      console.log('📋 ChoiceField: Using static options:', this.staticOptions.length);
      this.availableOptions = this.staticOptions;
      return;
    }

    // Case 2: Field has allowed_lookups but no lookup ID (static data from field)
    if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0 && !this.field.lookup) {
      console.log('📋 ChoiceField: Using field allowed_lookups:', this.field.allowed_lookups.length);
      this.availableOptions = this.field.allowed_lookups;
      return;
    }

    // Case 3: Field has lookup ID - fetch from API
    if (this.field.lookup) {
      console.log('🌐 ChoiceField: Fetching lookup options for parent:', this.field.lookup);
      this.fetchLookupOptions();
      return;
    }

    // Case 4: No options available
    console.warn('⚠️ ChoiceField: No options source found for field:', this.field.name);
    this.availableOptions = [];
  }

  private fetchLookupOptions(): void {
    this.isLoading = true;
    this.hasError = false;

    this.apiService.getLookupOptions(this.field.lookup!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('✅ ChoiceField: Lookup options loaded:', response);

        const allOptions: LookupOption[] = response.results || [];

        // Filter by allowed_lookups if specified
        if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0) {
          const allowedIds = this.field.allowed_lookups.map(opt => opt.id);
          this.availableOptions = allOptions.filter(opt => allowedIds.includes(opt.id));
          console.log('🔍 ChoiceField: Filtered options:', this.availableOptions.length, 'of', allOptions.length);
        } else {
          this.availableOptions = allOptions;
          console.log('📋 ChoiceField: Using all options:', this.availableOptions.length);
        }

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ ChoiceField: Error loading lookup options:', error);
        this.hasError = true;
        this.isLoading = false;

        // Fallback to allowed_lookups if API fails
        if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0) {
          console.log('🔄 ChoiceField: Falling back to allowed_lookups');
          this.availableOptions = this.field.allowed_lookups;
          this.hasError = false;
        }
      }
    });
  }

  isMultiple(): boolean {
    return this.field.max_selections !== 1;
  }

  getSelectionHint(): string {
    const min = this.field.min_selections;
    const max = this.field.max_selections;

    if (min && max) {
      return `${min}-${max} options`;
    } else if (min) {
      return `at least ${min} options`;
    } else if (max) {
      return `up to ${max} options`;
    }
    return '';
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    console.log('✏️ ChoiceField: Setting value for', this.field.name, ':', value);
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
