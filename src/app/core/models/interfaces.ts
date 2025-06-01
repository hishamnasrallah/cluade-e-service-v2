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

// Service flow models
export interface ServiceFlowField {
  name: string;
  field_id: number;
  display_name: string;
  display_name_ara: string | null;
  field_type: string;
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

// Visibility condition models
export interface ConditionRule {
  field: string;
  operation: string;
  value: any;
}

export interface VisibilityCondition {
  condition_logic: ConditionRule[];
}

// Lookup models
export interface LookupOption {
  name: string;
  id: number;
  code: string;
  icon: string | null;
}

export interface LookupResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LookupOption[];
}

// Application models
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
