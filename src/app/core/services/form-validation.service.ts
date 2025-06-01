// src/app/services/form-validation.service.ts
import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ServiceFlowField, ConditionRule, evaluateConditionRule } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor() {}

  /**
   * Create custom validators for a specific field
   */
  createFieldValidators(field: ServiceFlowField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Required validator
    if (field.mandatory) {
      validators.push(this.requiredValidator());
    }

    // Text field validators
    if (field.field_type === 'text') {
      if (field.min_length) {
        validators.push(this.minLengthValidator(field.min_length));
      }
      if (field.max_length) {
        validators.push(this.maxLengthValidator(field.max_length));
      }
      if (field.regex_pattern) {
        validators.push(this.patternValidator(field.regex_pattern));
      }
      if (field.allowed_characters) {
        validators.push(this.allowedCharactersValidator(field.allowed_characters));
      }
      if (field.forbidden_words) {
        validators.push(this.forbiddenWordsValidator(field.forbidden_words));
      }
    }

    // Number field validators
    if (this.isNumberField(field)) {
      if (field.value_greater_than !== undefined) {
        validators.push(this.minValueValidator(field.value_greater_than));
      }
      if (field.value_less_than !== undefined && field.value_less_than !== null) {
        validators.push(this.maxValueValidator(field.value_less_than));
      }
      if (field.integer_only) {
        validators.push(this.integerValidator());
      }
      if (field.positive_only) {
        validators.push(this.positiveNumberValidator());
      }
      if (field.precision !== undefined && field.precision !== null) {
        validators.push(this.precisionValidator(field.precision));
      }
    }

    // Choice field validators
    if (field.field_type === 'choice') {
      if (field.min_selections) {
        validators.push(this.minSelectionsValidator(field.min_selections));
      }
      if (field.max_selections) {
        validators.push(this.maxSelectionsValidator(field.max_selections));
      }
    }

    // File field validators
    if (field.field_type === 'file') {
      if (field.max_file_size) {
        validators.push(this.fileSizeValidator(field.max_file_size));
      }
      if (field.file_types) {
        validators.push(this.fileTypeValidator(field.file_types));
      }
      if (field.image_max_width || field.image_max_height) {
        validators.push(this.imageDimensionsValidator(field.image_max_width, field.image_max_height));
      }
    }

    return validators;
  }

  /**
   * Validate field visibility based on conditions
   */
  evaluateFieldVisibility(field: ServiceFlowField, formData: any): boolean {
    if (!field.visibility_conditions || field.visibility_conditions.length === 0) {
      return !field.is_hidden;
    }

    // Evaluate all visibility conditions (AND logic)
    return field.visibility_conditions.every(condition => {
      return condition.condition_logic.every(rule =>
        evaluateConditionRule(rule, formData)
      );
    });
  }

  /**
   * Get validation error messages for a field
   */
  getFieldErrorMessages(field: ServiceFlowField, errors: ValidationErrors): string[] {
    const messages: string[] = [];
    const fieldName = field.display_name || field.name;

    if (errors['required']) {
      messages.push(`${fieldName} is required`);
    }

    if (errors['minlength']) {
      messages.push(`${fieldName} must be at least ${errors['minlength'].requiredLength} characters`);
    }

    if (errors['maxlength']) {
      messages.push(`${fieldName} cannot exceed ${errors['maxlength'].requiredLength} characters`);
    }

    if (errors['pattern']) {
      messages.push(`${fieldName} format is invalid`);
    }

    if (errors['min']) {
      messages.push(`${fieldName} must be greater than ${errors['min'].min}`);
    }

    if (errors['max']) {
      messages.push(`${fieldName} must be less than ${errors['max'].max}`);
    }

    if (errors['integer']) {
      messages.push(`${fieldName} must be a whole number`);
    }

    if (errors['positive']) {
      messages.push(`${fieldName} must be a positive number`);
    }

    if (errors['precision']) {
      messages.push(`${fieldName} can have at most ${errors['precision'].maxPrecision} decimal places`);
    }

    if (errors['allowedCharacters']) {
      messages.push(`${fieldName} contains invalid characters`);
    }

    if (errors['forbiddenWords']) {
      messages.push(`${fieldName} contains forbidden words`);
    }

    if (errors['minSelections']) {
      messages.push(`Select at least ${errors['minSelections'].min} options for ${fieldName}`);
    }

    if (errors['maxSelections']) {
      messages.push(`Select at most ${errors['maxSelections'].max} options for ${fieldName}`);
    }

    if (errors['fileSize']) {
      messages.push(`File size must be less than ${this.formatFileSize(errors['fileSize'].maxSize)}`);
    }

    if (errors['fileType']) {
      messages.push(`Invalid file type. Allowed types: ${errors['fileType'].allowedTypes}`);
    }

    if (errors['imageDimensions']) {
      messages.push(`Image dimensions exceed maximum allowed size`);
    }

    return messages;
  }

  /**
   * Format form data for submission
   */
  formatFormDataForSubmission(formData: any, fields: ServiceFlowField[]): any {
    const formatted: any = {};

    fields.forEach(field => {
      const value = formData[field.name];

      if (value === null || value === undefined) {
        return;
      }

      switch (field.field_type) {
        case 'number':
        case 'decimal':
        case 'percentage':
          formatted[field.name] = this.formatNumberValue(value, field);
          break;

        case 'boolean':
          formatted[field.name] = Boolean(value);
          break;

        case 'choice':
          formatted[field.name] = this.formatChoiceValue(value, field);
          break;

        case 'file':
          // Files are handled separately
          if (value instanceof File) {
            formatted[field.name] = value;
          }
          break;

        default:
          formatted[field.name] = String(value).trim();
      }
    });

    return formatted;
  }

  // Private validator methods
  private requiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || (typeof control.value === 'string' && control.value.trim() === '')) {
        return { required: true };
      }
      return null;
    };
  }

  private minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length < minLength) {
        return { minlength: { requiredLength: minLength, actualLength: control.value.length } };
      }
      return null;
    };
  }

  private maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length > maxLength) {
        return { maxlength: { requiredLength: maxLength, actualLength: control.value.length } };
      }
      return null;
    };
  }

  private patternValidator(pattern: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        const regex = new RegExp(pattern);
        if (!regex.test(control.value)) {
          return { pattern: { requiredPattern: pattern, actualValue: control.value } };
        }
      } catch (error) {
        console.error('Invalid regex pattern:', pattern);
      }
      return null;
    };
  }

  private allowedCharactersValidator(allowedChars: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const allowedPattern = new RegExp(`^[${allowedChars}]*$`);
      if (!allowedPattern.test(control.value)) {
        return { allowedCharacters: { allowedChars, actualValue: control.value } };
      }
      return null;
    };
  }

  private forbiddenWordsValidator(forbiddenWords: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !forbiddenWords) return null;

      const words = forbiddenWords.split(',').map(w => w.trim().toLowerCase());
      const value = control.value.toLowerCase();

      const foundWord = words.find(word => value.includes(word));
      if (foundWord) {
        return { forbiddenWords: { forbiddenWord: foundWord } };
      }
      return null;
    };
  }

  private minValueValidator(minValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value <= minValue) {
        return { min: { min: minValue, actual: control.value } };
      }
      return null;
    };
  }

  private maxValueValidator(maxValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value >= maxValue) {
        return { max: { max: maxValue, actual: control.value } };
      }
      return null;
    };
  }

  private integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined) {
        const num = Number(control.value);
        if (!Number.isInteger(num)) {
          return { integer: true };
        }
      }
      return null;
    };
  }

  private positiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value <= 0) {
        return { positive: true };
      }
      return null;
    };
  }

  private precisionValidator(maxPrecision: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined) {
        const str = control.value.toString();
        const decimalIndex = str.indexOf('.');
        if (decimalIndex !== -1) {
          const decimalPlaces = str.length - decimalIndex - 1;
          if (decimalPlaces > maxPrecision) {
            return { precision: { maxPrecision, actualPrecision: decimalPlaces } };
          }
        }
      }
      return null;
    };
  }

  private minSelectionsValidator(minSelections: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (Array.isArray(control.value) && control.value.length < minSelections) {
        return { minSelections: { min: minSelections, actual: control.value.length } };
      }
      return null;
    };
  }

  private maxSelectionsValidator(maxSelections: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (Array.isArray(control.value) && control.value.length > maxSelections) {
        return { maxSelections: { max: maxSelections, actual: control.value.length } };
      }
      return null;
    };
  }

  private fileSizeValidator(maxSize: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value instanceof File && control.value.size > maxSize) {
        return { fileSize: { maxSize, actualSize: control.value.size } };
      }
      return null;
    };
  }

  private fileTypeValidator(allowedTypes: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value instanceof File) {
        const allowedTypesArray = allowedTypes.split(',').map(t => t.trim());
        const fileExtension = '.' + control.value.name.split('.').pop()?.toLowerCase();

        if (!allowedTypesArray.includes(fileExtension)) {
          return { fileType: { allowedTypes, actualType: fileExtension } };
        }
      }
      return null;
    };
  }

  private imageDimensionsValidator(maxWidth?: number | null, maxHeight?: number | null): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value instanceof File && control.value.type.startsWith('image/')) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if ((maxWidth && img.width > maxWidth) || (maxHeight && img.height > maxHeight)) {
              resolve({ imageDimensions: { maxWidth, maxHeight, actualWidth: img.width, actualHeight: img.height } });
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(control.value);
        });
      }
      return null;
    };
  }

  // Helper methods
  private isNumberField(field: ServiceFlowField): boolean {
    return ['number', 'decimal', 'percentage'].includes(field.field_type);
  }

  private formatNumberValue(value: any, field: ServiceFlowField): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = Number(value);
    if (isNaN(num)) {
      return null;
    }

    if (field.integer_only) {
      return Math.floor(num);
    }

    if (field.precision !== undefined && field.precision !== null) {
      return Number(num.toFixed(field.precision));
    }

    return num;
  }

  private formatChoiceValue(value: any, field: ServiceFlowField): any {
    if (field.max_selections === 1) {
      return value;
    } else {
      return Array.isArray(value) ? value : [value];
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate entire form step
   */
  validateFormStep(formData: any, fields: ServiceFlowField[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];

      // Skip hidden fields
      if (field.is_hidden || !this.evaluateFieldVisibility(field, formData)) {
        return;
      }

      // Check required fields
      if (field.mandatory && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(`${field.display_name || field.name} is required`);
        isValid = false;
      }

      // Additional validation based on field type
      if (value) {
        const fieldErrors = this.validateFieldValue(value, field);
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors);
          isValid = false;
        }
      }
    });

    return { isValid, errors };
  }

  /**
   * Validate individual field value
   */
  private validateFieldValue(value: any, field: ServiceFlowField): string[] {
    const errors: string[] = [];
    const fieldName = field.display_name || field.name;

    switch (field.field_type) {
      case 'text':
        if (field.min_length && value.length < field.min_length) {
          errors.push(`${fieldName} must be at least ${field.min_length} characters`);
        }
        if (field.max_length && value.length > field.max_length) {
          errors.push(`${fieldName} cannot exceed ${field.max_length} characters`);
        }
        if (field.regex_pattern) {
          try {
            const regex = new RegExp(field.regex_pattern);
            if (!regex.test(value)) {
              errors.push(`${fieldName} format is invalid`);
            }
          } catch (error) {
            console.error('Invalid regex pattern:', field.regex_pattern);
          }
        }
        break;

      case 'number':
      case 'decimal':
      case 'percentage':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${fieldName} must be a valid number`);
        } else {
          if (field.value_greater_than !== undefined && num <= field.value_greater_than) {
            errors.push(`${fieldName} must be greater than ${field.value_greater_than}`);
          }
          if (field.value_less_than !== undefined && field.value_less_than !== null && num >= field.value_less_than) {
            errors.push(`${fieldName} must be less than ${field.value_less_than}`);
          }
          if (field.integer_only && !Number.isInteger(num)) {
            errors.push(`${fieldName} must be a whole number`);
          }
          if (field.positive_only && num <= 0) {
            errors.push(`${fieldName} must be positive`);
          }
        }
        break;

      case 'choice':
        if (Array.isArray(value)) {
          if (field.min_selections && value.length < field.min_selections) {
            errors.push(`Select at least ${field.min_selections} options for ${fieldName}`);
          }
          if (field.max_selections && value.length > field.max_selections) {
            errors.push(`Select at most ${field.max_selections} options for ${fieldName}`);
          }
        }
        break;
    }

    return errors;
  }
}
