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

// Visibility condition models - Enhanced for complex conditions
export interface ConditionRule {
  field?: string;
  operation: string;
  value?: any;
  conditions?: ConditionRule[];
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
  | 'after'
  | 'and'
  | 'or'
  | 'not';

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

// Enhanced field visibility and validation helper functions
export function evaluateVisibilityCondition(
  condition: VisibilityCondition,
  formData: { [key: string]: any }
): boolean {
  if (!condition.condition_logic || condition.condition_logic.length === 0) {
    return true;
  }

  console.log('🔍 Evaluating visibility condition:', condition.condition_logic, 'with form data:', formData);

  // Evaluate all condition logic rules - they are implicitly AND-ed together
  const result = condition.condition_logic.every(rule =>
    evaluateConditionRule(rule, formData)
  );

  console.log('✅ Visibility condition result:', result);
  return result;
}

export function evaluateConditionRule(
  rule: ConditionRule,
  formData: { [key: string]: any }
): boolean {
  console.log('🔍 Evaluating rule:', rule, 'with form data:', formData);

  // Handle logical operators with nested conditions
  switch (rule.operation) {
    case 'and':
      if (!rule.conditions || rule.conditions.length === 0) {
        return true;
      }
      const andResult = rule.conditions.every(condition => evaluateConditionRule(condition, formData));
      console.log('🔗 AND operation result:', andResult);
      return andResult;

    case 'or':
      if (!rule.conditions || rule.conditions.length === 0) {
        return false;
      }
      const orResult = rule.conditions.some(condition => evaluateConditionRule(condition, formData));
      console.log('🔗 OR operation result:', orResult);
      return orResult;

    case 'not':
      if (!rule.conditions || rule.conditions.length === 0) {
        return false;
      }
      const notResult = !rule.conditions.every(condition => evaluateConditionRule(condition, formData));
      console.log('🔗 NOT operation result:', notResult);
      return notResult;
  }

  // Handle field-based operations
  if (!rule.field) {
    console.warn('⚠️ Rule has no field specified:', rule);
    return true;
  }

  const fieldValue = getFormFieldValue(formData, rule.field);

  // FIXED: Handle field-to-field comparisons
  let ruleValue = rule.value;
  if (ruleValue && typeof ruleValue === 'object' && ruleValue.field) {
    // This is a field reference, get the value from the referenced field
    ruleValue = getFormFieldValue(formData, ruleValue.field);
    console.log(`🔗 Field-to-field comparison: ${rule.field} vs ${rule.value.field}`);
    console.log(`📝 Values: "${fieldValue}" ${rule.operation} "${ruleValue}"`);
  } else {
    console.log(`📝 Comparing field "${rule.field}": "${fieldValue}" ${rule.operation} "${ruleValue}"`);
  }

  switch (rule.operation) {
    case '=':
      const equalResult = compareValues(fieldValue, ruleValue, '=');
      console.log('🎯 Equal comparison result:', equalResult);
      return equalResult;

    case '!=':
      const notEqualResult = compareValues(fieldValue, ruleValue, '!=');
      console.log('🎯 Not equal comparison result:', notEqualResult);
      return notEqualResult;

    case '>':
      return compareNumbers(fieldValue, ruleValue, '>');

    case '<':
      return compareNumbers(fieldValue, ruleValue, '<');

    case '>=':
      return compareNumbers(fieldValue, ruleValue, '>=');

    case '<=':
      return compareNumbers(fieldValue, ruleValue, '<=');

    case 'startswith':
      return compareStrings(fieldValue, ruleValue, 'startswith');

    case 'endswith':
      return compareStrings(fieldValue, ruleValue, 'endswith');

    case 'contains':
      return compareStrings(fieldValue, ruleValue, 'contains');

    case 'in':
      if (Array.isArray(ruleValue)) {
        return ruleValue.some(val => compareValues(fieldValue, val, '='));
      }
      return false;

    case 'not in':
      if (Array.isArray(ruleValue)) {
        return !ruleValue.some(val => compareValues(fieldValue, val, '='));
      }
      return true;

    case 'matches':
      try {
        const regex = new RegExp(String(ruleValue));
        return regex.test(String(fieldValue || ''));
      } catch (error) {
        console.error('Invalid regex pattern:', ruleValue);
        return false;
      }

    default:
      console.warn('⚠️ Unknown operation:', rule.operation);
      return true;
  }
}

// Helper function to get form field value, handling nested paths if needed
function getFormFieldValue(formData: { [key: string]: any }, fieldName: string): any {
  // Handle nested field paths (e.g., "user.name")
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    let value = formData;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined || value === null) {
        break;
      }
    }
    return value;
  }

  return formData[fieldName];
}

