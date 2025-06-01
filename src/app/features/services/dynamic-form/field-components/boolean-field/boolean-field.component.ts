// src/app/features/services/dynamic-form/field-components/boolean-field/boolean-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-boolean-field',
  templateUrl: './boolean-field.component.html',
  styleUrls: ['./boolean-field.component.scss']
})
export class BooleanFieldComponent {
  @Input() field!: Field;
  @Input() value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  onValueChange(event: any): void {
    this.valueChange.emit(event.target.checked);
  }
}
