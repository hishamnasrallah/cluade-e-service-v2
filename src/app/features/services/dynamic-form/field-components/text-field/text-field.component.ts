// src/app/features/services/dynamic-form/field-components/text-field/text-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-text-field',
  templateUrl: './text-field.component.html',
  styleUrls: ['./text-field.component.scss']
})
export class TextFieldComponent {
  @Input() field!: Field;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onValueChange(event: any): void {
    this.valueChange.emit(event.target.value);
  }

  getValidationMessage(): string {
    if (this.field.mandatory && !this.value) {
      return 'This field is required';
    }
    if (this.field.min_length && this.value.length < this.field.min_length) {
      return `Minimum length is ${this.field.min_length} characters`;
    }
    if (this.field.max_length && this.value.length > this.field.max_length) {
      return `Maximum length is ${this.field.max_length} characters`;
    }
    if (this.field.regex_pattern && !new RegExp(this.field.regex_pattern).test(this.value)) {
      return 'Invalid format';
    }
    return '';
  }
}
