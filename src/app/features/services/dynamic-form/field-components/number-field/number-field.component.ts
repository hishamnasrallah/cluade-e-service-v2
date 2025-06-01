// src/app/features/services/dynamic-form/field-components/number-field/number-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-number-field',
  templateUrl: './number-field.component.html',
  styleUrls: ['./number-field.component.scss']
})
export class NumberFieldComponent {
  @Input() field!: Field;
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number>();

  onValueChange(event: any): void {
    const numValue = Number(event.target.value);
    this.valueChange.emit(numValue);
  }

  getValidationMessage(): string {
    if (this.field.mandatory && (this.value === null || this.value === undefined)) {
      return 'This field is required';
    }
    if (this.field.value_greater_than !== undefined && this.value !== null && this.value <= this.field.value_greater_than) {
      return `Value must be greater than ${this.field.value_greater_than}`;
    }
    if (this.field.value_less_than !== undefined && this.value !== null && this.value >= this.field.value_less_than) {
      return `Value must be less than ${this.field.value_less_than}`;
    }
    if (this.field.positive_only && this.value !== null && this.value <= 0) {
      return 'Value must be positive';
    }
    if (this.field.integer_only && this.value !== null && !Number.isInteger(this.value)) {
      return 'Value must be an integer';
    }
    return '';
  }
}
