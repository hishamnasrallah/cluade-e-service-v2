import { Injectable } from '@angular/core';
import { ServiceFlowField, FieldCalculation, CalculationRule } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FieldCalculationService {

  constructor() {}

  /**
   * Calculate all calculated fields in the given categories
   */
  calculateAllFields(
    categories: any[],
    formData: { [key: string]: any }
  ): { [key: string]: any } {
    console.log('🧮 FieldCalculation: Starting calculation for all fields');
    console.log('📊 FieldCalculation: Current form data:', formData);

    const calculatedValues: { [key: string]: any } = {};

    // Find all fields with calculations (regardless of field type)
    const calculatedFields: ServiceFlowField[] = [];
    let totalFieldsChecked = 0;

    categories.forEach((category, catIndex) => {
      console.log(`🔍 FieldCalculation: Checking category ${catIndex}:`, category.name || 'Unnamed');

      category.fields.forEach((field: ServiceFlowField) => {
        totalFieldsChecked++;
        console.log(`  📄 Field "${field.name}": type="${field.field_type}", has calculations=${!!field.calculations}`);

        // Check if field has calculations defined (regardless of field type)
        if (field.calculations && field.calculations.length > 0) {
          console.log(`  ✅ Found field with calculations: "${field.name}" (type: ${field.field_type})`);
          console.log(`    📊 Has ${field.calculations.length} calculation(s)`);
          calculatedFields.push(field);
        }
      });
    });

    console.log(`📊 FieldCalculation: Checked ${totalFieldsChecked} total fields`);
    console.log(`📋 FieldCalculation: Found ${calculatedFields.length} calculated fields:`,
      calculatedFields.map(f => ({ name: f.name, calculations: f.calculations })));

    // Sort fields by dependency order
    const sortedFields = this.sortFieldsByDependency(calculatedFields);
    console.log('📊 FieldCalculation: Sorted fields by dependency:', sortedFields.map(f => f.name));

    // Calculate values in dependency order
    sortedFields.forEach(field => {
      console.log(`\n🔄 FieldCalculation: Processing field "${field.name}"`);

      // Create a working copy of formData that includes already calculated values
      const workingFormData = { ...formData, ...calculatedValues };

      const value = this.calculateFieldValue(field, workingFormData);
      if (value !== undefined) {
        calculatedValues[field.name] = value;
        console.log(`✅ FieldCalculation: Result for "${field.name}" = ${value}`);
      } else {
        console.log(`❌ FieldCalculation: No value calculated for "${field.name}"`);
      }
    });

    console.log('\n📊 FieldCalculation: Final calculated values:', calculatedValues);
    return calculatedValues;
  }

  /**
   * Sort fields by dependency order using topological sort
   */
  private sortFieldsByDependency(fields: ServiceFlowField[]): ServiceFlowField[] {
    // Build dependency graph
    const dependencyGraph = new Map<string, Set<string>>();
    const fieldMap = new Map<string, ServiceFlowField>();

    // Initialize graph
    fields.forEach(field => {
      fieldMap.set(field.name, field);
      dependencyGraph.set(field.name, new Set(this.getFieldDependencies(field)));
    });

    // Topological sort
    const sorted: ServiceFlowField[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (fieldName: string) => {
      if (visited.has(fieldName)) return;
      if (visiting.has(fieldName)) {
        console.warn(`⚠️ FieldCalculation: Circular dependency detected involving field: ${fieldName}`);
        return;
      }

      visiting.add(fieldName);

      // Visit dependencies first
      const dependencies = dependencyGraph.get(fieldName) || new Set();
      dependencies.forEach(dep => {
        if (fieldMap.has(dep)) {
          visit(dep);
        }
      });

      visiting.delete(fieldName);
      visited.add(fieldName);

      const field = fieldMap.get(fieldName);
      if (field) {
        sorted.push(field);
      }
    };

    // Visit all fields
    fields.forEach(field => visit(field.name));

    return sorted;
  }

  /**
   * Calculate value for a single field
   */
  calculateFieldValue(
    field: ServiceFlowField,
    formData: { [key: string]: any }
  ): any {
    console.log(`🎯 FieldCalculation: Calculating value for field "${field.name}"`);

    if (!field.calculations || field.calculations.length === 0) {
      console.log(`⚠️ FieldCalculation: No calculations defined for field "${field.name}"`);
      return undefined;
    }

    console.log(`📋 FieldCalculation: Field "${field.name}" has ${field.calculations.length} calculation(s)`);

    // Process each calculation (usually there's only one)
    for (let i = 0; i < field.calculations.length; i++) {
      const calculation = field.calculations[i];
      console.log(`🔍 FieldCalculation: Evaluating calculation ${i + 1}:`, calculation);

      const result = this.evaluateCalculation(calculation, formData);
      if (result !== undefined) {
        console.log(`✅ FieldCalculation: Field "${field.name}" = ${result} (from calculation ${i + 1})`);
        return result;
      }
    }

    console.log(`❌ FieldCalculation: No valid result for field "${field.name}"`);
    return undefined;
  }

  /**
   * Evaluate a single calculation
   */
  private evaluateCalculation(
    calculation: FieldCalculation,
    formData: { [key: string]: any }
  ): any {
    console.log('🔧 FieldCalculation: Evaluating calculation:', calculation);

    if (!calculation.condition_logic || calculation.condition_logic.length === 0) {
      console.log('⚠️ FieldCalculation: No condition logic in calculation');
      return undefined;
    }

    console.log(`📝 FieldCalculation: Processing ${calculation.condition_logic.length} rule(s)`);

    // Process calculation rules sequentially
    let result: any = undefined;

    for (let i = 0; i < calculation.condition_logic.length; i++) {
      const rule = calculation.condition_logic[i];
      console.log(`\n🔄 FieldCalculation: Processing rule ${i + 1}:`, rule);

      const previousResult = result;
      result = this.evaluateCalculationRule(rule, formData, result);

      console.log(`📊 FieldCalculation: Rule ${i + 1} result:`, {
        previousValue: previousResult,
        newValue: result,
        rule: rule
      });
    }

    console.log('✅ FieldCalculation: Final calculation result:', result);
    return result;
  }

  /**
   * Evaluate a single calculation rule
   */
  private evaluateCalculationRule(
    rule: CalculationRule,
    formData: { [key: string]: any },
    previousResult?: any
  ): any {
    console.log('🧮 FieldCalculation: Evaluating rule:', {
      operation: rule.operation,
      field: rule.field,
      value: rule.value,
      previousResult: previousResult
    });

    // Handle age_conditional operation
    if (rule.operation === 'age_conditional') {
      console.log('🎂 FieldCalculation: Performing AGE_CONDITIONAL operation');
      return this.evaluateAgeConditional(rule, formData);
    }

    // Handle if_equals operation
    if (rule.operation === 'if_equals') {
      console.log('❓ FieldCalculation: Performing IF_EQUALS operation');
      return this.evaluateIfEquals(rule, formData);
    }

    // Handle if operation
    if (rule.operation === 'if') {
      console.log('🔀 FieldCalculation: Performing IF operation');
      return this.evaluateIf(rule, formData);
    }

    // Handle sum operation
    if (rule.operation === 'sum' && Array.isArray(rule.value)) {
      console.log('➕ FieldCalculation: Performing SUM operation on fields:', rule.value);
      let sum = 0;
      const sumDetails: any[] = [];

      for (const fieldName of rule.value) {
        if (fieldName.startsWith('-')) {
          // Negative value
          const actualFieldName = fieldName.substring(1);
          const fieldValue = formData[actualFieldName];
          const numericValue = this.getNumericValue(fieldValue);
          sum -= numericValue;
          sumDetails.push({ field: actualFieldName, value: fieldValue, numeric: -numericValue, operation: 'subtract' });
        } else {
          const fieldValue = formData[fieldName];
          const numericValue = this.getNumericValue(fieldValue);
          sum += numericValue;
          sumDetails.push({ field: fieldName, value: fieldValue, numeric: numericValue, operation: 'add' });
        }
      }

      console.log('📊 FieldCalculation: SUM details:', sumDetails);
      console.log('✅ FieldCalculation: SUM result:', sum);
      return sum;
    }

    // Get the base value
    let baseValue: any;
    if (rule.field) {
      baseValue = formData[rule.field];
      console.log(`📌 FieldCalculation: Base value from field "${rule.field}":`, baseValue);
    } else if (previousResult !== undefined) {
      baseValue = previousResult;
      console.log('📌 FieldCalculation: Base value from previous result:', baseValue);
    } else {
      baseValue = 0;
      console.log('📌 FieldCalculation: No base value, defaulting to 0');
    }

    // Get the operation value
    let operationValue: any = rule.value;
    if (rule.value && typeof rule.value === 'object' && rule.value.field) {
      // This is a field reference
      operationValue = formData[rule.value.field];
      console.log(`📌 FieldCalculation: Operation value from field "${rule.value.field}":`, operationValue);
    } else {
      console.log('📌 FieldCalculation: Operation value (literal):', operationValue);
    }

    console.log(`🎯 FieldCalculation: Performing ${rule.operation}: ${baseValue} ${rule.operation} ${operationValue}`);

    // Perform the operation
    switch (rule.operation) {
      case 'copy':
      case '=':
        console.log(`✅ FieldCalculation: COPY/ASSIGN result: ${operationValue}`);
        return operationValue;

      case '+':
        const addResult = this.getNumericValue(baseValue) + this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: ADD result: ${this.getNumericValue(baseValue)} + ${this.getNumericValue(operationValue)} = ${addResult}`);
        return addResult;

      case '-':
        const subResult = this.getNumericValue(baseValue) - this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: SUBTRACT result: ${this.getNumericValue(baseValue)} - ${this.getNumericValue(operationValue)} = ${subResult}`);
        return subResult;

      case '*':
        const mulResult = this.getNumericValue(baseValue) * this.getNumericValue(operationValue);
        console.log(`✅ FieldCalculation: MULTIPLY result: ${this.getNumericValue(baseValue)} * ${this.getNumericValue(operationValue)} = ${mulResult}`);
        return mulResult;

      case '/':
        const divisor = this.getNumericValue(operationValue);
        if (divisor === 0) {
          console.warn('⚠️ FieldCalculation: Division by zero, returning 0');
          return 0;
        }
        const divResult = this.getNumericValue(baseValue) / divisor;
        console.log(`✅ FieldCalculation: DIVIDE result: ${this.getNumericValue(baseValue)} / ${divisor} = ${divResult}`);
        return divResult;

      case '**':
        const powResult = Math.pow(this.getNumericValue(baseValue), this.getNumericValue(operationValue));
        console.log(`✅ FieldCalculation: POWER result: ${this.getNumericValue(baseValue)} ** ${this.getNumericValue(operationValue)} = ${powResult}`);
        return powResult;

      default:
        console.warn('⚠️ FieldCalculation: Unknown operation:', rule.operation);
        return baseValue;
    }
  }

  /**
   * Evaluate age conditional calculation
   */
  private evaluateAgeConditional(rule: any, formData: { [key: string]: any }): any {
    const dobFieldName = rule.field;
    const dobValue = formData[dobFieldName];

    if (!dobValue) {
      console.warn('⚠️ FieldCalculation: No date of birth value found');
      return 0;
    }

    // Calculate age from DOB
    const age = this.calculateAge(dobValue);
    console.log(`🎂 FieldCalculation: Calculated age: ${age} from DOB: ${dobValue}`);

    const ageThreshold = rule.age_threshold || 18;
    const underAgeField = rule.under_age_field;
    const overAgeField = rule.over_age_field;

    if (age < ageThreshold) {
      const underValue = formData[underAgeField] || 0;
      console.log(`✅ FieldCalculation: Age ${age} < ${ageThreshold}, returning value from "${underAgeField}": ${underValue}`);
      return underValue;
    } else {
      const overValue = formData[overAgeField] || 0;
      console.log(`✅ FieldCalculation: Age ${age} >= ${ageThreshold}, returning value from "${overAgeField}": ${overValue}`);
      return overValue;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dob: string | Date): number {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Evaluate if_equals conditional
   */
  private evaluateIfEquals(rule: any, formData: { [key: string]: any }): any {
    const fieldName = rule.field;
    const fieldValue = formData[fieldName];
    const checkValue = rule.check_value;
    const thenValue = rule.then_value;
    const elseValue = rule.else_value;

    console.log(`❓ FieldCalculation: Checking if "${fieldName}" (${fieldValue}) equals ${checkValue}`);

    // Convert values for comparison if needed
    const isEqual = this.compareValues(fieldValue, checkValue);

    if (isEqual) {
      console.log(`✅ FieldCalculation: Values are equal, returning then_value: ${thenValue}`);
      return this.resolveValue(thenValue, formData);
    } else {
      console.log(`❌ FieldCalculation: Values are not equal, returning else_value: ${elseValue}`);
      return this.resolveValue(elseValue, formData);
    }
  }

  /**
   * Evaluate complex if conditional
   */
  private evaluateIf(rule: any, formData: { [key: string]: any }): any {
    const fieldName = rule.field;
    const fieldValue = formData[fieldName];
    const operator = rule.condition_operator || '=';
    const checkValue = rule.check_value;
    const thenValue = rule.then_value;
    const elseValue = rule.else_value;

    console.log(`🔀 FieldCalculation: Evaluating if "${fieldName}" (${fieldValue}) ${operator} ${checkValue}`);

    const conditionMet = this.evaluateCondition(fieldValue, operator, checkValue);

    if (conditionMet) {
      console.log(`✅ FieldCalculation: Condition met, returning then_value`);
      return this.resolveValue(thenValue, formData);
    } else {
      console.log(`❌ FieldCalculation: Condition not met, returning else_value`);
      return this.resolveValue(elseValue, formData);
    }
  }

  /**
   * Compare values for equality
   */
  private compareValues(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 === null || value1 === undefined) value1 = '';
    if (value2 === null || value2 === undefined) value2 = '';

    // Try numeric comparison first
    const num1 = Number(value1);
    const num2 = Number(value2);
    if (!isNaN(num1) && !isNaN(num2)) {
      return num1 === num2;
    }

    // String comparison
    return String(value1).trim() === String(value2).trim();
  }

  /**
   * Evaluate condition with operator
   */
  private evaluateCondition(fieldValue: any, operator: string, checkValue: any): boolean {
    switch (operator) {
      case '=':
      case '==':
        return this.compareValues(fieldValue, checkValue);
      case '!=':
        return !this.compareValues(fieldValue, checkValue);
      case '>':
        return this.getNumericValue(fieldValue) > this.getNumericValue(checkValue);
      case '<':
        return this.getNumericValue(fieldValue) < this.getNumericValue(checkValue);
      case '>=':
        return this.getNumericValue(fieldValue) >= this.getNumericValue(checkValue);
      case '<=':
        return this.getNumericValue(fieldValue) <= this.getNumericValue(checkValue);
      default:
        console.warn(`⚠️ FieldCalculation: Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Resolve value which might be a literal or a field reference
   */
  private resolveValue(value: any, formData: { [key: string]: any }): any {
    if (value && typeof value === 'object') {
      if (value.field) {
        // Field reference
        return formData[value.field];
      } else if (value.operation) {
        // Nested calculation
        return this.evaluateCalculationRule(value, formData);
      }
    }
    return value;
  }

  /**
   * Convert value to number, handling various formats
   */
  private getNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Get fields that a calculated field depends on
   */
  getFieldDependencies(field: ServiceFlowField): string[] {
    const dependencies = new Set<string>();

    if (!field.calculations) {
      return [];
    }

    field.calculations.forEach(calculation => {
      calculation.condition_logic.forEach(rule => {
        // Add field from rule
        if (rule.field) {
          dependencies.add(rule.field);
        }

        // Add field references in value
        if (rule.value) {
          if (typeof rule.value === 'object' && rule.value.field) {
            dependencies.add(rule.value.field);
          } else if (Array.isArray(rule.value)) {
            // For sum operations
            rule.value.forEach(fieldName => {
              if (typeof fieldName === 'string') {
                // Remove negative sign if present
                const cleanFieldName = fieldName.startsWith('-') ? fieldName.substring(1) : fieldName;
                dependencies.add(cleanFieldName);
              }
            });
          }
        }
      });
    });

    return Array.from(dependencies);
  }
}
