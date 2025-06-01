// src/app/features/services/dynamic-form/field-components/choice-field/choice-field.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Field, LookupOption } from '../../../../../core/models/field.model';
import { LookupService } from '../../../../../core/services/lookup.service';

@Component({
  selector: 'app-choice-field',
  templateUrl: './choice-field.component.html',
  styleUrls: ['./choice-field.component.scss']
})
export class ChoiceFieldComponent implements OnInit {
  @Input() field!: Field;
  @Input() value: any = '';
  @Output() valueChange = new EventEmitter<any>();

  options: LookupOption[] = [];
  loading = false;

  constructor(private lookupService: LookupService) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    if (this.field.allowed_lookups && this.field.allowed_lookups.length > 0) {
      this.options = this.field.allowed_lookups;
    } else if (this.field.lookup) {
      this.loading = true;
      this.lookupService.getLookupOptions(this.field.lookup).subscribe({
        next: (response) => {
          this.options = response.results || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load lookup options:', error);
          this.loading = false;
        }
      });
    }
  }

  onValueChange(event: any): void {
    this.valueChange.emit(event.target.value);
  }

  getValidationMessage(): string {
    if (this.field.mandatory && !this.value) {
      return 'This field is required';
    }
    return '';
  }
}