// Enhanced value comparison function that handles different data types properly
function compareValues(fieldValue: any, ruleValue: any, operation: '=' | '!='): boolean {
  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    fieldValue = '';
  }
  if (ruleValue === null || ruleValue === undefined) {
    ruleValue = '';
  }

  // Handle boolean values specifically
  if (typeof ruleValue === 'boolean' || ruleValue === 'true' || ruleValue === 'false') {
    const fieldBool = convertToBoolean(fieldValue);
    const ruleBool = convertToBoolean(ruleValue);

    console.log(`🔢 Boolean comparison: field="${fieldBool}" rule="${ruleBool}"`);

    if (operation === '=') {
      return fieldBool === ruleBool;
    } else {
      return fieldBool !== ruleBool;
    }
  }

  // Handle numeric values
  if (typeof ruleValue === 'number' || !isNaN(Number(ruleValue))) {
    const fieldNum = Number(fieldValue);
    const ruleNum = Number(ruleValue);

    if (!isNaN(fieldNum) && !isNaN(ruleNum)) {
      console.log(`🔢 Numeric comparison: field=${fieldNum} rule=${ruleNum}`);
      if (operation === '=') {
        return fieldNum === ruleNum;
      } else {
        return fieldNum !== ruleNum;
      }
    }
  }

  // Handle string values (default case)
  const fieldStr = String(fieldValue).trim();
  const ruleStr = String(ruleValue).trim();

  console.log(`📝 String comparison: field="${fieldStr}" rule="${ruleStr}"`);

  if (operation === '=') {
    return fieldStr === ruleStr;
  } else {
    return fieldStr !== ruleStr;
  }
}

// Helper function to convert various values to boolean
function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'on';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
}

// Helper function for number comparisons
function compareNumbers(fieldValue: any, ruleValue: any, operation: '>' | '<' | '>=' | '<='): boolean {
  const fieldNum = Number(fieldValue);
  const ruleNum = Number(ruleValue);

  if (isNaN(fieldNum) || isNaN(ruleNum)) {
    console.warn('⚠️ Non-numeric values in number comparison:', fieldValue, ruleValue);
    return false;
  }

  switch (operation) {
    case '>':
      return fieldNum > ruleNum;
    case '<':
      return fieldNum < ruleNum;
    case '>=':
      return fieldNum >= ruleNum;
    case '<=':
      return fieldNum <= ruleNum;
    default:
      return false;
  }
}

