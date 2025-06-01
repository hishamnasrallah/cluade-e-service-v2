// src/app/features/services/dynamic-form/dynamic-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ServiceFlowCategory, ServiceFlowField, evaluateVisibilityCondition, LookupOption } from '../../../core/models/interfaces';
import { ApiService } from '../../../core/services/api.service';

// Import all field components
import { TextFieldComponent } from './field-components/text-field/text-field.component';
import { NumberFieldComponent } from './field-components/number-field/number-field.component';
import { BooleanFieldComponent } from './field-components/boolean-field/boolean-field.component';
import { ChoiceFieldComponent } from './field-components/choice-field/choice-field.component';
import { FileFieldComponent } from './field-components/file-field/file-field.component';
import { DecimalFieldComponent } from './field-components/decimal-field/decimal-field.component';
import { PercentageFieldComponent } from './field-components/percentage-field/percentage-field.component';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    // Field components
    TextFieldComponent,
    NumberFieldComponent,
    BooleanFieldComponent,
    ChoiceFieldComponent,
    FileFieldComponent,
    DecimalFieldComponent,
    PercentageFieldComponent
  ],
  template: `
    <div class="dynamic-form-container">
      <form [formGroup]="dynamicForm" class="dynamic-form">
        <div class="categories-container">
          <mat-expansion-panel
            *ngFor="let category of categories; trackBy: trackByCategoryId"
            [expanded]="true"
            class="category-panel">

            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="category-icon">folder</mat-icon>
                {{ category.name }}
              </mat-panel-title>
              <mat-panel-description *ngIf="category.name_ara">
                {{ category.name_ara }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="category-content">
              <!-- Loading State for Category -->
              @if (isCategoryLoading(category)) {
                <div class="category-loading">
                  <mat-spinner diameter="30"></mat-spinner>
                  <span>Loading form fields...</span>
                </div>
              }

              <div class="fields-grid" *ngIf="!isCategoryLoading(category)">
                <div
                  *ngFor="let field of getVisibleFields(category.fields); trackBy: trackByFieldId"
                  class="field-container"
                  [class]="'field-type-' + field.field_type">

                  <!-- Text Fields -->
                  <app-text-field
                    *ngIf="isTextField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-text-field>

                  <!-- Number Fields -->
                  <app-number-field
                    *ngIf="isNumberField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-number-field>

                  <!-- Boolean Fields -->
                  <app-boolean-field
                    *ngIf="isBooleanField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-boolean-field>

                  <!-- Choice Fields with improved lookup handling -->
                  <app-choice-field
                    *ngIf="isChoiceField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    [staticOptions]="getStaticOptions(field)"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-choice-field>

                  <!-- File Fields -->
                  <app-file-field
                    *ngIf="isFileField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-file-field>

                  <!-- Decimal Fields -->
                  <app-decimal-field
                    *ngIf="isDecimalField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-decimal-field>

                  <!-- Percentage Fields -->
                  <app-percentage-field
                    *ngIf="isPercentageField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    (valueChange)="onFieldChange(field.name, $event)">
                  </app-percentage-field>
                </div>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dynamic-form-container {
      width: 100%;
    }

    .categories-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-panel {
      border-radius: 12px;
      overflow: hidden;
    }

    .category-icon {
      margin-right: 8px;
      color: #666;
    }

    .category-content {
      padding: 16px 0;
    }

    .category-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: #666;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      padding: 16px 0;
    }

    .field-container {
      width: 100%;
    }

    .field-type-choice {
      min-height: 80px; /* Reserve space for loading states */
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .fields-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class DynamicFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() categories: ServiceFlowCategory[] = [];
  @Input() formData: any = {};
  @Output() formChange = new EventEmitter<any>();

  dynamicForm: FormGroup;
  private destroy$ = new Subject<void>();
  private loadingCategories = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.dynamicForm = this.fb.group({});
    console.log('🏗️ DynamicForm: Component created');
  }

  ngOnInit(): void {
    console.log('🚀 DynamicForm: Initializing with categories:', this.categories.length);
    this.buildForm();
  }

  ngOnChanges(): void {
    console.log('🔄 DynamicForm: Input changes detected');
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    console.log('🏗️ DynamicForm: Building form with', this.categories.length, 'categories');

    const formControls: any = {};

    this.categories.forEach(category => {
      console.log('📂 DynamicForm: Processing category:', category.name, 'with', category.fields.length, 'fields');

      category.fields.forEach((field: ServiceFlowField) => {
        const defaultValue = this.getDefaultValue(field);
        const currentValue = this.formData[field.name];

        // Use existing value or default
        const initialValue = currentValue !== undefined ? currentValue : defaultValue;

        formControls[field.name] = [initialValue];

        console.log('📝 DynamicForm: Added field control:', field.name, 'Type:', field.field_type, 'Value:', initialValue);
      });
    });

    this.dynamicForm = this.fb.group(formControls);

    // Subscribe to form changes
    this.dynamicForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      console.log('📊 DynamicForm: Form value changed:', Object.keys(value).length, 'fields');
      this.formChange.emit(value);
    });

    console.log('✅ DynamicForm: Form built with', Object.keys(formControls).length, 'controls');
  }

  getDefaultValue(field: ServiceFlowField): any {
    switch (field.field_type) {
      case 'boolean':
        return field.default_boolean || false;
      case 'number':
      case 'decimal':
      case 'percentage':
        return null;
      case 'choice':
        return field.max_selections === 1 ? null : [];
      case 'file':
        return null;
      default:
        return '';
    }
  }

  onFieldChange(fieldName: string, value: any): void {
    console.log('🔧 DynamicForm: Field changed:', fieldName, '=', value);

    // Update form control without triggering valueChanges
    this.dynamicForm.get(fieldName)?.setValue(value, { emitEvent: false });

    // Emit the complete form data
    this.formChange.emit(this.dynamicForm.value);
  }

  getVisibleFields(fields: ServiceFlowField[]): ServiceFlowField[] {
    return fields.filter(field => {
      // Skip hidden fields
      if (field.is_hidden) {
        return false;
      }

      // Check visibility conditions
      if (field.visibility_conditions && field.visibility_conditions.length > 0) {
        const isVisible = field.visibility_conditions.some((condition: any) =>
          evaluateVisibilityCondition(condition, this.dynamicForm.value)
        );

        if (!isVisible) {
          console.log('👁️ DynamicForm: Field hidden by conditions:', field.name);
          return false;
        }
      }

      return true;
    });
  }

  getStaticOptions(field: ServiceFlowField): LookupOption[] {
    // Only return static options if there's no lookup ID
    // If there's a lookup ID, the choice field component will handle the API call
    if (!field.lookup && field.allowed_lookups && field.allowed_lookups.length > 0) {
      console.log('📋 DynamicForm: Providing static options for', field.name, ':', field.allowed_lookups.length);
      return field.allowed_lookups;
    }

    return [];
  }

  isCategoryLoading(category: ServiceFlowCategory): boolean {
    return this.loadingCategories.has(category.id);
  }

  // Field type checking methods
  isTextField(field: ServiceFlowField): boolean {
    return field.field_type === 'text';
  }

  isNumberField(field: ServiceFlowField): boolean {
    return field.field_type === 'number';
  }

  isBooleanField(field: ServiceFlowField): boolean {
    return field.field_type === 'boolean';
  }

  isChoiceField(field: ServiceFlowField): boolean {
    return field.field_type === 'choice';
  }

  isFileField(field: ServiceFlowField): boolean {
    return field.field_type === 'file';
  }

  isDecimalField(field: ServiceFlowField): boolean {
    return field.field_type === 'decimal';
  }

  isPercentageField(field: ServiceFlowField): boolean {
    return field.field_type === 'percentage';
  }

  // Track by methods for performance
  trackByCategoryId(index: number, category: ServiceFlowCategory): number {
    return category.id;
  }

  trackByFieldId(index: number, field: ServiceFlowField): number {
    return field.field_id;
  }

  // Validation methods
  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    this.categories.forEach(category => {
      const visibleFields = this.getVisibleFields(category.fields);

      visibleFields.forEach(field => {
        const control = this.dynamicForm.get(field.name);
        const value = control?.value;

        // Check required fields
        if (field.mandatory) {
          if (!value || (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${field.display_name} is required`);
            isValid = false;
          }
        }

        // Validate choice field selections
        if (field.field_type === 'choice' && value) {
          if (field.min_selections && Array.isArray(value) && value.length < field.min_selections) {
            errors.push(`${field.display_name} requires at least ${field.min_selections} selections`);
            isValid = false;
          }

          if (field.max_selections && Array.isArray(value) && value.length > field.max_selections) {
            errors.push(`${field.display_name} allows at most ${field.max_selections} selections`);
            isValid = false;
          }
        }

        // Check other field-specific validations
        if (control?.invalid) {
          isValid = false;
          const fieldErrors = this.getFieldErrorMessages(field, control.errors || {});
          errors.push(...fieldErrors);
        }
      });
    });

    return { isValid, errors };
  }

  private getFieldErrorMessages(field: ServiceFlowField, errors: any): string[] {
    const messages: string[] = [];
    const fieldName = field.display_name || field.name;

    Object.keys(errors).forEach(errorKey => {
      switch (errorKey) {
        case 'required':
          messages.push(`${fieldName} is required`);
          break;
        case 'minlength':
          messages.push(`${fieldName} must be at least ${errors[errorKey].requiredLength} characters`);
          break;
        case 'maxlength':
          messages.push(`${fieldName} cannot exceed ${errors[errorKey].requiredLength} characters`);
          break;
        case 'min':
          messages.push(`${fieldName} must be greater than ${errors[errorKey].min}`);
          break;
        case 'max':
          messages.push(`${fieldName} must be less than ${errors[errorKey].max}`);
          break;
        case 'pattern':
          messages.push(`${fieldName} format is invalid`);
          break;
        default:
          messages.push(`${fieldName} is invalid`);
      }
    });

    return messages;
  }

  // Get form data for submission
  getFormData(): any {
    const formData = { ...this.dynamicForm.value };

    // Process form data according to field types
    this.categories.forEach(category => {
      category.fields.forEach(field => {
        const value = formData[field.name];

        if (value !== undefined && value !== null) {
          switch (field.field_type) {
            case 'number':
            case 'decimal':
              if (typeof value === 'string' && value.trim() !== '') {
                formData[field.name] = Number(value);
              }
              break;
            case 'boolean':
              formData[field.name] = Boolean(value);
              break;
            case 'choice':
              // Ensure choice values are properly formatted
              if (field.max_selections === 1 && Array.isArray(value)) {
                formData[field.name] = value[0] || null;
              } else if (field.max_selections !== 1 && !Array.isArray(value)) {
                formData[field.name] = value ? [value] : [];
              }
              break;
          }
        }
      });
    });

    console.log('📤 DynamicForm: Prepared form data for submission:', formData);
    return formData;
  }
}
