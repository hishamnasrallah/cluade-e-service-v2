// src/app/features/services/dynamic-form/dynamic-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  imports: [
    ReactiveFormsModule
  ],
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() categories: Category[] = [];
  @Input() formData: any = {};
  @Output() formDataChange = new EventEmitter<any>();

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
      category.fields.forEach(field => {
        if (!field.is_hidden) {
          formControls[field.name] = [this.formData[field.name] || ''];
        }
      });
    });

    this.dynamicForm = this.fb.group(formControls);

    this.dynamicForm.valueChanges.subscribe(value => {
      this.formDataChange.emit(value);
    });
  }

  onFieldValueChange(fieldName: string, value: any): void {
    this.dynamicForm.patchValue({ [fieldName]: value });
  }

  isFieldVisible(field: any): boolean {
    if (field.is_hidden) return false;

    // Check visibility conditions
    if (field.visibility_conditions && field.visibility_conditions.length > 0) {
      return this.evaluateVisibilityConditions(field.visibility_conditions);
    }

    return true;
  }

  private evaluateVisibilityConditions(conditions: any[]): boolean {
    // Simplified condition evaluation
    // In a real implementation, this would be more comprehensive
    return conditions.every(condition => {
      if (condition.condition_logic) {
        return condition.condition_logic.every((logic: any) => {
          const fieldValue = this.dynamicForm.get(logic.field)?.value;
          switch (logic.operation) {
            case '=':
              return fieldValue == logic.value;
            case '!=':
              return fieldValue != logic.value;
            case '>':
              return Number(fieldValue) > Number(logic.value);
            case '<':
              return Number(fieldValue) < Number(logic.value);
            case 'contains':
              return String(fieldValue).includes(String(logic.value));
            case 'startswith':
              return String(fieldValue).startsWith(String(logic.value));
            default:
              return true;
          }
        });
      }
      return true;
    });
  }
}