// Helper function for string comparisons
function compareStrings(fieldValue: any, ruleValue: any, operation: 'startswith' | 'endswith' | 'contains'): boolean {
  const fieldStr = String(fieldValue || '');
  const ruleStr = String(ruleValue || '');

  switch (operation) {
    case 'startswith':
      return fieldStr.startsWith(ruleStr);
    case 'endswith':
      return fieldStr.endsWith(ruleStr);
    case 'contains':
      return fieldStr.includes(ruleStr);
    default:
      return false;
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
          processed[field.name] = convertToBoolean(value);
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




// Additional helper function to add to src/app/core/models/interfaces.ts
// Add this function at the end of the interfaces.ts file

/**
 * Enhanced condition evaluation specifically for debugging visibility issues
 */
export function debugEvaluateVisibilityCondition(
  condition: VisibilityCondition,
  formData: { [key: string]: any },
  fieldName?: string
): { result: boolean; debug: any } {
  const debugInfo: any = {
    fieldName: fieldName || 'unknown',
    condition: condition,
    formData: formData,
    evaluationSteps: []
  };

  if (!condition.condition_logic || condition.condition_logic.length === 0) {
    debugInfo.result = true;
    debugInfo.reason = 'No conditions specified';
    return { result: true, debug: debugInfo };
  }

  console.log(`🔍 DEBUG: Evaluating visibility for field "${fieldName}"`);
  console.log(`🔍 DEBUG: Form data:`, formData);
  console.log(`🔍 DEBUG: Conditions:`, condition.condition_logic);

  // Evaluate all condition logic rules - they are implicitly AND-ed together
  const results = condition.condition_logic.map((rule, index) => {
    const stepResult = debugEvaluateConditionRule(rule, formData, `step-${index}`);
    debugInfo.evaluationSteps.push(stepResult);
    return stepResult.result;
  });

  const finalResult = results.every(r => r === true);

  debugInfo.result = finalResult;
  debugInfo.individualResults = results;

  console.log(`✅ DEBUG: Final visibility result for "${fieldName}":`, finalResult);
  console.log(`✅ DEBUG: Individual step results:`, results);

  return { result: finalResult, debug: debugInfo };
}

/**
 * Enhanced condition rule evaluation with detailed debugging
 */
export function debugEvaluateConditionRule(
  rule: ConditionRule,
  formData: { [key: string]: any },
  stepId: string
): { result: boolean; debug: any } {
  const debugInfo: any = {
    stepId,
    rule: rule,
    formData: formData
  };

  console.log(`🔍 DEBUG: Evaluating rule ${stepId}:`, rule);

  // Handle logical operators with nested conditions
  switch (rule.operation) {
    case 'and':
      if (!rule.conditions || rule.conditions.length === 0) {
        debugInfo.result = true;
        debugInfo.reason = 'Empty AND condition';
        return { result: true, debug: debugInfo };
      }
      const andResults = rule.conditions.map((condition, index) =>
        debugEvaluateConditionRule(condition, formData, `${stepId}-and-${index}`)
      );
      const andResult = andResults.every(r => r.result);
      debugInfo.result = andResult;
      debugInfo.nestedResults = andResults;
      console.log(`🔗 DEBUG: AND operation result for ${stepId}:`, andResult);
      return { result: andResult, debug: debugInfo };

    case 'or':
      if (!rule.conditions || rule.conditions.length === 0) {
        debugInfo.result = false;
        debugInfo.reason = 'Empty OR condition';
        return { result: false, debug: debugInfo };
      }
      const orResults = rule.conditions.map((condition, index) =>
        debugEvaluateConditionRule(condition, formData, `${stepId}-or-${index}`)
      );
      const orResult = orResults.some(r => r.result);
      debugInfo.result = orResult;
      debugInfo.nestedResults = orResults;
      console.log(`🔗 DEBUG: OR operation result for ${stepId}:`, orResult);
      return { result: orResult, debug: debugInfo };

    case 'not':
      if (!rule.conditions || rule.conditions.length === 0) {
        debugInfo.result = false;
        debugInfo.reason = 'Empty NOT condition';
        return { result: false, debug: debugInfo };
      }
      const notResults = rule.conditions.map((condition, index) =>
        debugEvaluateConditionRule(condition, formData, `${stepId}-not-${index}`)
      );
      const notResult = !notResults.every(r => r.result);
      debugInfo.result = notResult;
      debugInfo.nestedResults = notResults;
      console.log(`🔗 DEBUG: NOT operation result for ${stepId}:`, notResult);
      return { result: notResult, debug: debugInfo };
  }

  // Handle field-based operations
  if (!rule.field) {
    console.warn(`⚠️ DEBUG: Rule ${stepId} has no field specified:`, rule);
    debugInfo.result = true;
    debugInfo.reason = 'No field specified, defaulting to true';
    return { result: true, debug: debugInfo };
  }

  const fieldValue = getFormFieldValue(formData, rule.field);
  const ruleValue = rule.value;

  debugInfo.fieldValue = fieldValue;
  debugInfo.ruleValue = ruleValue;
  debugInfo.fieldValueType = typeof fieldValue;
  debugInfo.ruleValueType = typeof ruleValue;

  console.log(`📝 DEBUG: Comparing field "${rule.field}" for ${stepId}:`);
  console.log(`📝 DEBUG: Field value: "${fieldValue}" (${typeof fieldValue})`);
  console.log(`📝 DEBUG: Rule value: "${ruleValue}" (${typeof ruleValue})`);
  console.log(`📝 DEBUG: Operation: "${rule.operation}"`);

  let result: boolean;

  switch (rule.operation) {
    case '=':
      result = debugCompareValues(fieldValue, ruleValue, '=', debugInfo);
      break;

    case '!=':
      result = debugCompareValues(fieldValue, ruleValue, '!=', debugInfo);
      break;

    case '>':
      result = compareNumbers(fieldValue, ruleValue, '>');
      debugInfo.comparisonType = 'numeric';
      break;

    case '<':
      result = compareNumbers(fieldValue, ruleValue, '<');
      debugInfo.comparisonType = 'numeric';
      break;

    case '>=':
      result = compareNumbers(fieldValue, ruleValue, '>=');
      debugInfo.comparisonType = 'numeric';
      break;

    case '<=':
      result = compareNumbers(fieldValue, ruleValue, '<=');
      debugInfo.comparisonType = 'numeric';
      break;

    case 'startswith':
      result = compareStrings(fieldValue, ruleValue, 'startswith');
      debugInfo.comparisonType = 'string';
      break;

    case 'endswith':
      result = compareStrings(fieldValue, ruleValue, 'endswith');
      debugInfo.comparisonType = 'string';
      break;

    case 'contains':
      result = compareStrings(fieldValue, ruleValue, 'contains');
      debugInfo.comparisonType = 'string';
      break;

    case 'in':
      if (Array.isArray(ruleValue)) {
        result = ruleValue.some(val => debugCompareValues(fieldValue, val, '=', debugInfo));
      } else {
        result = false;
      }
      debugInfo.comparisonType = 'array_membership';
      break;

    case 'not in':
      if (Array.isArray(ruleValue)) {
        result = !ruleValue.some(val => debugCompareValues(fieldValue, val, '=', debugInfo));
      } else {
        result = true;
      }
      debugInfo.comparisonType = 'array_membership';
      break;

    case 'matches':
      try {
        const regex = new RegExp(String(ruleValue));
        result = regex.test(String(fieldValue || ''));
        debugInfo.comparisonType = 'regex';
      } catch (error) {
        console.error('Invalid regex pattern:', ruleValue);
        result = false;
        debugInfo.error = `Invalid regex: ${error}`;
      }
      break;

    default:
      console.warn(`⚠️ DEBUG: Unknown operation for ${stepId}:`, rule.operation);
      result = true;
      debugInfo.reason = 'Unknown operation, defaulting to true';
  }

  debugInfo.result = result;
  console.log(`🎯 DEBUG: Comparison result for ${stepId}:`, result);

  return { result, debug: debugInfo };
}

/**
 * Enhanced value comparison with debugging
 */
function debugCompareValues(
  fieldValue: any,
  ruleValue: any,
  operation: '=' | '!=',
  debugInfo: any
): boolean {
  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    fieldValue = '';
  }
  if (ruleValue === null || ruleValue === undefined) {
    ruleValue = '';
  }

  debugInfo.normalizedFieldValue = fieldValue;
  debugInfo.normalizedRuleValue = ruleValue;

  // Handle boolean values specifically
  if (typeof ruleValue === 'boolean' || ruleValue === 'true' || ruleValue === 'false') {
    const fieldBool = convertToBoolean(fieldValue);
    const ruleBool = convertToBoolean(ruleValue);

    debugInfo.comparisonType = 'boolean';
    debugInfo.fieldValueAsBoolean = fieldBool;
    debugInfo.ruleValueAsBoolean = ruleBool;

    console.log(`🔢 DEBUG: Boolean comparison: field="${fieldBool}" rule="${ruleBool}"`);

    const result = operation === '=' ? fieldBool === ruleBool : fieldBool !== ruleBool;
    debugInfo.booleanComparisonResult = result;
    return result;
  }

  // Handle numeric values
  if (typeof ruleValue === 'number' || !isNaN(Number(ruleValue))) {
    const fieldNum = Number(fieldValue);
    const ruleNum = Number(ruleValue);

    if (!isNaN(fieldNum) && !isNaN(ruleNum)) {
      debugInfo.comparisonType = 'numeric';
      debugInfo.fieldValueAsNumber = fieldNum;
      debugInfo.ruleValueAsNumber = ruleNum;

      console.log(`🔢 DEBUG: Numeric comparison: field=${fieldNum} rule=${ruleNum}`);

      const result = operation === '=' ? fieldNum === ruleNum : fieldNum !== ruleNum;
      debugInfo.numericComparisonResult = result;
      return result;
    }
  }

  // Handle string values (default case)
  const fieldStr = String(fieldValue).trim();
  const ruleStr = String(ruleValue).trim();

  debugInfo.comparisonType = 'string';
  debugInfo.fieldValueAsString = fieldStr;
  debugInfo.ruleValueAsString = ruleStr;

  console.log(`📝 DEBUG: String comparison: field="${fieldStr}" rule="${ruleStr}"`);

  const result = operation === '=' ? fieldStr === ruleStr : fieldStr !== ruleStr;
  debugInfo.stringComparisonResult = result;
  return result;
}
