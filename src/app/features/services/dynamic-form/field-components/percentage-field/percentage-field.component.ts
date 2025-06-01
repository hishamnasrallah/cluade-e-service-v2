// src/app/features/services/dynamic-form/field-components/percentage-field/percentage-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-percentage-field',
  templateUrl: './percentage-field.component.html',
  styleUrls: ['./percentage-field.component.scss']
})
export class PercentageFieldComponent {
  @Input() field!: Field;
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number>();

  onValueChange(event: any): void {
    const numValue = parseFloat(event.target.value);
    this.valueChange.emit(numValue);
  }

  getValidationMessage(): string {
    if (this.field.mandatory && (this.value === null || this.value === undefined)) {
      return 'This field is required';
    }
    if (this.value !== null && (this.value < 0 || this.value > 100)) {
      return 'Percentage must be between 0 and 100';
    }
    return '';
  }
}
