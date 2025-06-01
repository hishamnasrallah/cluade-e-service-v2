// src/app/features/services/dynamic-form/field-components/file-field/file-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../../../../../core/models/field.model';

@Component({
  selector: 'app-file-field',
  templateUrl: './file-field.component.html',
  styleUrls: ['./file-field.component.scss']
})
export class FileFieldComponent {
  @Input() field!: Field;
  @Input() value: File | null = null;
  @Output() valueChange = new EventEmitter<File | null>();

  selectedFileName = '';

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.valueChange.emit(file);
    } else {
      this.selectedFileName = '';
      this.valueChange.emit(null);
    }
  }

  getValidationMessage(): string {
    if (this.field.mandatory && !this.value) {
      return 'This field is required';
    }
    if (this.value && this.field.max_file_size && this.value.size > this.field.max_file_size) {
      return `File size must be less than ${this.field.max_file_size} bytes`;
    }
    return '';
  }

  getAcceptedTypes(): string {
    if (this.field.file_types) {
      return this.field.file_types;
    }
    return '*/*';
  }
}
