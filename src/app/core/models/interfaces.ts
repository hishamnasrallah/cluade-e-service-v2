// src/app/core/models/interfaces.ts

// Authentication models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

// Service models
export interface Service {
  id: number;
  parent_lookup: number;
  type: number;
  name: string;
  name_ara: string | null;
  code: string;
  icon: string | null;
  active_ind: boolean;
}

export interface ServicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}

// Lookup models - Enhanced for better choice field support
export interface LookupOption {
  id: number;
  name: string;
  name_ara: string | null;
  code: string;
  icon: string | null;
  parent_lookup?: number;
  type?: number;
  active_ind?: boolean;
}

export interface LookupResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LookupOption[];
}

// Visibility condition models
export interface ConditionRule {
  field: string;
  operation: string;
  value: any;
}

export interface VisibilityCondition {
  condition_logic: ConditionRule[];
}

// Service flow field models - Enhanced with better typing
export interface ServiceFlowField {
  name: string;
  field_id: number;
  display_name: string;
  display_name_ara: string | null;
  field_type: 'text' | 'number' | 'boolean' | 'choice' | 'file' | 'decimal' | 'percentage';
  mandatory: boolean;
  lookup: number | null;
  allowed_lookups: LookupOption[];
  sub_fields: ServiceFlowField[];
  is_hidden: boolean;
  is_disabled: boolean;
  visibility_conditions: VisibilityCondition[];

  // Text field specific
  max_length?: number;
  min_length?: number;
  regex_pattern?: string | null;
  allowed_characters?: string | null;
  forbidden_words?: string;

  // Number field specific
  value_greater_than?: number;
  value_less_than?: number | null;
  integer_only?: boolean;
  positive_only?: boolean;
  precision?: number | null;

  // Boolean field specific
  default_boolean?: boolean;

  // Choice field specific
  max_selections?: number | null;
  min_selections?: number | null;

  // File field specific
  file_types?: string | null;
  max_file_size?: number | null;
  image_max_width?: number | null;
  image_max_height?: number | null;
}

export interface ServiceFlowCategory {
  id: number;
  name: string;
  name_ara: string;
  repeatable: boolean;
  fields: ServiceFlowField[];
}

export interface ServiceFlowStep {
  sequence_number: string;
  name: string;
  name_ara: string | null;
  description: string;
  description_ara: string;
  is_hidden_page: boolean;
  page_id: number;
  categories: ServiceFlowCategory[];
}

export interface ServiceFlowResponse {
  service_flow: ServiceFlowStep[];
}

// Application models - Fixed to use numeric status from API
export interface Application {
  id: number;
  applicant: number;
  applicant_type: number;
  case_type: number;
  status: number; // Numeric status from API (20=draft, 11=submitted, 21=completed, 44=returned)
  sub_status: number | null;
  assigned_group: number | null;
  assigned_emp: number | null;
  current_approval_step: number;
  last_action: number | null;
  created_by: number;
  updated_by: number;
  case_data: { [key: string]: any };
  serial_number: string;
  created_at: string;
  updated_at: string;

  // Additional computed properties
  title?: string;
  service_name?: string;
}

export interface ApplicationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Application[];
}

// Form submission models
export interface CaseSubmission {
  applicant_type: number;
  case_type: number;
  case_data: { [key: string]: any };
  file_types?: string[];
}

// Wizard state models
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  formData: { [key: string]: any };
  completedSteps: boolean[];
  isValid: boolean;
}

// Configuration models
export interface AppConfig {
  baseUrl: string;
  isConfigured: boolean;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: { [key: string]: string[] };
}

// Form validation models
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationState {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: { [key: string]: string[] };
}

// Utility types
export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'file'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'decimal'
  | 'percentage';

// Updated ApplicationStatus to work with both string and numeric values
export type ApplicationStatus = 'draft' | 'returned' | 'submitted' | 'completed' | 'all';

export type ConditionOperation =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'startswith'
  | 'endswith'
  | 'contains'
  | 'in'
  | 'not in'
  | 'matches'
  | 'before'
  | 'after';

// Status mapping utilities
export const STATUS_MAPPING: { [key: number]: ApplicationStatus } = {
  20: 'draft',
  11: 'submitted',
  21: 'completed',
  44: 'returned'
};

export const STATUS_REVERSE_MAPPING: { [key in ApplicationStatus]: number[] } = {
  'draft': [20],
  'submitted': [11],
  'completed': [21],
  'returned': [44],
  'all': [20, 11, 21, 44]
};

// Helper functions to convert between numeric and string status
export function getStatusString(numericStatus: number): ApplicationStatus {
  return STATUS_MAPPING[numericStatus] || 'draft';
}

export function getStatusNumbers(stringStatus: ApplicationStatus): number[] {
  return STATUS_REVERSE_MAPPING[stringStatus] || [];
}

export function getStatusLabel(status: number): string {
  const statusMap: { [key: number]: string } = {
    20: 'Draft',
    11: 'Submitted',
    21: 'Completed',
    44: 'Returned'
  };
  return statusMap[status] || 'Unknown';
}

