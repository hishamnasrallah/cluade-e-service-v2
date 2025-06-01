
// src/app/features/services/dynamic-form/field-components/decimal-field/decimal-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-decimal-field',
  templateUrl: './decimal-field.component.html',
  styleUrls: ['./decimal-field.component.scss']
})
export class DecimalFieldComponent {
  @Input() field!: Field;
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number>();

  onValueChange(event: any): void {
    const numValue = parseFloat(event.target.value);
    this.valueChange.emit(numValue);
  }

  getStep(): string {
    if (this.field.precision) {
      return (1 / Math.pow(10, this.field.precision)).toString();
    }
    return '0.01';
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
    return '';
  }
}
