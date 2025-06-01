// src/app/core/services/form-validation.service.ts
import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import {
  ServiceFlowField,
  ConditionRule,
  evaluateConditionRule,
  evaluateVisibilityCondition,
  formatChoiceValue,
  validateChoiceField,
  processFormDataForSubmission
} from '../models/interfaces';

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

    console.log('🔧 FormValidation: Creating validators for field:', field.name, 'Type:', field.field_type);

    // Required validator
    if (field.mandatory) {
      validators.push(this.requiredValidator(field));
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
      validators.push(this.choiceFieldValidator(field));
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

    console.log('✅ FormValidation: Created', validators.length, 'validators for field:', field.name);
    return validators;
  }

  /**
   * Validate field visibility based on conditions
   */
  evaluateFieldVisibility(field: ServiceFlowField, formData: any): boolean {
    if (!field.visibility_conditions || field.visibility_conditions.length === 0) {
      return !field.is_hidden;
    }

    console.log('👁️ FormValidation: Evaluating visibility for field:', field.name, 'Conditions:', field.visibility_conditions);

    // Evaluate all visibility conditions (AND logic between multiple conditions)
    const isVisible = field.visibility_conditions.every(condition =>
        evaluateVisibilityCondition(condition, formData)
    );

    const finalVisibility = isVisible && !field.is_hidden;
    console.log('👁️ FormValidation: Final visibility for', field.name, ':', finalVisibility);

    return finalVisibility;
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

    if (errors['choiceValidation']) {
      // Choice field validation errors are handled specially
      const choiceErrors = errors['choiceValidation'].errors || [];
      messages.push(...choiceErrors);
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
   * Format form data for submission with enhanced type handling
   */
  formatFormDataForSubmission(formData: any, fields: ServiceFlowField[]): any {
    console.log('📦 FormValidation: Formatting form data for submission');
    return processFormDataForSubmission(formData, fields);
  }

  // Enhanced private validator methods

  private requiredValidator(field: ServiceFlowField): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Enhanced empty value checking based on field type
      if (this.isValueEmpty(value, field.field_type)) {
        return { required: true };
      }

      return null;
    };
  }

  private isValueEmpty(value: any, fieldType: string): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    switch (fieldType) {
      case 'text':
        return typeof value === 'string' && value.trim() === '';

      case 'choice':
        return Array.isArray(value) ? value.length === 0 : (value === '' || value === null);

      case 'file':
        return !(value instanceof File);

      case 'number':
      case 'decimal':
      case 'percentage':
        return value === '' || (typeof value === 'string' && value.trim() === '');

      case 'boolean':
        return false; // Boolean fields are never empty

      default:
        return value === '' || (typeof value === 'string' && value.trim() === '');
    }
  }

  private choiceFieldValidator(field: ServiceFlowField): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      console.log('🔍 FormValidation: Validating choice field:', field.name, 'Value:', value);

      // Use the enhanced choice field validation
      const validation = validateChoiceField(value, field);

      if (!validation.isValid) {
        return {
          choiceValidation: {
            errors: validation.errors,
            field: field.name
          }
        };
      }

      return null;
    };
  }

  private minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value && value.length < minLength) {
        return { minlength: { requiredLength: minLength, actualLength: value.length } };
      }
      return null;
    };
  }

  private maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value && value.length > maxLength) {
        return { maxlength: { requiredLength: maxLength, actualLength: value.length } };
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
        console.error('❌ FormValidation: Invalid regex pattern:', pattern, error);
      }
      return null;
    };
  }

  private allowedCharactersValidator(allowedChars: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        const allowedPattern = new RegExp(`^[${this.escapeRegExp(allowedChars)}]*$`);
        if (!allowedPattern.test(control.value)) {
          return { allowedCharacters: { allowedChars, actualValue: control.value } };
        }
      } catch (error) {
        console.error('❌ FormValidation: Invalid allowed characters pattern:', allowedChars, error);
      }
      return null;
    };
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private forbiddenWordsValidator(forbiddenWords: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !forbiddenWords) return null;

      const words = forbiddenWords.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
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
      if (control.value !== null && control.value !== undefined && control.value !== '') {
        const numValue = Number(control.value);
        if (!isNaN(numValue) && numValue <= minValue) {
          return { min: { min: minValue, actual: numValue } };
        }
      }
      return null;
    };
  }

  private maxValueValidator(maxValue: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value !== '') {
        const numValue = Number(control.value);
        if (!isNaN(numValue) && numValue >= maxValue) {
          return { max: { max: maxValue, actual: numValue } };
        }
      }
      return null;
    };
  }

  private integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value !== '') {
        const num = Number(control.value);
        if (!isNaN(num) && !Number.isInteger(num)) {
          return { integer: true };
        }
      }
      return null;
    };
  }

  private positiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value !== '') {
        const num = Number(control.value);
        if (!isNaN(num) && num <= 0) {
          return { positive: true };
        }
      }
      return null;
    };
  }

  private precisionValidator(maxPrecision: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value !== null && control.value !== undefined && control.value !== '') {
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
        const allowedTypesArray = allowedTypes.split(',').map(t => t.trim().toLowerCase());
        const fileExtension = '.' + control.value.name.split('.').pop()?.toLowerCase();
        const mimeType = control.value.type.toLowerCase();

        // Check both file extension and MIME type
        const isValidExtension = allowedTypesArray.some(type =>
            type.startsWith('.') ? type === fileExtension : mimeType.includes(type)
        );

        if (!isValidExtension) {
          return { fileType: { allowedTypes, actualType: fileExtension, actualMimeType: mimeType } };
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
            URL.revokeObjectURL(img.src); // Clean up

            if ((maxWidth && img.width > maxWidth) || (maxHeight && img.height > maxHeight)) {
              resolve({
                imageDimensions: {
                  maxWidth,
                  maxHeight,
                  actualWidth: img.width,
                  actualHeight: img.height
                }
              });
            } else {
              resolve(null);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(img.src); // Clean up
            resolve({ imageDimensions: { error: 'Unable to load image' } });
          };
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate entire form step with enhanced logic
   */
  validateFormStep(formData: any, fields: ServiceFlowField[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    console.log('✅ FormValidation: Validating form step with', fields.length, 'fields');

    fields.forEach(field => {
      const value = formData[field.name];

      // Skip hidden fields and evaluate visibility conditions
      if (field.is_hidden || !this.evaluateFieldVisibility(field, formData)) {
        console.log('⏭️ FormValidation: Skipping hidden/invisible field:', field.name);
        return;
      }

      console.log('🔍 FormValidation: Validating field:', field.name, 'Value:', value);

      // Check required fields with enhanced empty checking
      if (field.mandatory && this.isValueEmpty(value, field.field_type)) {
        errors.push(`${field.display_name || field.name} is required`);
        isValid = false;
      }

      // Additional validation based on field type
      if (!this.isValueEmpty(value, field.field_type)) {
        const fieldErrors = this.validateFieldValue(value, field);
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors);
          isValid = false;
        }
      }
    });

    console.log('✅ FormValidation: Step validation result:', { isValid, errors });
    return { isValid, errors };
  }

  /**
   * Validate individual field value with enhanced type handling
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
            console.error('❌ FormValidation: Invalid regex pattern:', field.regex_pattern);
          }
        }
        if (field.allowed_characters) {
          try {
            const allowedPattern = new RegExp(`^[${this.escapeRegExp(field.allowed_characters)}]*$`);
            if (!allowedPattern.test(value)) {
              errors.push(`${fieldName} contains invalid characters`);
            }
          } catch (error) {
            console.error('❌ FormValidation: Invalid allowed characters:', field.allowed_characters);
          }
        }
        if (field.forbidden_words) {
          const words = field.forbidden_words.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
          const lowerValue = value.toLowerCase();
          const foundWord = words.find(word => lowerValue.includes(word));
          if (foundWord) {
            errors.push(`${fieldName} contains forbidden word: ${foundWord}`);
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
          if (field.precision !== undefined && field.precision !== null) {
            const str = num.toString();
            const decimalIndex = str.indexOf('.');
            if (decimalIndex !== -1) {
              const decimalPlaces = str.length - decimalIndex - 1;
              if (decimalPlaces > field.precision) {
                errors.push(`${fieldName} can have at most ${field.precision} decimal places`);
              }
            }
          }
        }
        break;

      case 'choice':
        const validation = validateChoiceField(value, field);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
        break;

      case 'file':
        if (!(value instanceof File)) {
          errors.push(`${fieldName} must be a valid file`);
        } else {
          if (field.max_file_size && value.size > field.max_file_size) {
            errors.push(`${fieldName} file size must be less than ${this.formatFileSize(field.max_file_size)}`);
          }

          if (field.file_types) {
            const allowedTypesArray = field.file_types.split(',').map(t => t.trim().toLowerCase());
            const fileExtension = '.' + value.name.split('.').pop()?.toLowerCase();
            const mimeType = value.type.toLowerCase();

            const isValidType = allowedTypesArray.some(type =>
                type.startsWith('.') ? type === fileExtension : mimeType.includes(type)
            );

            if (!isValidType) {
              errors.push(`${fieldName} file type is not allowed. Allowed types: ${field.file_types}`);
            }
          }
        }
        break;
    }

    return errors;
  }
}
