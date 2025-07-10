import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ServiceFlowField } from '../../../../../core/models/interfaces';

@Component({
  selector: 'app-color-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorFieldComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>
        {{ field.display_name }}
        <span *ngIf="field.mandatory" class="required-indicator">*</span>
      </mat-label>
      <input matInput
             [formControl]="textControl"
             [placeholder]="field.display_name"
             [readonly]="field.is_disabled"
             (blur)="onTextChange()">
      <div matSuffix class="color-preview-container">
        <input type="color"
               class="color-picker"
               [value]="control.value || '#000000'"
               (change)="onColorChange($event)"
               [disabled]="field.is_disabled">
        <div class="color-preview" [style.background-color]="control.value || '#ffffff'"></div>
      </div>
      <mat-error *ngIf="control.hasError('required')">
        {{ field.display_name }} is required
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    .required-indicator {
      color: #f44336;
      margin-left: 4px;
      font-weight: 600;
    }
    .color-preview-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .color-picker {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
    }
    .color-preview {
      width: 30px;
      height: 30px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  `]
})
export class ColorFieldComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() field!: ServiceFlowField;
  @Input() value: any = null;
  @Output() valueChange = new EventEmitter<any>();

  control = new FormControl<string | null>(null);
  textControl = new FormControl<string>('');

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.control.setValue(this.value || '#ffffff', { emitEvent: false });
    this.textControl.setValue(this.value || '#ffffff', { emitEvent: false });

    this.control.valueChanges.subscribe(value => {
      this.textControl.setValue(value, { emitEvent: false });
      this.onChange(value);
      this.valueChange.emit(value);
      this.onTouched();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.control) {
      const newValue = changes['value'].currentValue || '#ffffff';
      if (this.control.value !== newValue) {
        this.control.setValue(newValue, { emitEvent: false });
        this.textControl.setValue(newValue, { emitEvent: false });
      }
    }
  }

  onColorChange(event: any): void {
    const color = event.target.value;
    this.control.setValue(color);
  }

  onTextChange(): void {
    const color = this.textControl.value;
    if (color && this.isValidColor(color)) {
      this.control.setValue(color);
    }
  }

  private isValidColor(color: string): boolean {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }


  writeValue(value: any): void {
    const colorValue = value || '#ffffff';
    this.control.setValue(colorValue, { emitEvent: false });
    this.textControl.setValue(colorValue, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
      this.textControl.disable();
    } else {
      this.control.enable();
      this.textControl.enable();
    }
  }
}
