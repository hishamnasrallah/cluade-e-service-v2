// Enhanced dynamic-form.component.ts with better edit mode support
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  SimpleChanges
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

import {
  ServiceFlowCategory,
  ServiceFlowField,
  evaluateVisibilityCondition,
  LookupOption
} from '../../../core/models/interfaces';
import {ApiService} from '../../../core/services/api.service';
import { FieldIntegrationService } from '../../../core/services/field-integration.service';

// Import all field components
import {TextFieldComponent} from './field-components/text-field/text-field.component';
import {NumberFieldComponent} from './field-components/number-field/number-field.component';
import {BooleanFieldComponent} from './field-components/boolean-field/boolean-field.component';
import {ChoiceFieldComponent} from './field-components/choice-field/choice-field.component';
import {FileFieldComponent} from './field-components/file-field/file-field.component';
import {DecimalFieldComponent} from './field-components/decimal-field/decimal-field.component';
import {PercentageFieldComponent} from './field-components/percentage-field/percentage-field.component';
import {DateFieldComponent} from './field-components/date-field/date-field.component';
import {DatetimeFieldComponent} from './field-components/datetime-field/datetime-field.component';
import {TimeFieldComponent} from './field-components/time-field/time-field.component';
import {ColorFieldComponent} from './field-components/color-field/color-field.component';

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
    MatSnackBarModule,
    // Field components
    TextFieldComponent,
    NumberFieldComponent,
    BooleanFieldComponent,
    ChoiceFieldComponent,
    FileFieldComponent,
    DecimalFieldComponent,
    PercentageFieldComponent,
    DateFieldComponent,
    DatetimeFieldComponent,
    TimeFieldComponent,
    ColorFieldComponent
  ],
  template: `
    <div class="dynamic-form-container">
      <form [formGroup]="dynamicForm" class="dynamic-form">
        <div class="categories-container">
          <mat-expansion-panel
            *ngFor="let category of getCategoriesWithVisibleFields(); let i = index; trackBy: trackByCategoryId"
            [expanded]="isReviewMode || i === 0"
            class="category-panel"
            [class.review-mode-panel]="isReviewMode">

            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="category-icon">folder</mat-icon>
                {{ category.name }}
              </mat-panel-title>
              <mat-panel-description *ngIf="category.name_ara">
                {{ category.name_ara }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            <!-- Add review mode notice -->
            <div class="review-mode-notice" *ngIf="isReviewMode">
              <mat-icon class="review-icon">visibility</mat-icon>
              <span class="review-text">Review Mode - All fields are read-only</span>
            </div>

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
                  *ngFor="let field of getSortedVisibleFields(category.fields); trackBy: trackByFieldId"
                  class="field-container"
                  [class]="'field-type-' + field.field_type"
                  [class.no-sequence]="!hasSequence(field)">

                  <!-- Sequence indicator for fields without sequence -->
                  <div class="sequence-warning" *ngIf="!hasSequence(field)">
                    <mat-icon class="warning-icon">warning_amber</mat-icon>
                    <span class="warning-text">No sequence defined</span>
                  </div>

                  <!-- Debug info for field values -->
                  <div class="field-debug" *ngIf="debugMode && showFieldDebug">
                    <small>
                      <strong>{{ field.name }}:</strong>
                      Value: {{ getFieldValue(field.name) | json }} |
                      Type: {{ getFieldValueType(field.name) }} |
                      Visible: {{ isFieldVisible(field) }}
                    </small>
                  </div>
                  <!-- Loading indicator for field -->
                  <div class="field-loading" *ngIf="isFieldLoading(field.name)">
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Loading data...</span>
                  </div>
                  <!-- Text Fields -->
                  <app-text-field
                    *ngIf="isTextField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-text-field>

                  <!-- Number Fields -->
                  <app-number-field
                    *ngIf="isNumberField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-number-field>

                  <!-- Boolean Fields -->
                  <app-boolean-field
                    *ngIf="isBooleanField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-boolean-field>

                  <!-- Choice Fields with improved lookup handling -->
                  <app-choice-field
                    *ngIf="isChoiceField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    [staticOptions]="getStaticOptions(field)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-choice-field>

                  <!-- File Fields -->
                  <app-file-field
                    *ngIf="isFileField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-file-field>

                  <!-- Decimal Fields -->
                  <app-decimal-field
                    *ngIf="isDecimalField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-decimal-field>

                  <!-- Percentage Fields -->
                  <app-percentage-field
                    *ngIf="isPercentageField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-percentage-field>

                  <!-- Date Fields -->
                  <app-date-field
                    *ngIf="field.field_type === 'date'"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-date-field>

                  <!-- DateTime Fields -->
                  <app-datetime-field
                    *ngIf="field.field_type === 'datetime'"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-datetime-field>

                  <!-- Time Fields -->
                  <app-time-field
                    *ngIf="field.field_type === 'time'"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-time-field>

                  <!-- Color Picker Fields -->
                  <app-color-field
                    *ngIf="field.field_type === 'color_picker'"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-color-field>

                  <!-- Email Fields -->
                  <app-text-field
                    *ngIf="isEmailField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-text-field>

                  <!-- Phone Number Fields -->
                  <app-text-field
                    *ngIf="isPhoneField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-text-field>

                  <!-- URL Fields -->
                  <app-text-field
                    *ngIf="isUrlField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-text-field>

                  <!-- Other Fields (fallback) -->
                  <app-text-field
                    *ngIf="isOtherField(field)"
                    [field]="getFieldWithReviewMode(field)"
                    [value]="getFieldValue(field.name)"
                    (valueChange)="onFieldChangeWithIntegration(field, field.name, $event)">
                  </app-text-field>
                </div>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </form>

      <!-- Enhanced Debug Panel -->
      <div class="debug-panel" *ngIf="debugMode">
        <mat-expansion-panel [expanded]="debugExpanded">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>bug_report</mat-icon>
              Debug Information
            </mat-panel-title>
          </mat-expansion-panel-header>

          <div class="debug-content">
            <div class="debug-controls">
              <button mat-stroked-button (click)="showFieldDebug = !showFieldDebug">
                {{ showFieldDebug ? 'Hide' : 'Show' }} Field Debug
              </button>
              <button mat-stroked-button (click)="debugVisibilityConditions()">
                Debug Visibility
              </button>
              <button mat-stroked-button (click)="logFormData()">
                Log Form Data
              </button>
              <button mat-stroked-button (click)="validateAllFields()">
                Validate All
              </button>
              <button mat-stroked-button (click)="toggleDebug()">
                Hide Debug
              </button>
            </div>

            <h5>Form Data Summary:</h5>
            <div class="data-summary">
              <p><strong>Total Fields:</strong> {{ getTotalFieldCount() }}</p>
              <p><strong>Visible Fields:</strong> {{ getVisibleFieldCount() }}</p>
              <p><strong>Fields with Values:</strong> {{ getFieldsWithValuesCount() }}</p>
              <p><strong>Empty Fields:</strong> {{ getEmptyFieldsCount() }}</p>
            </div>

            <h5>Complete Wizard Form Data:</h5>
            <pre class="debug-json">{{ formData | json }}</pre>

            <h5>Current Step Form Data:</h5>
            <pre class="debug-json">{{ dynamicForm.value | json }}</pre>

            <h5>Fields by Category:</h5>
            <div class="category-debug" *ngFor="let category of categories">
              <h6>{{ category.name }} ({{ category.fields.length }} fields)</h6>
              <ul class="field-list">
                <li *ngFor="let field of category.fields"
                    [class.field-hidden]="!isFieldVisible(field)"
                    [class.field-mandatory]="field.mandatory">
                  <strong>{{ field.name }}</strong> ({{ field.field_type }})
                  - Value: {{ getFieldValue(field.name) | json }}
                  - Visible: {{ isFieldVisible(field) }}
                  <span *ngIf="field.mandatory" class="mandatory-indicator">[Required]</span>
                  <span *ngIf="field.visibility_conditions?.length" class="conditional-indicator">[Conditional]</span>
                </li>
              </ul>
            </div>

            <h5 *ngIf="formValidationErrors.length > 0">Validation Errors:</h5>
            <ul *ngIf="formValidationErrors.length > 0" class="validation-errors">
              <li *ngFor="let error of formValidationErrors" class="error-item">{{ error }}</li>
            </ul>
          </div>
        </mat-expansion-panel>
      </div>
    </div>
  `,
  styles: [`

    .review-mode-panel {
      border: 2px solid #2196f3;
      background: rgba(33, 150, 243, 0.05);
    }

    .review-mode-panel .mat-expansion-panel-header {
      background: rgba(33, 150, 243, 0.1);
    }

    .review-mode-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      margin: 0 -16px 16px -16px;
    }

    .review-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .review-text {
      color: #1565c0;
      font-weight: 500;
      font-size: 14px;
    }

    /* Style disabled fields in review mode */
    .review-mode-panel .field-container {
      opacity: 0.9;
    }

    .review-mode-panel .field-container::after {
      content: none; /* Remove warning animations in review mode */
    }

    .review-mode-panel .sequence-warning {
      display: none; /* Hide sequence warnings in review mode */
    }




    .field-container.no-sequence {
      position: relative;
      border: 2px dashed #ff9800;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 24px;
      background-color: rgba(255, 152, 0, 0.05);
    }

    .field-container.no-sequence::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #ff9800 0%, #f57c00 50%, #ff9800 100%);
      background-size: 200% 100%;
      animation: warningPulse 2s linear infinite;
    }

    @keyframes warningPulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .sequence-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      position: absolute;
      top: -24px;
      right: 8px;
      background: #fff3e0;
      padding: 4px 12px;
      border-radius: 12px;
      border: 1px solid #ffb74d;
      z-index: 10;
    }

    .sequence-warning .warning-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #f57c00;
    }

    .sequence-warning .warning-text {
      font-size: 11px;
      color: #e65100;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Adjust field spacing when no sequence indicator is present */
    .field-container:not(.no-sequence) {
      margin-bottom: 20px;
    }

    /* Debug mode sequence display */
    .field-debug.with-sequence {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .field-debug.no-sequence {
      background: #fff3e0;
      border-color: #ff9800;
    }



    .field-loading {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      padding: 4px 12px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-size: 12px;
      color: #666;
      z-index: 100;
    }






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
      position: relative;
    }

    .field-container:has(input:disabled),
    .field-container:has(select:disabled),
    .field-container:has(textarea:disabled) {
      opacity: 0.6;
      pointer-events: none;
    }

    ::ng-deep .field-container .mat-form-field-disabled {
      opacity: 0.6;
    }

    ::ng-deep .field-container .mat-form-field-disabled .mat-form-field-label {
      color: #999;
    }

    .field-debug {
      position: absolute;
      top: -20px;
      left: 0;
      right: 0;
      background: #f0f0f0;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      color: #666;
      border: 1px solid #ddd;
      z-index: 10;
    }

    .field-type-choice {
      min-height: 80px;
    }

    .debug-panel {
      margin-top: 24px;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .debug-content {
      padding: 16px;
      max-height: 600px;
      overflow-y: auto;
    }

    .debug-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #dee2e6;
    }

    .debug-controls button {
      font-size: 12px;
      height: 32px;
    }

    .debug-content h5, .debug-content h6 {
      margin: 16px 0 8px 0;
      color: #495057;
      font-size: 14px;
      font-weight: 600;
    }

    .debug-content h5:first-child {
      margin-top: 0;
    }

    .data-summary {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #ced4da;
      margin: 8px 0 16px 0;
    }

    .data-summary p {
      margin: 4px 0;
      font-size: 13px;
    }

    .debug-json {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #ced4da;
      overflow-x: auto;
      font-size: 11px;
      max-height: 200px;
      margin: 8px 0 16px 0;
    }

    .category-debug {
      margin-bottom: 16px;
      padding: 12px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .field-list {
      margin: 8px 0 0 0;
      padding-left: 20px;
      font-size: 12px;
    }

    .field-list li {
      margin-bottom: 4px;
      padding: 2px 0;
    }

    .field-hidden {
      opacity: 0.5;
      text-decoration: line-through;
    }

    .field-mandatory {
      font-weight: bold;
    }

    .mandatory-indicator {
      color: #dc3545;
      font-weight: bold;
      font-size: 10px;
    }

    .conditional-indicator {
      color: #6f42c1;
      font-weight: bold;
      font-size: 10px;
    }

    .validation-errors {
      margin: 8px 0 0 0;
      padding-left: 20px;
      color: #dc3545;
    }

    .error-item {
      margin-bottom: 4px;
      font-size: 13px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .fields-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .debug-controls {
        flex-direction: column;
      }

      .debug-controls button {
        width: 100%;
      }
    }
  `]
})
export class DynamicFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() categories: ServiceFlowCategory[] = [];
  @Input() formData: any = {}; // This comes from the wizard with complete data
  @Input() isReviewMode: boolean = false;
  @Output() formChange = new EventEmitter<any>();

  dynamicForm: FormGroup;
  debugMode = false; // Set to true for debugging
  debugExpanded = true;
  showFieldDebug = false;
  formValidationErrors: string[] = [];

  private destroy$ = new Subject<void>();
  private loadingCategories = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private fieldIntegrationService: FieldIntegrationService,
    private snackBar: MatSnackBar
  ) {
    this.dynamicForm = this.fb.group({});
    console.log('🏗️ DynamicForm: Component created');
  }

  ngOnInit(): void {
    console.log('🚀 DynamicForm: Initializing with categories:', this.categories.length);
    console.log('🚀 DynamicForm: Initial form data:', this.formData);
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 DynamicForm: Input changes detected', changes);

    if (changes['formData']) {
      console.log('📝 DynamicForm: Form data changed from:', changes['formData'].previousValue);
      console.log('📝 DynamicForm: Form data changed to:', changes['formData'].currentValue);

      // Update form controls with new values
      this.updateFormControls();

      // Force change detection to re-evaluate visibility
      this.cdr.detectChanges();
    }

    if (changes['categories']) {
      console.log('📂 DynamicForm: Categories changed');
      this.buildForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    console.log('🏗️ DynamicForm: Building form with', this.categories.length, 'categories');

    const formControls: any = {};

    this.categories.forEach(category => {
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
      console.log('📊 DynamicForm: Internal form value changed:', value);
      this.formChange.emit(value);
    });

    console.log('✅ DynamicForm: Form built with', Object.keys(formControls).length, 'controls');
  }

  updateFormControls(): void {
    if (!this.formData) {
      console.log('⚠️ DynamicForm: No form data to update');
      return;
    }

    console.log('🔄 DynamicForm: Updating form controls with data:', this.formData);

    Object.keys(this.formData).forEach(fieldName => {
      const control = this.dynamicForm.get(fieldName);
      if (control) {
        const newValue = this.formData[fieldName];
        if (JSON.stringify(control.value) !== JSON.stringify(newValue)) {
          console.log('📝 DynamicForm: Updating control', fieldName, 'from', control.value, 'to', newValue);
          control.setValue(newValue, {emitEvent: false});
        }
      } else {
        console.log('⚠️ DynamicForm: No control found for field:', fieldName);
      }
    });

    console.log('✅ DynamicForm: Form controls updated');
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
  // Add this method to handle field changes with integrations:
  async onFieldChangeWithIntegration(field: ServiceFlowField, fieldName: string, value: any): Promise<void> {
    console.log('🔧 DynamicForm: Field changed with integration check:', fieldName, '=', value);

    // Update the form control immediately
    this.dynamicForm.get(fieldName)?.setValue(value, { emitEvent: false });

    // Update form data
    this.formData[fieldName] = value;

    // Check if field has on_change integrations
    if (field.integrations && field.integrations.length > 0) {
      console.log('🔄 DynamicForm: Field has integrations, processing...');

      try {
        // Show loading indicator
        this.setFieldLoading(fieldName, true);

        // Process integrations
        const updatedFields = await this.fieldIntegrationService.processFieldIntegrations(
          field,
          value,
          this.formData,
          'on_change'
        );

        // Apply field updates from integration response
        if (updatedFields && Object.keys(updatedFields).length > 0) {
          console.log('📝 DynamicForm: Applying field updates from integration:', updatedFields);

          // Update form controls
          Object.entries(updatedFields).forEach(([targetFieldName, targetValue]) => {
            const control = this.dynamicForm.get(targetFieldName);
            if (control) {
              control.setValue(targetValue, { emitEvent: false });
            }

            // Update form data
            this.formData[targetFieldName] = targetValue;
          });

          // Emit the complete updated form data
          this.formChange.emit(this.formData);

          // Force change detection
          this.cdr.detectChanges();

          // Show success message
          this.snackBar.open('Data loaded successfully', 'Close', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        }
      } catch (error) {
        console.error('❌ DynamicForm: Integration error:', error);
        this.snackBar.open('Failed to load data', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      } finally {
        // Hide loading indicator
        this.setFieldLoading(fieldName, false);
      }
    } else {
      // No integrations, just emit the change
      this.formChange.emit(this.formData);
    }
  }

// Add loading state management:
  private fieldLoadingStates = new Map<string, boolean>();

  setFieldLoading(fieldName: string, loading: boolean): void {
    this.fieldLoadingStates.set(fieldName, loading);
    this.cdr.detectChanges();
  }

  isFieldLoading(fieldName: string): boolean {
    return this.fieldLoadingStates.get(fieldName) || false;
  }


  onFieldChange(fieldName: string, value: any): void {
    console.log('🔧 DynamicForm: Field changed:', fieldName, '=', value, 'Type:', typeof value);

    // Update form control
    this.dynamicForm.get(fieldName)?.setValue(value, {emitEvent: true});
  }

  getFieldValue(fieldName: string): any {
    const value = this.formData[fieldName];
    console.log(`🔍 DynamicForm: Getting value for ${fieldName}:`, value, 'Type:', typeof value);
    return value;
  }

  getFieldValueType(fieldName: string): string {
    const value = this.getFieldValue(fieldName);
    return typeof value;
  }

  // Enhanced debugging methods
  toggleDebug(): void {
    this.debugMode = !this.debugMode;
  }

  logFormData(): void {
    console.log('=== FORM DATA DEBUG ===');
    console.log('Input form data:', this.formData);
    console.log('Internal form data:', this.dynamicForm.value);
    console.log('Categories:', this.categories);
    console.log('========================');
  }

  getTotalFieldCount(): number {
    return this.categories.reduce((count, category) => count + category.fields.length, 0);
  }

  getVisibleFieldCount(): number {
    return this.categories.reduce((count, category) =>
      count + this.getVisibleFields(category.fields).length, 0);
  }

  getFieldsWithValuesCount(): number {
    let count = 0;
    this.categories.forEach(category => {
      category.fields.forEach(field => {
        const value = this.getFieldValue(field.name);
        if (value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0)) {
          count++;
        }
      });
    });
    return count;
  }

  getEmptyFieldsCount(): number {
    return this.getTotalFieldCount() - this.getFieldsWithValuesCount();
  }

  validateAllFields(): void {
    this.formValidationErrors = [];

    this.categories.forEach(category => {
      category.fields.forEach(field => {
        if (this.isFieldVisible(field) && field.mandatory) {
          const value = this.getFieldValue(field.name);
          if (this.isValueEmpty(value, field.field_type)) {
            this.formValidationErrors.push(`${field.display_name || field.name} is required`);
          }
        }
      });
    });

    console.log('🔍 Validation errors:', this.formValidationErrors);
  }

  private isValueEmpty(value: any, fieldType: string): boolean {
    if (value === null || value === undefined) return true;

    switch (fieldType) {
      case 'text':
        return typeof value === 'string' && value.trim() === '';
      case 'choice':
        return Array.isArray(value) ? value.length === 0 : (value === '' || value === null);
      case 'file':
        return !(value instanceof File) && !value;
      case 'number':
      case 'decimal':
      case 'percentage':
        return value === '' || (typeof value === 'string' && value.trim() === '');
      case 'boolean':
        return false; // Boolean fields are never empty
      default:
        return value === '' || (typeof value === 'string' && value.trim() === '');
    }
  }

  isFieldVisible(field: ServiceFlowField): boolean {
    // Skip explicitly hidden fields
    if (field.is_hidden) {
      return false;
    }

    // Check visibility conditions using the INPUT formData (complete wizard data)
    if (field.visibility_conditions && field.visibility_conditions.length > 0) {
      // ALL visibility conditions must be met for the field to be visible
      const isVisible = field.visibility_conditions.every((condition: any) => {
        return evaluateVisibilityCondition(condition, this.formData);
      });

      return isVisible;
    }

    // No conditions means visible by default
    return true;
  }

  getVisibleFields(fields: ServiceFlowField[]): ServiceFlowField[] {
    return fields.filter(field => this.isFieldVisible(field));
  }

  debugVisibilityConditions(): void {
    console.log('=== DYNAMIC FORM VISIBILITY DEBUG ===');
    console.log('Input form data:', this.formData);
    console.log('Internal form data:', this.dynamicForm.value);

    this.categories.forEach(category => {
      console.log(`\n--- Category: ${category.name} ---`);

      category.fields.forEach(field => {
        if (field.visibility_conditions && field.visibility_conditions.length > 0) {
          console.log(`\nField: ${field.name}`);
          console.log('Visibility conditions:', field.visibility_conditions);
          console.log('Field value in form data:', this.formData[field.name]);
          console.log('Is visible:', this.isFieldVisible(field));

          field.visibility_conditions.forEach((condition, condIndex) => {
            const conditionResult = evaluateVisibilityCondition(condition, this.formData);
            console.log(`Condition ${condIndex} result:`, conditionResult);
          });
        } else {
          console.log(`Field: ${field.name} - No visibility conditions, visible:`, this.isFieldVisible(field));
        }
      });
    });
  }

  getStaticOptions(field: ServiceFlowField): LookupOption[] {
    // Only return static options if there's no lookup ID
    // If there's a lookup ID, the choice field component will handle the API call
    if (!field.lookup && field.allowed_lookups && field.allowed_lookups.length > 0) {
      return field.allowed_lookups;
    }

    return [];
  }

  isCategoryLoading(category: ServiceFlowCategory): boolean {
    return this.loadingCategories.has(category.id);
  }

  // // Field type checking methods
  // isTextField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'text';
  // }
  //
  // isNumberField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'number';
  // }
  //
  // isBooleanField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'boolean';
  // }
  //
  // isChoiceField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'choice';
  // }
  //
  // isFileField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'file';
  // }
  //
  // isDecimalField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'decimal';
  // }
  //
  // isPercentageField(field: ServiceFlowField): boolean {
  //   return field.field_type === 'percentage';
  // }

  // Track by methods for performance
  trackByCategoryId(index: number, category: ServiceFlowCategory): number {
    return category.id;
  }

  trackByFieldId(index: number, field: ServiceFlowField): number {
    return field.field_id;
  }

  getCategoriesWithVisibleFields(): ServiceFlowCategory[] {
    return this.categories.filter(category => {
      const visibleFields = this.getVisibleFields(category.fields);
      const hasVisibleFields = visibleFields.length > 0;

      if (!hasVisibleFields) {
        console.log('📂 DynamicForm: Hiding category with no visible fields:', category.name);
      }

      return hasVisibleFields;
    });
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
    return field.field_type === 'choice' || field.field_type === 'multi_choice' || field.field_type === 'lookup';
  }

  isFileField(field: ServiceFlowField): boolean {
    return field.field_type === 'file' || field.field_type === 'image';
  }

  isDecimalField(field: ServiceFlowField): boolean {
    return field.field_type === 'decimal' || field.field_type === 'currency';
  }

  isPercentageField(field: ServiceFlowField): boolean {
    return field.field_type === 'percentage';
  }

  isDateField(field: ServiceFlowField): boolean {
    return field.field_type === 'date' || field.field_type === 'datetime' || field.field_type === 'time';
  }

  isEmailField(field: ServiceFlowField): boolean {
    return field.field_type === 'email';
  }

  isPhoneField(field: ServiceFlowField): boolean {
    return field.field_type === 'phone_number';
  }

  isUrlField(field: ServiceFlowField): boolean {
    return field.field_type === 'url';
  }

  isOtherField(field: ServiceFlowField): boolean {
    return !this.isTextField(field) && !this.isNumberField(field) &&
      !this.isBooleanField(field) && !this.isChoiceField(field) &&
      !this.isFileField(field) && !this.isDecimalField(field) &&
      !this.isPercentageField(field) && !this.isDateField(field) &&
      !this.isEmailField(field) && !this.isPhoneField(field) &&
      !this.isUrlField(field);
  }

  getSortedVisibleFields(fields: ServiceFlowField[]): ServiceFlowField[] {
    const visibleFields = this.getVisibleFields(fields);

    // Separate fields with and without sequence
    const fieldsWithSequence = visibleFields.filter(field =>
      field.sequence !== undefined && field.sequence !== null
    );
    const fieldsWithoutSequence = visibleFields.filter(field =>
      field.sequence === undefined || field.sequence === null
    );

    // Sort fields with sequence by sequence number ascending
    fieldsWithSequence.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    // Sort fields without sequence by field_id as fallback
    fieldsWithoutSequence.sort((a, b) => a.field_id - b.field_id);

    // Return fields with sequence first, then fields without sequence
    return [...fieldsWithSequence, ...fieldsWithoutSequence];
  }

  hasSequence(field: ServiceFlowField): boolean {
    return field.sequence !== undefined && field.sequence !== null;
  }

  getFieldWithReviewMode(field: ServiceFlowField): ServiceFlowField {
    if (this.isReviewMode) {
      return {
        ...field,
        is_disabled: true
      };
    }
    return field;
  }
}