export function getStatusIcon(status: number): string {
  const iconMap: { [key: number]: string } = {
    20: 'edit',
    11: 'send',
    21: 'check_circle',
    44: 'undo'
  };
  return iconMap[status] || 'help';
}

// Field visibility and validation helper functions
export function evaluateVisibilityCondition(
  condition: VisibilityCondition,
  formData: { [key: string]: any }
): boolean {
  if (!condition.condition_logic || condition.condition_logic.length === 0) {
    return true;
  }

  // For now, implement simple AND logic for all conditions
  return condition.condition_logic.every(rule =>
    evaluateConditionRule(rule, formData)
  );
}

export function evaluateConditionRule(
  rule: ConditionRule,
  formData: { [key: string]: any }
): boolean {
  const fieldValue = formData[rule.field];
  const ruleValue = rule.value;

  switch (rule.operation) {
    case '=':
      return fieldValue == ruleValue;
    case '!=':
      return fieldValue != ruleValue;
    case '>':
      return Number(fieldValue) > Number(ruleValue);
    case '<':
      return Number(fieldValue) < Number(ruleValue);
    case '>=':
      return Number(fieldValue) >= Number(ruleValue);
    case '<=':
      return Number(fieldValue) <= Number(ruleValue);
    case 'startswith':
      return String(fieldValue).startsWith(String(ruleValue));
    case 'endswith':
      return String(fieldValue).endsWith(String(ruleValue));
    case 'contains':
      return String(fieldValue).includes(String(ruleValue));
    case 'in':
      return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
    case 'not in':
      return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
    default:
      return true;
  }
}

// Choice field specific helper functions
export function formatChoiceValue(value: any, field: ServiceFlowField): any {
  if (field.max_selections === 1) {
    // Single selection - return the value directly
    return Array.isArray(value) ? value[0] || null : value;
  } else {
    // Multiple selection - ensure it's an array
    return Array.isArray(value) ? value : (value ? [value] : []);
  }
}

export function validateChoiceField(
  value: any,
  field: ServiceFlowField
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let isValid = true;
  const fieldName = field.display_name || field.name;

  // Check if field is required
  if (field.mandatory) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push(`${fieldName} is required`);
      isValid = false;
    }
  }

  // Check selection constraints for multiple choice fields
  if (value && field.max_selections !== 1) {
    const selections = Array.isArray(value) ? value : [value];

    if (field.min_selections && selections.length < field.min_selections) {
      errors.push(`${fieldName} requires at least ${field.min_selections} selections`);
      isValid = false;
    }

    if (field.max_selections && selections.length > field.max_selections) {
      errors.push(`${fieldName} allows at most ${field.max_selections} selections`);
      isValid = false;
    }
  }

  return { isValid, errors };
}

// Lookup helper functions
export function shouldFetchLookupOptions(field: ServiceFlowField): boolean {
  // Should fetch from API if field has a lookup ID
  return !!(field.lookup && field.lookup > 0);
}

export function hasStaticLookupOptions(field: ServiceFlowField): boolean {
  // Has static options if allowed_lookups is provided without a lookup ID
  return !!(field.allowed_lookups && field.allowed_lookups.length > 0 && !field.lookup);
}

export function filterLookupOptions(
  allOptions: LookupOption[],
  allowedOptions: LookupOption[]
): LookupOption[] {
  if (!allowedOptions || allowedOptions.length === 0) {
    return allOptions;
  }

  const allowedIds = allowedOptions.map(opt => opt.id);
  return allOptions.filter(opt => allowedIds.includes(opt.id));
}

// Form data processing helper functions
export function processFormDataForSubmission(
  formData: { [key: string]: any },
  fields: ServiceFlowField[]
): { [key: string]: any } {
  const processed: { [key: string]: any } = { ...formData };

  fields.forEach(field => {
    const value = processed[field.name];

    if (value !== undefined && value !== null) {
      switch (field.field_type) {
        case 'choice':
          processed[field.name] = formatChoiceValue(value, field);
          break;
        case 'number':
        case 'decimal':
        case 'percentage':
          if (typeof value === 'string' && value.trim() !== '') {
            processed[field.name] = Number(value);
          }
          break;
        case 'boolean':
          processed[field.name] = Boolean(value);
          break;
        case 'text':
          if (typeof value === 'string') {
            processed[field.name] = value.trim();
          }
          break;
      }
    }
  });

  return processed;
}

// File handling helper functions
export function extractFileTypes(
  formData: { [key: string]: any },
  fields: ServiceFlowField[]
): string[] {
  const fileTypes: string[] = [];

  fields.forEach(field => {
    if (field.field_type === 'file' && formData[field.name]) {
      // If field has allowed_lookups, use the first one's code
      if (field.allowed_lookups && field.allowed_lookups.length > 0) {
        fileTypes.push(field.allowed_lookups[0].code);
      } else {
        // Default file type if no specific type is configured
        fileTypes.push('01');
      }
    }
  });

  return fileTypes;
}

export function hasFileFields(fields: ServiceFlowField[]): boolean {
  return fields.some(field => field.field_type === 'file');
}

export function getFileFields(fields: ServiceFlowField[]): ServiceFlowField[] {
  return fields.filter(field => field.field_type === 'file');
}
