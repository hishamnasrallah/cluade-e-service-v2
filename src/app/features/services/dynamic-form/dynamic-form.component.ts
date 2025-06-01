import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ServiceFlowCategory, ServiceFlowField, evaluateVisibilityCondition } from '../../../core/models/interfaces';
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
              <div class="fields-grid">
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

                  <!-- Choice Fields -->
                  <app-choice-field
                    *ngIf="isChoiceField(field)"
                    [field]="field"
                    [value]="dynamicForm.get(field.name)?.value"
                    [options]="getFieldOptions(field)"
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
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() categories: ServiceFlowCategory[] = [];
  @Input() formData: any = {};
  @Output() formChange = new EventEmitter<any>();

  dynamicForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    this.buildForm();
  }

  buildForm(): void {
    const formControls: any = {};

    this.categories.forEach(category => {
      category.fields.forEach((field: ServiceFlowField) => {
        const defaultValue = this.getDefaultValue(field);
        formControls[field.name] = [this.formData[field.name] || defaultValue];
      });
    });

    this.dynamicForm = this.fb.group(formControls);

    // Subscribe to form changes
    this.dynamicForm.valueChanges.subscribe(value => {
      this.formChange.emit(value);
    });
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
      default:
        return '';
    }
  }

  onFieldChange(fieldName: string, value: any): void {
    this.dynamicForm.get(fieldName)?.setValue(value, { emitEvent: false });
    this.formChange.emit(this.dynamicForm.value);
  }

  getVisibleFields(fields: ServiceFlowField[]): ServiceFlowField[] {
    return fields.filter(field => {
      if (field.is_hidden) return false;

      if (field.visibility_conditions && field.visibility_conditions.length > 0) {
        return field.visibility_conditions.some((condition: any) =>
          evaluateVisibilityCondition(condition, this.dynamicForm.value)
        );
      }

      return true;
    });
  }

  getFieldOptions(field: ServiceFlowField): any[] {
    return field.allowed_lookups || [];
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

  // Track by methods
  trackByCategoryId(index: number, category: ServiceFlowCategory): number {
    return category.id;
  }

  trackByFieldId(index: number, field: ServiceFlowField): number {
    return field.field_id;
  }
}
